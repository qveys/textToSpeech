/**
 * Concatenates multiple audio files into a single audio file
 * @param audioBuffers Array of ArrayBuffers containing audio data
 * @returns Promise resolving to a Blob containing the concatenated audio
 */
export async function concatenateAudioFiles(audioBuffers: ArrayBuffer[]): Promise<Blob> {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Decode all audio buffers
  const decodedBuffers = await Promise.all(
    audioBuffers.map(buffer => audioContext.decodeAudioData(buffer))
  );
  
  // Calculate total length
  const totalLength = decodedBuffers.reduce((acc, buffer) => acc + buffer.length, 0);
  
  // Create output buffer
  const outputBuffer = audioContext.createBuffer(
    1, // mono
    totalLength,
    decodedBuffers[0].sampleRate
  );
  
  // Copy data from each buffer
  let offset = 0;
  for (const buffer of decodedBuffers) {
    outputBuffer.copyToChannel(buffer.getChannelData(0), 0, offset);
    offset += buffer.length;
  }
  
  // Convert to WAV format
  const wavData = audioBufferToWav(outputBuffer);
  return new Blob([wavData], { type: 'audio/wav' });
}

/**
 * Converts AudioBuffer to WAV format
 */
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

/**
 * Writes a string to a DataView at specified offset
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}