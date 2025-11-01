
    'use strict';

    const cloudbase = require('@cloudbase/node-sdk');
    const formidable = require('formidable');
    const mime = require('mime-types');
    const fs = require('fs');
    const path = require('path');

    // 初始化 CloudBase
    const app = cloudbase.init();
    const models = app.models;

    // Whisper API 配置
    const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
    const WHISPER_API_KEY = process.env.WHISPER_API_KEY || 'your-openai-api-key';

    /**
     * 上传音频文件到云存储
     */
    async function uploadAudioFile(file, metadata) {
      const fileName = `${Date.now()}_${file.originalFilename}`;
      const filePath = file.filepath;
      
      try {
        // 读取文件内容
        const fileBuffer = fs.readFileSync(filePath);
        
        // 上传到云存储
        const result = await app.uploadFile({
          cloudPath: `recordings/${fileName}`,
          fileContent: fileBuffer,
        });
        
        // 删除临时文件
        fs.unlinkSync(filePath);
        
        return {
          fileID: result.fileID,
          fileName: fileName,
          size: file.size,
          mimeType: file.mimetype
        };
      } catch (error) {
        // 清理临时文件
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw new Error(`文件上传失败: ${error.message}`);
      }
    }

    /**
     * 调用 Whisper API 进行语音转录
     */
    async function transcribeAudio(fileID) {
      try {
        // 从云存储下载文件
        const fileContent = await app.downloadFile({
          fileID: fileID
        });

        // 创建 FormData
        const formData = new FormData();
        const blob = new Blob([fileContent.fileContent], { type: 'audio/mpeg' });
        formData.append('file', blob, 'audio.mp3');
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'json');

        // 调用 Whisper API
        const response = await fetch(WHISPER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHISPER_API_KEY}`,
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Whisper API 调用失败: ${response.statusText}`);
        }

        const result = await response.json();
        return result.text;
      } catch (error) {
        throw new Error(`语音转录失败: ${error.message}`);
      }
    }

    /**
     * 保存录音元数据到数据模型
     */
    async function saveRecordingMetadata(recordingData) {
      try {
        const result = await models.recording.create({
          data: {
            fileID: recordingData.fileID,
            fileName: recordingData.fileName,
            title: recordingData.title || '未命名录音',
            tags: recordingData.tags || [],
            transcription: recordingData.transcription,
            duration: recordingData.duration || 0,
            fileSize: recordingData.size,
            mimeType: recordingData.mimeType,
            createdAt: new Date().toISOString(),
            status: 'completed'
          }
        });
        
        return result.data;
      } catch (error) {
        throw new Error(`保存录音元数据失败: ${error.message}`);
      }
    }

    /**
     * 解析 multipart/form-data 请求
     */
    async function parseMultipartRequest(req) {
      return new Promise((resolve, reject) => {
        const form = formidable({
          multiples: false,
          keepExtensions: true,
          maxFileSize: 50 * 1024 * 1024, // 50MB
          filter: function ({ name, originalFilename, mimetype }) {
            // 只允许音频文件
            return mimetype && mimetype.startsWith('audio/');
          }
        });

        form.parse(req, (err, fields, files) => {
          if (err) {
            reject(new Error(`文件解析失败: ${err.message}`));
            return;
          }
          
          if (!files.file) {
            reject(new Error('未找到音频文件'));
            return;
          }

          resolve({
            file: Array.isArray(files.file) ? files.file[0] : files.file,
            title: fields.title ? (Array.isArray(fields.title) ? fields.title[0] : fields.title) : null,
            tags: fields.tags ? (Array.isArray(fields.tags) ? fields.tags : [fields.tags]) : []
          });
        });
      });
    }

    /**
     * 获取音频时长（模拟实现，实际项目中可以使用音频处理库）
     */
    async function getAudioDuration(filePath) {
      // 这里简化处理，实际项目中可以使用 ffprobe 或其他音频处理库
      return 0;
    }

    exports.main = async (event, context) => {
      try {
        // 检查请求方法
        if (event.httpMethod !== 'POST') {
          return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: '仅支持 POST 方法' })
          };
        }

        // 解析 multipart/form-data
        const { file, title, tags } = await parseMultipartRequest({
          headers: event.headers,
          body: event.body,
          isBase64Encoded: event.isBase64Encoded
        });

        // 验证文件格式
        const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/webm'];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error('不支持的音频格式，请上传 MP3、WAV、M4A 或 WEBM 格式');
        }

        // 1. 上传音频文件到云存储
        const uploadResult = await uploadAudioFile(file, { title, tags });

        // 2. 调用 Whisper 进行语音转录
        const transcription = await transcribeAudio(uploadResult.fileID);

        // 3. 获取音频时长
        const duration = await getAudioDuration(file.filepath);

        // 4. 保存录音元数据
        const recording = await saveRecordingMetadata({
          ...uploadResult,
          title,
          tags,
          transcription,
          duration
        });

        // 5. 返回成功响应
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordingId: recording._id,
            transcription: transcription,
            duration: duration,
            fileID: uploadResult.fileID
          })
        };

      } catch (error) {
        console.error('音频转录错误:', error);
        
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.message || '处理音频文件时发生错误'
          })
        };
      }
    };
  