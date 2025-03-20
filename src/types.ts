export interface TextToSpeechResponse {
  audio: ArrayBuffer;
}

export interface ChunkStatus {
  id: number;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  audio?: ArrayBuffer;
}

export interface APIError {
  message: string;
  status?: number;
}