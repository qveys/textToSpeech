import { ChunkStatus, APIError } from '../types';

const FRENCH_VOICE_ID = 'bIHbv24MWmeRgasZH58o';
const ENGLISH_VOICE_ID = 'nPczCjzI2devNBz1zQrb';

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'audio/mpeg',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Origin': 'https://elevenlabs.io',
  'Referer': 'https://elevenlabs.io/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

const detectLanguage = (text: string): 'fr' | 'en' => {
  // Common French words and patterns
  const frenchPatterns = [
    /[éèêëàâäôöûüùïîç]/i,  // French accents
    /\b(je|tu|il|elle|nous|vous|ils|elles)\b/i,  // French pronouns
    /\b(le|la|les|un|une|des|du|de|à|au|aux)\b/i,  // French articles and prepositions
    /\b(est|sont|être|avoir|fait|faire|dit|voir)\b/i,  // Common French verbs
    /\b(bonjour|merci|oui|non|s'il|voilà|très|bien)\b/i  // Common French words
  ];

  // Count matches for French patterns
  const frenchScore = frenchPatterns.reduce((score, pattern) => 
    score + (pattern.test(text) ? 1 : 0), 0);

  // If text has significant French characteristics, classify as French
  return frenchScore >= 2 ? 'fr' : 'en';
};

export const convertTextToSpeech = async (text: string): Promise<string> => {
  try {
    const trimmedText = text.trim();
    const language = detectLanguage(trimmedText);
    const voiceId = language === 'fr' ? FRENCH_VOICE_ID : ENGLISH_VOICE_ID;
    const apiUrl = `https://api.us.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const requestBody = {
      text: trimmedText,
      model_id: 'eleven_flash_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    };

    console.log('Detected language:', language);
    console.log('Using voice ID:', voiceId);
    console.log('Sending request with body:', requestBody);

    const response = await fetch(`${apiUrl}?allow_unauthenticated=1`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Server response:', errorData);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Received empty response from server');
    }

    console.log('Received audio data of size:', arrayBuffer.byteLength);

    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Text-to-speech conversion error:', error);
    throw error;
  }
};

export const createInitialChunks = (textChunks: string[]): ChunkStatus[] => 
  textChunks.map((text, id) => ({
    id,
    text,
    status: 'pending',
    audioUrl: null
  }));