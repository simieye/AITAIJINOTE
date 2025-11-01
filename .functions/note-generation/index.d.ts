
    interface Note {
      _id?: string;
      recordingId: string;
      title: string;
      summary: string;
      keyPoints: string[];
      actionItems: string[];
      tags: string[];
      originalTranscription: string;
      createdAt: string;
      updatedAt: string;
    }

    interface StructuredNotes {
      title: string;
      summary: string;
      keyPoints: string[];
      actionItems: string[];
      tags: string[];
    }

    interface GenerateNoteRequest {
      action: 'generateNote';
      data: {
        recordingId: string;
        transcription: string;
        title?: string;
        customPrompt?: string;
      };
    }

    interface GenerateNoteResponse {
      code: number;
      message: string;
      data: {
        noteId: string;
        title: string;
        summary: string;
        keyPoints: string[];
        actionItems: string[];
        tags: string[];
      } | null;
    }

    export declare function main(event: GenerateNoteRequest, context: any): Promise<GenerateNoteResponse>;
  