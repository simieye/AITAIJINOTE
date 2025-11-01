
    # 笔记生成云函数

    基于转录文本生成结构化笔记的云函数，使用 AI 技术自动整理语音转录内容为结构化的笔记。

    ## 功能特性

    - 接收转录文本和录音 ID
    - 调用 AI 生成结构化笔记（标题、摘要、要点、行动项、标签）
    - 自动保存到 notes 数据模型
    - 关联原始录音记录
    - 支持自定义标题

    ## 环境配置

    1. 安装依赖：
    ```bash
    npm install
    ```

    2. 配置环境变量：
    - `AI_API_URL`: AI 服务 API 地址（默认使用 OpenAI）
    - `AI_API_KEY`: AI 服务 API 密钥

    3. 创建数据模型：
    - 在云开发控制台创建 `note` 数据模型（结构见 `note-model.json`）
    - 确保 `recording` 模型已存在（来自音频转录云函数）

    ## 使用示例

    ### 小程序端调用

    ```javascript
    // 调用云函数生成笔记
    wx.cloud.callFunction({
      name: 'note-generation',
      data: {
        action: 'generateNote',
        data: {
          recordingId: '录音记录ID',
          transcription: '这里是转录的文本内容...',
          title: '会议记录' // 可选
        }
      },
      success(res) {
        if (res.result.code === 0) {
          console.log('笔记生成成功:', res.result.data)
          // 结果包含：
          // - noteId: 笔记ID
          // - title: 笔记标题
          // - summary: 内容摘要
          // - keyPoints: 关键要点数组
          // - actionItems: 行动项数组
          // - tags: 标签数组
        } else {
          console.error('生成失败:', res.result.message)
        }
      },
      fail(err) {
        console.error('调用失败:', err)
      }
    })
    ```

    ### Node.js 调用

    ```javascript
    const cloudbase = require('@cloudbase/node-sdk')
    const app = cloudbase.init()

    async function generateNote() {
      try {
        const result = await app.callFunction({
          name: 'note-generation',
          data: {
            action: 'generateNote',
            data: {
              recordingId: 'rec_123456789',
              transcription: '今天我们讨论了产品迭代的三个主要方向：第一，优化用户界面，提升用户体验；第二，增加数据分析功能，帮助用户更好地理解数据；第三，修复已知bug，提高系统稳定性。下一步需要设计师在一周内完成UI优化方案，开发团队需要在两周内完成数据分析功能的开发。',
              title: '产品迭代会议'
            }
          }
        })

        if (result.result.code === 0) {
          console.log('笔记生成成功:', result.result.data)
        } else {
          console.error('生成失败:', result.result.message)
        }
      } catch (error) {
        console.error('调用失败:', error)
      }
    }

    generateNote()
    ```

    ### 返回数据结构

    成功时返回：
    ```json
    {
      "code": 0,
      "message": "笔记生成成功",
      "data": {
        "noteId": "note_123456789",
        "title": "产品迭代会议记录",
        "summary": "讨论了产品迭代的三个主要方向，包括UI优化、数据分析功能开发和bug修复。",
        "keyPoints": [
          "优化用户界面，提升用户体验",
          "增加数据分析功能，帮助用户理解数据",
          "修复已知bug，提高系统稳定性"
        ],
        "actionItems": [
          "设计师一周内完成UI优化方案",
          "开发团队两周内完成数据分析功能开发"
        ],
        "tags": ["产品迭代", "会议记录", "开发计划", "UI优化", "数据分析"]
      }
    }
    ```

    失败时返回：
    ```json
    {
      "code": 400,
      "message": "缺少必要参数：recordingId 和 transcription",
      "data": null
    }
    ```

    ## 完整工作流程

    1. 音频转录云函数生成转录文本
    2. 调用本云函数传入转录文本和录音ID
    3. AI 分析转录内容并生成结构化笔记
    4. 保存笔记到数据模型
    5. 更新录音记录的笔记关联
    6. 返回笔记ID和内容

    ## 错误处理

    - `400`: 参数缺失或无效
    - `500`: 服务器内部错误（AI调用失败、数据库错误等）
  