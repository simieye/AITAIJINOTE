
    interface RecordingMetadata {
      _id?: string;
      fileID: string;
      fileName: string;
      title: string;
      tags: string[];
      transcription: string;
      duration: number;
      fileSize: number;
      mimeType: string;
      createdAt: string;
      status: 'processing' | 'completed' | 'failed';
    }

    interface TranscriptionResult {
      recordingId: string;
      transcription: string;
      duration: number;
      fileID: string;
    }

    interface ErrorResponse {
      error: string;
    }

    interface CloudFunctionEvent {
      httpMethod: string;
      headers: Record<string, string>;
      body: string;
      isBase64Encoded: boolean;
    }

    export declare function main(event: CloudFunctionEvent, context: any): Promise<{
      statusCode: number;
      headers: Record<string, string>;
      body: string;
    }>;
  