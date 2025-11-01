
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
     * 调用 AI 生成测验题
     */
    async function generateQuizQuestions(noteContent) {
      const prompt = `你是一个专业的教育内容设计师，擅长将学习笔记转化为高质量的测验题。请根据以下笔记内容生成 5-10 道测验题。

笔记内容：
标题：${noteContent.title}
摘要：${noteContent.summary}
关键要点：${noteContent.keyPoints.join('；')}
行动项：${noteContent.actionItems.join('；')}

请生成结构化的测验题，每道题包含：
1. 题目类型：单选题、多选题、判断题或简答题
2. 题目内容：清晰明确的问题
3. 选项：如果是选择题，提供4个选项（A、B、C、D）
4. 正确答案：标准答案
5. 解析：详细的答案解释
6. 难度等级：1-5（1最简单，5最困难）
7. 相关标签：与题目相关的关键词

要求：
- 题目要覆盖笔记的核心内容
- 难度分布要合理，包含不同层次
- 选项要有区分度，避免明显错误
- 解析要详细，帮助理解知识点

请用JSON格式返回，格式如下：
{
  "questions": [
    {
      "type": "single_choice",
      "question": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "correctAnswer": "A",
      "explanation": "答案解析",
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
                content: '你是一个专业的教育内容设计师，擅长将学习内容转化为高质量的测验题。'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2500
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
          return parseQuizResponse(content);
        }
      } catch (error) {
        throw new Error(`测验生成失败: ${error.message}`);
      }
    }

    /**
     * 手动解析 AI 响应（备用方案）
     */
    function parseQuizResponse(content) {
      const lines = content.split('\n').filter(line => line.trim());
      const questions = [];
      let currentQuestion = null;

      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.includes('"type":') || trimmed.includes('类型：')) {
          if (currentQuestion) questions.push(currentQuestion);
          currentQuestion = {
            type: 'single_choice',
            question: '',
            options: [],
            correctAnswer: '',
            explanation: '',
            difficulty: 3,
            tags: []
          };
          
          const typeMatch = trimmed.match(/["']?类型["']?:\s*["']?([^"']+)["']?/);
          if (typeMatch) {
            currentQuestion.type = mapQuestionType(typeMatch[1]);
          }
        } else if (trimmed.includes('"question":') || trimmed.includes('题目：')) {
          const match = trimmed.match(/["']?题目["']?:\s*["']?([^"']+)["']?/);
          if (match && currentQuestion) {
            currentQuestion.question = match[1].trim();
          }
        } else if (trimmed.includes('"options":') || trimmed.includes('选项：')) {
          // 解析选项数组
          const optionsMatch = content.match(/"options":\s*\[([^\]]+)\]/);
          if (optionsMatch && currentQuestion) {
            currentQuestion.options = optionsMatch[1].split(',').map(opt => opt.trim().replace(/["']/g, ''));
          }
        } else if (trimmed.includes('"correctAnswer":') || trimmed.includes('正确答案：')) {
          const match = trimmed.match(/["']?正确答案["']?:\s*["']?([^"']+)["']?/);
          if (match && currentQuestion) {
            currentQuestion.correctAnswer = match[1].trim();
          }
        } else if (trimmed.includes('"explanation":') || trimmed.includes('解析：')) {
          const match = trimmed.match(/["']?解析["']?:\s*["']?([^"']+)["']?/);
          if (match && currentQuestion) {
            currentQuestion.explanation = match[1].trim();
          }
        } else if (trimmed.includes('"difficulty":') || trimmed.includes('难度：')) {
          const match = trimmed.match(/["']?难度["']?:\s*(\d)/);
          if (match && currentQuestion) {
            currentQuestion.difficulty = parseInt(match[1]);
          }
        } else if (trimmed.includes('"tags":') || trimmed.includes('标签：')) {
          const tagsMatch = content.match(/"tags":\s*\[([^\]]+)\]/);
          if (tagsMatch && currentQuestion) {
            currentQuestion.tags = tagsMatch[1].split(',').map(tag => tag.trim().replace(/["']/g, ''));
          }
        }
      }

      if (currentQuestion && currentQuestion.question) {
        questions.push(currentQuestion);
      }

      // 如果解析失败，创建默认测验题
      if (questions.length === 0) {
        return createDefaultQuiz(noteContent);
      }

      return { questions };
    }

    /**
     * 映射题目类型
     */
    function mapQuestionType(typeStr) {
      const typeMap = {
        '单选题': 'single_choice',
        '多选题': 'multiple_choice',
        '判断题': 'true_false',
        '简答题': 'short_answer',
        '选择题': 'single_choice'
      };
      
      return typeMap[typeStr] || 'single_choice';
    }

    /**
     * 创建默认测验题（备用方案）
     */
    function createDefaultQuiz(noteContent) {
      const questions = [];
      
      // 基于关键要点创建测验题
      noteContent.keyPoints.forEach((point, index) => {
        if (index < 5) {
          questions.push({
            type: 'single_choice',
            question: `关于"${noteContent.title}"，以下哪项是正确的？`,
            options: [
              point,
              `与${point}无关的内容`,
              `部分相关的${point}`,
              `相反的${point}`
            ],
            correctAnswer: 'A',
            explanation: `正确答案是"${point}"，这是笔记中的关键要点之一。`,
            difficulty: 2,
            tags: ['要点', '核心内容']
          });
        }
      });

      // 基于摘要创建简答题
      if (noteContent.summary) {
        questions.push({
          type: 'short_answer',
          question: `请简要描述"${noteContent.title}"的核心内容`,
          options: [],
          correctAnswer: noteContent.summary,
          explanation: `核心内容是：${noteContent.summary}`,
          difficulty: 1,
          tags: ['摘要', '核心']
        });
      }

      return { questions };
    }

    /**
     * 保存测验题到数据模型
     */
    async function saveQuizQuestions(noteId, questions) {
      try {
        const savedQuestions = [];
        
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          const result = await models.quiz.create({
            data: {
              noteId: noteId,
              type: question.type,
              question: question.question,
              options: question.options || [],
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
              difficulty: question.difficulty,
              tags: question.tags,
              order: i + 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          });
          savedQuestions.push(result.data);
        }
        
        return savedQuestions;
      } catch (error) {
        throw new Error(`保存测验题失败: ${error.message}`);
      }
    }

    /**
     * 更新笔记的测验关联
     */
    async function updateNoteQuiz(noteId, questionCount) {
      try {
        await models.note.update({
          id: noteId,
          data: {
            hasQuiz: true,
            quizCount: questionCount,
            updatedAt: new Date().toISOString()
          }
        });
      } catch (error) {
        console.warn('更新笔记测验关联失败:', error.message);
      }
    }

    exports.main = async (event, context) => {
      try {
        const { action, data } = event;

        if (action !== 'generateQuiz') {
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

        // 2. 调用 AI 生成测验题
        const quizResult = await generateQuizQuestions(note);

        // 3. 保存测验题到数据模型
        const savedQuestions = await saveQuizQuestions(noteId, quizResult.questions);

        // 4. 更新笔记的测验关联
        await updateNoteQuiz(noteId, savedQuestions.length);

        // 5. 返回结果
        return {
          code: 0,
          message: '测验生成成功',
          data: {
            questions: savedQuestions.map(q => ({
              id: q._id,
              type: q.type,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              difficulty: q.difficulty,
              tags: q.tags,
              order: q.order
            })),
            totalCount: savedQuestions.length
          }
        };

      } catch (error) {
        console.error('测验生成错误:', error);
        
        return {
          code: 500,
          message: error.message || '测验生成失败',
          data: null
        };
      }
    };
  