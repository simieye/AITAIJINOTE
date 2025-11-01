
    'use strict';

    const cloudbase = require('@cloudbase/node-sdk');
    const app = cloudbase.init();
    const models = app.models;

    // AI 服务配置
    const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
    const AI_API_KEY = process.env.AI_API_KEY || 'your-openai-api-key';

    /**
     * 获取笔记详情
     */
    async function getNoteDetail(noteId) {
      try {
        const result = await models.note.get({
          id: noteId
        });
        
        if (!result.data) {
          throw new Error('笔记不存在');
        }
        
        return result.data;
      } catch (error) {
        throw new Error(`获取笔记失败: ${error.message}`);
      }
    }

    /**
     * 调用 AI 生成闪卡
     */
    async function generateFlashcards(noteContent) {
      const prompt = `你是一个专业的学习助手，擅长将笔记内容转化为高质量的学习闪卡。请根据以下笔记内容生成 5-15 张学习闪卡。

笔记内容：
标题：${noteContent.title}
摘要：${noteContent.summary}
关键要点：${noteContent.keyPoints.join(', ')}
行动项：${noteContent.actionItems.join(', ')}

请生成结构化的学习闪卡，每张卡片包含：
1. 正面：问题或提示（简洁明了）
2. 背面：答案或解释（详细准确）
3. 难度等级：1-5（1最简单，5最困难）
4. 相关标签：与卡片内容相关的关键词

要求：
- 问题要清晰具体，避免模糊表述
- 答案要准确完整，包含必要细节
- 难度等级要合理，覆盖不同层次
- 标签要精准，便于分类复习

请用JSON格式返回，格式如下：
{
  "flashcards": [
    {
      "front": "问题或提示",
      "back": "答案或解释",
      "difficulty": 3,
      "tags": ["标签1", "标签2"]
    }
  ]
}`;

      try {
        const response = await fetch(AI_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: '你是一个专业的学习助手，擅长将学习内容转化为高质量的记忆闪卡。'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          throw new Error(`AI API 调用失败: ${response.statusText}`);
        }

        const result = await response.json();
        const content = result.choices[0].message.content;
        
        // 解析 JSON 响应
        try {
          return JSON.parse(content);
        } catch (parseError) {
          // 如果 AI 返回的不是有效 JSON，手动解析
          return parseFlashcardResponse(content);
        }
      } catch (error) {
        throw new Error(`闪卡生成失败: ${error.message}`);
      }
    }

    /**
     * 手动解析 AI 响应（备用方案）
     */
    function parseFlashcardResponse(content) {
      const lines = content.split('\n').filter(line => line.trim());
      const flashcards = [];
      let currentCard = null;

      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.includes('"front":') || trimmed.includes('正面：')) {
          if (currentCard) flashcards.push(currentCard);
          currentCard = {
            front: '',
            back: '',
            difficulty: 3,
            tags: []
          };
          
          const match = trimmed.match(/["']?正面["']?:["']?([^"']+)["']?/);
          if (match) {
            currentCard.front = match[1].trim();
          }
        } else if (trimmed.includes('"back":') || trimmed.includes('背面：')) {
          const match = trimmed.match(/["']?背面["']?:["']?([^"']+)["']?/);
          if (match && currentCard) {
            currentCard.back = match[1].trim();
          }
        } else if (trimmed.includes('"difficulty":') || trimmed.includes('难度：')) {
          const match = trimmed.match(/["']?难度["']?:\s*(\d)/);
          if (match && currentCard) {
            currentCard.difficulty = parseInt(match[1]);
          }
        } else if (trimmed.includes('"tags":') || trimmed.includes('标签：')) {
          const match = trimmed.match(/["']?标签["']?:\s*\[([^\]]+)\]/);
          if (match && currentCard) {
            currentCard.tags = match[1].split(',').map(tag => tag.trim().replace(/["']/g, ''));
          }
        }
      }

      if (currentCard && currentCard.front && currentCard.back) {
        flashcards.push(currentCard);
      }

      // 如果解析失败，创建默认闪卡
      if (flashcards.length === 0) {
        return createDefaultFlashcards(content);
      }

      return { flashcards };
    }

    /**
     * 创建默认闪卡（备用方案）
     */
    function createDefaultFlashcards(noteContent) {
      const flashcards = [];
      
      // 基于关键要点创建闪卡
      noteContent.keyPoints.forEach((point, index) => {
        flashcards.push({
          front: `关键要点 ${index + 1} 是什么？`,
          back: point,
          difficulty: 2,
          tags: ['要点', '核心内容']
        });
      });

      // 基于行动项创建闪卡
      noteContent.actionItems.forEach((item, index) => {
        flashcards.push({
          front: `行动项 ${index + 1} 是什么？`,
          back: item,
          difficulty: 3,
          tags: ['行动项', '待办']
        });
      });

      // 基于摘要创建闪卡
      if (noteContent.summary) {
        flashcards.push({
          front: '这篇笔记的核心内容是什么？',
          back: noteContent.summary,
          difficulty: 1,
          tags: ['摘要', '核心']
        });
      }

      return { flashcards };
    }

    /**
     * 保存闪卡到数据模型
     */
    async function saveFlashcards(noteId, flashcards) {
      try {
        const savedCards = [];
        
        for (let i = 0; i < flashcards.length; i++) {
          const card = flashcards[i];
          const result = await models.flashcard.create({
            data: {
              noteId: noteId,
              front: card.front,
              back: card.back,
              difficulty: card.difficulty,
              tags: card.tags,
              order: i + 1,
              createdAt: new Date().toISOString(),
              lastReviewedAt: null,
              reviewCount: 0,
              nextReviewDate: new Date().toISOString()
            }
          });
          savedCards.push(result.data);
        }
        
        return savedCards;
      } catch (error) {
        throw new Error(`保存闪卡失败: ${error.message}`);
      }
    }

    /**
     * 更新笔记的闪卡关联
     */
    async function updateNoteFlashcards(noteId, flashcardCount) {
      try {
        await models.note.update({
          id: noteId,
          data: {
            hasFlashcards: true,
            flashcardCount: flashcardCount,
            updatedAt: new Date().toISOString()
          }
        });
      } catch (error) {
        console.warn('更新笔记闪卡关联失败:', error.message);
      }
    }

    exports.main = async (event, context) => {
      try {
        const { action, data } = event;

        if (action !== 'generateFlashcards') {
          return {
            code: 400,
            message: '无效的操作类型',
            data: null
          };
        }

        const { noteId, customPrompt } = data;

        if (!noteId) {
          return {
            code: 400,
            message: '缺少必要参数：noteId',
            data: null
          };
        }

        // 1. 获取笔记详情
        const note = await getNoteDetail(noteId);

        // 2. 调用 AI 生成闪卡
        const flashcardResult = await generateFlashcards(note);

        // 3. 保存闪卡到数据模型
        const savedFlashcards = await saveFlashcards(noteId, flashcardResult.flashcards);

        // 4. 更新笔记的闪卡关联
        await updateNoteFlashcards(noteId, savedFlashcards.length);

        // 5. 返回结果
        return {
          code: 0,
          message: '闪卡生成成功',
          data: {
            flashcards: savedFlashcards.map(card => ({
              id: card._id,
              front: card.front,
              back: card.back,
              difficulty: card.difficulty,
              tags: card.tags,
              order: card.order
            })),
            totalCount: savedFlashcards.length
          }
        };

      } catch (error) {
        console.error('闪卡生成错误:', error);
        
        return {
          code: 500,
          message: error.message || '闪卡生成失败',
          data: null
        };
      }
    };
  