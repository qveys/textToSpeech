import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { ChunkStatus } from '../types';
import { splitTextIntoChunks } from '../utils/textProcessing';
import { convertTextToSpeech, createInitialChunks } from '../services/textToSpeech';
import { TextSegment } from './TextSegment';
import { ErrorMessage } from './ErrorMessage';
import { concatenateAudioFiles } from '../utils/audioProcessing';

const DELAY_BETWEEN_CALLS = 10000; // 10 seconds in milliseconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function TextToSpeechConverter() {
  const [text, setText] = useState('');
  const [chunks, setChunks] = useState<ChunkStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<{ message: string; link?: { text: string; url: string } } | null>(null);
  const [finalAudioUrl, setFinalAudioUrl] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!text.trim()) {
      setError({ message: 'Please enter some text to convert' });
      return;
    }

    setError(null);
    setIsProcessing(true);
    setFinalAudioUrl(null);

    const textChunks = splitTextIntoChunks(text);
    setChunks(createInitialChunks(textChunks));

    try {
      const audioUrls: string[] = [];
      
      for (let i = 0; i < textChunks.length; i++) {
        // Set current chunk to processing and next chunk (if exists) to pending
        setChunks(prev => prev.map(chunk => {
          if (chunk.id === i) return { ...chunk, status: 'processing' };
          if (chunk.id === i + 1) return { ...chunk, status: 'pending' };
          return chunk;
        }));

        const audioUrl = await convertTextToSpeech(textChunks[i]);
        audioUrls.push(audioUrl);
        
        // Update current chunk to completed
        setChunks(prev => prev.map(chunk => 
          chunk.id === i ? { ...chunk, status: 'completed', audioUrl } : chunk
        ));

        // If there's a next chunk, wait for the delay but show it as processing
        if (i < textChunks.length - 1) {
          setChunks(prev => prev.map(chunk =>
            chunk.id === i + 1 ? { ...chunk, status: 'processing' } : chunk
          ));
          await sleep(DELAY_BETWEEN_CALLS);
        }
      }

      // Concatenate all audio files
      const responses = await Promise.all(
        audioUrls.map(url => fetch(url).then(res => res.blob()))
      );
      const audioBlobs = await Promise.all(
        responses.map(blob => blob.arrayBuffer())
      );
      
      const finalBlob = await concatenateAudioFiles(audioBlobs);
      const finalUrl = URL.createObjectURL(finalBlob);
      setFinalAudioUrl(finalUrl);

    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage.includes('signing-up')) {
        setError({
          message: errorMessage,
          link: {
            text: 'Sign up for an API key',
            url: 'https://elevenlabs.io'
          }
        });
      } else {
        setError({ message: errorMessage || 'An error occurred during processing' });
      }
      setChunks(prev => prev.map(chunk => 
        chunk.status === 'processing' ? { ...chunk, status: 'error' } : chunk
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Text to Speech Converter</h1>
          
          <div className="space-y-4">
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

            {error && <ErrorMessage message={error.message} link={error.link} />}

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
              <div className="mt-6 space-y-4">
                {chunks.map((chunk) => (
                  <TextSegment key={chunk.id} chunk={chunk} />
                ))}
              </div>
            )}

            {finalAudioUrl && (
              <div className="mt-6 space-y-4">
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Audio Final</h2>
                    <a
                      href={finalAudioUrl}
                      download="audio-final.wav"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </a>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <audio controls className="w-full">
                      <source src={finalAudioUrl} type="audio/wav" />
                      Votre navigateur ne supporte pas l'élément audio.
                    </audio>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}