
    # 音频转录云函数

    这是一个用于处理音频文件上传和语音转录的云函数。

    ## 功能特性

    - 支持上传 MP3、WAV、M4A、WEBM 等常见音频格式
    - 使用 OpenAI Whisper API 进行语音转录
    - 自动保存录音元数据到数据模型
    - 支持自定义标题和标签

    ## 环境配置

    1. 安装依赖：
    ```bash
    npm install
    ```

    2. 配置环境变量：
    - `WHISPER_API_KEY`: OpenAI API 密钥

    ## 使用示例

    ### 小程序端调用

    ```javascript
    // 选择音频文件
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['mp3', 'wav', 'm4a'],
      success(res) {
        const tempFilePath = res.tempFiles[0].path
        
        // 上传并转录
        wx.uploadFile({
          url: '云函数URL',
          filePath: tempFilePath,
          name: 'file',
          formData: {
            title: '会议录音',
            tags: JSON.stringify(['会议', '重要'])
          },
          success(res) {
            const data = JSON.parse(res.data)
            console.log('转录结果:', data.transcription)
            console.log('录音ID:', data.recordingId)
          }
        })
      }
    })
    ```

    ### Node.js 调用

    ```javascript
    const fs = require('fs')
    const FormData = require('form-data')
    const axios = require('axios')

    const form = new FormData()
    form.append('file', fs.createReadStream('audio.mp3'))
    form.append('title', '测试录音')
    form.append('tags', JSON.stringify(['测试', 'demo']))

    axios.post('云函数URL', form, {
      headers: form.getHeaders()
    }).then(res => {
      console.log('转录结果:', res.data.transcription)
      console.log('录音ID:', res.data.recordingId)
    })
    ```

    ## 错误处理

    函数会返回以下错误信息：

    - `不支持的音频格式`: 上传了不支持的文件格式
    - `文件上传失败`: 云存储上传失败
    - `语音转录失败`: Whisper API 调用失败
    - `保存录音元数据失败`: 数据模型保存失败

    ## 数据模型

    函数会自动创建 `recording` 数据模型，包含以下字段：

    - `fileID`: 云存储文件ID
    - `fileName`: 原始文件名
    - `title`: 录音标题
    - `tags`: 标签数组
    - `transcription`: 转录文本
    - `duration`: 音频时长（秒）
    - `fileSize`: 文件大小（字节）
    - `mimeType`: MIME类型
    - `createdAt`: 创建时间
    - `status`: 处理状态
  