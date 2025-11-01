
    # 闪卡生成云函数

    基于笔记内容自动生成学习闪卡的云函数，使用 AI 技术将笔记转化为结构化的学习卡片，支持间隔复习。

    ## 功能特性

    - 接收笔记 ID，自动获取笔记内容
    - 调用 AI 生成 5-15 张高质量学习闪卡
    - 每张闪卡包含问题、答案、难度等级和标签
    - 自动保存到 flashcards 数据模型
    - 支持间隔复习算法
    - 关联原始笔记记录

    ## 环境配置

    1. 安装依赖：
    ```bash
    npm install
    ```

    2. 配置环境变量：
    - `AI_API_URL`: AI 服务 API 地址（默认使用 OpenAI）
    - `AI_API_KEY`: AI 服务 API 密钥

    3. 创建数据模型：
    - 在云开发控制台创建 `flashcard` 数据模型（结构见 `flashcard-model.json`）
    - 确保 `note` 模型已存在（来自笔记生成云函数）

    ## 使用示例

    ### 小程序端调用

    ```javascript
    // 调用云函数生成闪卡
    wx.cloud.callFunction({
      name: 'flashcard-generation',
      data: {
        action: 'generateFlashcards',
        data: {
          noteId: '笔记记录ID'
        }
      },
      success(res) {
        if (res.result.code === 0) {
          console.log('闪卡生成成功:', res.result.data)
          // 结果包含：
          // - flashcards: 闪卡列表
          // - totalCount: 闪卡总数
          
          // 示例闪卡数据
          res.result.data.flashcards.forEach(card => {
            console.log(`问题: ${card.front}`)
            console.log(`答案: ${card.back}`)
            console.log(`难度: ${card.difficulty}`)
            console.log(`标签: ${card.tags.join(', ')}`)
          })
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

    async function generateFlashcards() {
      try {
        const result = await app.callFunction({
          name: 'flashcard-generation',
          data: {
            action: 'generateFlashcards',
            data: {
              noteId: 'note_123456789'
            }
          }
        })

        if (result.result.code === 0) {
          console.log('闪卡生成成功:', result.result.data)
        } else {
          console.error('生成失败:', result.result.message)
        }
      } catch (error) {
        console.error('调用失败:', error)
      }
    }

    generateFlashcards()
    ```

    ### 返回数据结构

    成功时返回：
    ```json
    {
      "code": 0,
      "message": "闪卡生成成功",
      "data": {
        "flashcards": [
          {
            "id": "card_123456789",
            "front": "产品迭代的三个主要方向是什么？",
            "back": "1. 优化用户界面，提升用户体验\n2. 增加数据分析功能，帮助用户理解数据\n3. 修复已知bug，提高系统稳定性",
            "difficulty": 2,
            "tags": ["产品迭代", "核心要点"],
            "order": 1
          },
          {
            "id": "card_987654321",
            "front": "UI优化方案需要在多久内完成？",
            "back": "设计师需要在一周内完成UI优化方案",
            "difficulty": 3,
            "tags": ["行动项", "时间规划"],
            "order": 2
          }
        ],
        "totalCount": 8
      }
    }
    ```

    失败时返回：
    ```json
    {
      "code": 400,
      "message": "缺少必要参数：noteId",
      "data": null
    }
    ```

    ## 完整工作流程

    1. 音频转录云函数 → 生成转录文本
    2. 笔记生成云函数 → 基于转录文本生成结构化笔记
    3. 闪卡生成云函数 → 基于笔记内容生成学习闪卡

    ## 闪卡复习功能

    闪卡模型包含复习相关字段，可用于实现间隔复习：
    - `lastReviewedAt`: 最后复习时间
    - `reviewCount`: 复习次数
    - `nextReviewDate`: 下次复习日期

    ## 错误处理

    - `400`: 参数缺失或无效
    - `404`: 笔记不存在
    - `500`: 服务器内部错误（AI调用失败、数据库错误等）
  