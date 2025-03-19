import React, { useState, useCallback } from 'react';
import { Voice } from '@elevenlabs/node';
import { Mic, Play, Save, Type, Loader2 } from 'lucide-react';

function App() {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const splitTextIntoChunks = (text: string): string[] => {
    const chunks: string[] = [];
    const words = text.split(' ');
    let currentChunk = '';

    for (const word of words) {
      if ((currentChunk + word).length > 500) {
        chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + word;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  };

  const handleTextToSpeech = useCallback(async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const chunks = splitTextIntoChunks(text);
      const voice = new Voice({
        apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY
      });

      for (const chunk of chunks) {
        const audio = await voice.textToSpeech("nPczCjzI2devNBz1zQrb", {
          text: chunk,
          modelId: "eleven_flash_v2_5",
          outputFormat: "mp3_44100_128",
        });

        const audioBlob = new Blob([audio], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioUrl);
        await audioElement.play();
        setAudioBlob(audioBlob);
      }
    } catch (err) {
      setError('Failed to convert text to speech. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [text]);

  const handleSave = useCallback(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'speech.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Mic className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">Text to Speech</h1>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <div className="absolute top-3 left-3">
                <Type className="w-5 h-5 text-gray-400" />
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your text here..."
                className="w-full h-48 pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleTextToSpeech}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Convert to Speech
                  </>
                )}
              </button>

              {audioBlob && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Save Audio
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;