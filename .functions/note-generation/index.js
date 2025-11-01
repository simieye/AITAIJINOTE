
    'use strict';

    const cloudbase = require('@cloudbase/node-sdk');
    const app = cloudbase.init();
    const models = app.models;

    // AI 服务配置
    const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
    const AI_API_KEY = process.env.AI_API_KEY || 'your-openai-api-key';

    /**
     * 调用 AI 生成结构化笔记
     */
    async function generateStructuredNotes(transcription, title = '') {
      const prompt = `你是一个专业的笔记整理助手。请根据以下转录文本生成结构化的笔记。

转录文本：${transcription}

请按照以下格式生成笔记：
1. 标题：${title || '根据内容生成简洁的标题'}
2. 摘要：用2-3句话总结核心内容
3. 要点：列出3-5个关键要点，每个要点不超过50字
4. 行动项：如果有需要后续行动的内容，列出具体行动项
5. 标签：根据内容推荐3-5个标签，用逗号分隔

请用JSON格式返回，格式如下：
{
  "title": "笔记标题",
  "summary": "内容摘要",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "actionItems": ["行动项1", "行动项2"],
  "tags": ["标签1", "标签2", "标签3"]
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
                content: '你是一个专业的笔记整理助手，擅长将语音转录内容整理成结构化的笔记。'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
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
          return parseAIResponse(content);
        }
      } catch (error) {
        throw new Error(`笔记生成失败: ${error.message}`);
      }
    }

    /**
     * 手动解析 AI 响应（备用方案）
     */
    function parseAIResponse(content) {
      const lines = content.split('\n').filter(line => line.trim());
      const result = {
        title: '',
        summary: '',
        keyPoints: [],
        actionItems: [],
        tags: []
      };

      let currentSection = '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.includes('标题：') || trimmed.includes('title:')) {
          result.title = trimmed.replace(/["']?标题["']?:["']?/g, '').replace(/["']$/g, '').trim();
        } else if (trimmed.includes('摘要：') || trimmed.includes('summary:')) {
          result.summary = trimmed.replace(/["']?摘要["']?:["']?/g, '').replace(/["']$/g, '').trim();
        } else if (trimmed.includes('要点：') || trimmed.includes('keyPoints:')) {
          currentSection = 'keyPoints';
        } else if (trimmed.includes('行动项：') || trimmed.includes('actionItems:')) {
          currentSection = 'actionItems';
        } else if (trimmed.includes('标签：') || trimmed.includes('tags:')) {
          const tagsStr = trimmed.replace(/["']?标签["']?:["']?/g, '').replace(/["']$/g, '').trim();
          result.tags = tagsStr.split(',').map(tag => tag.trim());
        } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
          const item = trimmed.replace(/^[-•]\s*/, '').trim();
          if (currentSection === 'keyPoints' && item) {
            result.keyPoints.push(item);
          } else if (currentSection === 'actionItems' && item) {
            result.actionItems.push(item);
          }
        }
      }

      // 确保至少有默认值
      if (!result.title) result.title = '未命名笔记';
      if (!result.summary) result.summary = transcription.substring(0, 100) + '...';
      if (result.keyPoints.length === 0) result.keyPoints = ['无关键要点'];
      if (result.tags.length === 0) result.tags = ['笔记'];

      return result;
    }

    /**
     * 获取录音信息
     */
    async function getRecordingInfo(recordingId) {
      try {
        const result = await models.recording.get({
          id: recordingId
        });
        
        if (!result.data) {
          throw new Error('录音记录不存在');
        }
        
        return result.data;
      } catch (error) {
        throw new Error(`获取录音信息失败: ${error.message}`);
      }
    }

    /**
     * 保存笔记到数据模型
     */
    async function saveNote(noteData) {
      try {
        const result = await models.note.create({
          data: {
            recordingId: noteData.recordingId,
            title: noteData.title,
            summary: noteData.summary,
            keyPoints: noteData.keyPoints,
            actionItems: noteData.actionItems,
            tags: noteData.tags,
            originalTranscription: noteData.originalTranscription,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        });
        
        return result.data;
      } catch (error) {
        throw new Error(`保存笔记失败: ${error.message}`);
      }
    }

    /**
     * 更新录音的笔记关联
     */
    async function updateRecordingNote(recordingId, noteId) {
      try {
        await models.recording.update({
          id: recordingId,
          data: {
            noteId: noteId,
            hasNote: true,
            updatedAt: new Date().toISOString()
          }
        });
      } catch (error) {
        console.warn('更新录音笔记关联失败:', error.message);
      }
    }

    exports.main = async (event, context) => {
      try {
        const { action, data } = event;

        if (action !== 'generateNote') {
          return {
            code: 400,
            message: '无效的操作类型',
            data: null
          };
        }

        const { recordingId, transcription, title, customPrompt } = data;

        if (!recordingId || !transcription) {
          return {
            code: 400,
            message: '缺少必要参数：recordingId 和 transcription',
            data: null
          };
        }

        // 1. 获取录音信息（可选）
        let recordingTitle = title;
        if (!recordingTitle && recordingId) {
          try {
            const recording = await getRecordingInfo(recordingId);
            recordingTitle = recording.title;
          } catch (error) {
            console.warn('获取录音信息失败:', error.message);
          }
        }

        // 2. 调用 AI 生成结构化笔记
        const structuredNotes = await generateStructuredNotes(transcription, recordingTitle);

        // 3. 保存笔记到数据模型
        const noteData = {
          recordingId,
          title: structuredNotes.title,
          summary: structuredNotes.summary,
          keyPoints: structuredNotes.keyPoints,
          actionItems: structuredNotes.actionItems,
          tags: structuredNotes.tags,
          originalTranscription: transcription
        };

        const savedNote = await saveNote(noteData);

        // 4. 更新录音的笔记关联
        await updateRecordingNote(recordingId, savedNote._id);

        // 5. 返回结果
        return {
          code: 0,
          message: '笔记生成成功',
          data: {
            noteId: savedNote._id,
            title: savedNote.title,
            summary: savedNote.summary,
            keyPoints: savedNote.keyPoints,
            actionItems: savedNote.actionItems,
            tags: savedNote.tags
          }
        };

      } catch (error) {
        console.error('笔记生成错误:', error);
        
        return {
          code: 500,
          message: error.message || '笔记生成失败',
          data: null
        };
      }
    };
  