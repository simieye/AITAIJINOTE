
    # 测验生成云函数

    基于笔记内容自动生成测验题的云函数，使用 AI 技术将学习笔记转化为结构化的测验题，支持多种题型和难度等级。

    ## 功能特性

    - 接收笔记 ID，自动获取笔记内容
    - 调用 AI 生成 5-10 道高质量测验题
    - 支持单选题、多选题、判断题、简答题
    - 每道题包含题目、选项、答案、解析、难度和标签
    - 自动保存到 quizzes 数据模型
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
    - 在云开发控制台创建 `quiz` 数据模型（结构见 `quiz-model.json`）
    - 确保 `note` 模型已存在（来自笔记生成云函数）

    ## 使用示例

    ### 小程序端调用

    ```javascript
    // 调用云函数生成测验题
    wx.cloud.callFunction({
      name: 'quiz-generation',
      data: {
        action: 'generateQuiz',
        data: {
          noteId: '笔记记录ID'
        }
      },
      success(res) {
        if (res.result.code === 0) {
          console.log('测验生成成功:', res.result.data)
          // 结果包含：
          // - questions: 测验题列表
          // - totalCount: 题目总数
          
          // 示例测验题数据
          res.result.data.questions.forEach(q => {
            console.log(`题目 ${q.order}: ${q.question}`)
            console.log(`类型: ${q.type}`)
            console.log(`选项: ${q.options.join(' | ')}`)
            console.log(`答案: ${q.correctAnswer}`)
            console.log(`解析: ${q.explanation}`)
            console.log(`难度: ${q.difficulty}`)
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

    async function generateQuiz() {
      try {
        const result = await app.callFunction({
          name: 'quiz-generation',
          data: {
            action: 'generateQuiz',
            data: {
              noteId: 'note_123456789'
            }
          }
        })

        if (result.result.code === 0) {
          console.log('测验生成成功:', result.result.data)
        } else {
          console.error('生成失败:', result.result.message)
        }
      } catch (error) {
        console.error('调用失败:', error)
      }
    }

    generateQuiz()
    ```

    ### 返回数据结构

    成功时返回：
    ```json
    {
      "code": 0,
      "message": "测验生成成功",
      "data": {
        "questions": [
          {
            "id": "quiz_123456789",
            "type": "single_choice",
            "question": "产品迭代的三个主要方向是什么？",
            "options": [
              "UI优化、数据分析、bug修复",
              "市场推广、用户增长、品牌建设",
              "技术架构、团队管理、财务规划",
              "产品设计、用户体验、商业模式"
            ],
            "correctAnswer": "A",
            "explanation": "根据笔记内容，产品迭代的三个主要方向是：1. 优化用户界面，提升用户体验；2. 增加数据分析功能，帮助用户理解数据；3. 修复已知bug，提高系统稳定性。",
            "difficulty": 2,
            "tags": ["产品迭代", "核心要点"],
            "order": 1
          },
          {
            "id": "quiz_987654321",
            "type": "short_answer",
            "question": "UI优化方案需要在多久内完成？",
            "options": [],
            "correctAnswer": "设计师需要在一周内完成UI优化方案",
            "explanation": "笔记中明确指出，设计师需要在一周内完成UI优化方案，这是具体的行动项和时间要求。",
            "difficulty": 3,
            "tags": ["行动项", "时间规划"],
            "order": 2
          }
        ],
        "totalCount": 7
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

    ## 完整学习工作流

    1. 音频转录云函数 → 生成转录文本
    2. 笔记生成云函数 → 基于转录文本生成结构化笔记
    3. 闪卡生成云函数 → 基于笔记内容生成学习闪卡
    4. 测验生成云函数 → 基于笔记内容生成测验题

    ## 题目类型说明

    - **single_choice**: 单选题，只有一个正确答案
    - **multiple_choice**: 多选题，可能有多个正确答案
    - **true_false**: 判断题，答案为 true/false
    - **short_answer**: 简答题，需要文字回答

    ## 难度等级

    - 1: 基础记忆题
    - 2: 理解应用题
    - 3: 分析综合题
    - 4: 评价判断题
    - 5: 创新拓展题

    ## 错误处理

    - `400`: 参数缺失或无效
    - `404`: 笔记不存在
    - `500`: 服务器内部错误（AI调用失败、数据库错误等）
  