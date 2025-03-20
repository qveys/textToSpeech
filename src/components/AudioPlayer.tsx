import React from 'react';

interface AudioPlayerProps {
  url: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ url }) => (
  <audio controls className="w-full h-8">
    <source src={url} type="audio/wav" />
    Votre navigateur ne supporte pas l'élément audio.
  </audio>
);