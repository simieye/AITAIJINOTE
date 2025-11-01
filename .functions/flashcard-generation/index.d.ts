
    interface Flashcard {
      _id?: string;
      noteId: string;
      front: string;
      back: string;
      difficulty: number;
      tags: string[];
      order: number;
      createdAt: string;
      lastReviewedAt: string | null;
      reviewCount: number;
      nextReviewDate: string;
    }

    interface GenerateFlashcardsRequest {
      action: 'generateFlashcards';
      data: {
        noteId: string;
        customPrompt?: string;
      };
    }

    interface FlashcardResponse {
      id: string;
      front: string;
      back: string;
      difficulty: number;
      tags: string[];
      order: number;
    }

    interface GenerateFlashcardsResponse {
      code: number;
      message: string;
      data: {
        flashcards: FlashcardResponse[];
        totalCount: number;
      } | null;
    }

    export declare function main(event: GenerateFlashcardsRequest, context: any): Promise<GenerateFlashcardsResponse>;
  