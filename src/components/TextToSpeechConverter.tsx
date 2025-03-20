import React, { useState, useRef } from 'react';
import { Loader2, Volume2, Download, AlertCircle } from 'lucide-react';
import type { ChunkStatus, APIError } from '../types';
import { splitTextIntoChunks, concatenateAudioChunks } from '../utils/textProcessing';

export default function TextToSpeechConverter() {
  const [text, setText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [chunks, setChunks] = useState<ChunkStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleConvert = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your ElevenLabs API key');
      return;
    }

    if (!text.trim()) {
      setError('Please enter some text to convert');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setAudioUrl(null);

    const textChunks = splitTextIntoChunks(text);
    const initialChunks: ChunkStatus[] = textChunks.map((text, id) => ({
      id,
      text,
      status: 'pending'
    }));
    setChunks(initialChunks);

    const audioChunks: ArrayBuffer[] = [];

    try {
      for (let i = 0; i < textChunks.length; i++) {
        setChunks(prev => prev.map(chunk => 
          chunk.id === i ? { ...chunk, status: 'processing' } : chunk
        ));

        const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/nPczCjzI2devNBz1zQrb', {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: textChunks[i],
            model_id: 'eleven_flash_v2_5',
            output_format: 'mp3_44100_128'
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        audioChunks.push(arrayBuffer);

        setChunks(prev => prev.map(chunk => 
          chunk.id === i ? { ...chunk, status: 'completed', audio: arrayBuffer } : chunk
        ));
      }

      const finalAudio = await concatenateAudioChunks(audioChunks);
      const url = URL.createObjectURL(finalAudio);
      setAudioUrl(url);
    } catch (err) {
      setError((err as APIError).message || 'An error occurred during processing');
      setChunks(prev => prev.map(chunk => 
        chunk.status === 'processing' ? { ...chunk, status: 'error' } : chunk
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = 'converted-speech.wav';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Text to Speech Converter</h1>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                ElevenLabs API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your API key"
              />
            </div>

            <div>
              <label htmlFor="text" className="block text-sm font-medium text-gray-700">
                Text to Convert
              </label>
              <textarea
                id="text"
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter or paste your text here..."
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Converting...
                </>
              ) : (
                'Convert to Speech'
              )}
            </button>

            {chunks.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">Processing Status</h3>
                <div className="mt-2 space-y-2">
                  {chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                    >
                      <span className="text-sm text-gray-600">
                        Chunk {chunk.id + 1} of {chunks.length}
                      </span>
                      <span className={`text-sm ${
                        chunk.status === 'completed' ? 'text-green-600' :
                        chunk.status === 'error' ? 'text-red-600' :
                        chunk.status === 'processing' ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {chunk.status.charAt(0).toUpperCase() + chunk.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {audioUrl && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Final Audio</h3>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
                <audio ref={audioRef} controls className="w-full" src={audioUrl}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}