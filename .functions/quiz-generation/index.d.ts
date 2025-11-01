
    interface QuizQuestion {
      _id?: string;
      noteId: string;
      type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      difficulty: number;
      tags: string[];
      order: number;
      createdAt: string;
      updatedAt: string;
    }

    interface GenerateQuizRequest {
      action: 'generateQuiz';
      data: {
        noteId: string;
        customPrompt?: string;
      };
    }

    interface QuizResponse {
      id: string;
      type: string;
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      difficulty: number;
      tags: string[];
      order: number;
    }

    interface GenerateQuizResponse {
      code: number;
      message: string;
      data: {
        questions: QuizResponse[];
        totalCount: number;
      } | null;
    }

    export declare function main(event: GenerateQuizRequest, context: any): Promise<GenerateQuizResponse>;
  