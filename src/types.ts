export interface TextToSpeechResponse {
  audio: ArrayBuffer;
}

export interface ChunkStatus {
  id: number;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  audioUrl: string | null;
}

export interface APIError {
  detail?: {
    status: string;
    message: string;
  };
  message?: string;
}