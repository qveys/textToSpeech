/**
 * Splits text into manageable chunks for processing
 * @param text Text to split into chunks
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(text: string): string[] {
  const MAX_LENGTH = 500;
  
  // Trim the text and handle empty input
  const trimmedText = text.trim();
  if (!trimmedText) return [];

  // Split text into words
  const words = trimmedText.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    // If adding this word would exceed maxLength, save current chunk and start new one
    if (currentChunk.length + word.length + 1 > MAX_LENGTH) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      // If a single word is longer than maxLength, split it
      if (word.length > MAX_LENGTH) {
        let remainingWord = word;
        while (remainingWord.length > MAX_LENGTH) {
          chunks.push(remainingWord.slice(0, MAX_LENGTH));
          remainingWord = remainingWord.slice(MAX_LENGTH);
        }
        currentChunk = remainingWord;
      } else {
        currentChunk = word;
      }
    } else {
      // Add word to current chunk
      currentChunk = currentChunk ? `${currentChunk} ${word}` : word;
    }
  }

  // Add the last chunk if it exists
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function concatenateAudioChunks(audioChunks: ArrayBuffer[]): Promise<Blob> {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffers = await Promise.all(
    audioChunks.map(chunk => audioContext.decodeAudioData(chunk))
  );
  
  const totalLength = audioBuffers.reduce((acc, buffer) => acc + buffer.length, 0);
  const outputBuffer = audioContext.createBuffer(
    1,
    totalLength,
    audioBuffers[0].sampleRate
  );
  
  let offset = 0;
  for (const buffer of audioBuffers) {
    outputBuffer.copyToChannel(buffer.getChannelData(0), 0, offset);
    offset += buffer.length;
  }

  const wav = audioBufferToWav(outputBuffer);
  return new Blob([wav], { type: 'audio/wav' });
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2;
  const buffer2 = new ArrayBuffer(44 + length);
  const view = new DataView(buffer2);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write PCM audio data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][pos]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return buffer2;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}