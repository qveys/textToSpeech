import React from 'react';
import { StatusBadge } from './StatusBadge';
import { AudioPlayer } from './AudioPlayer';
import { ChunkStatus } from '../types';

interface TextSegmentProps {
  chunk: ChunkStatus;
}

export const TextSegment: React.FC<TextSegmentProps> = ({ chunk }) => (
  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-medium text-gray-900">
          Segment {chunk.id + 1}
        </h3>
        <span className="text-xs text-gray-500">
          ({chunk.text.length} caractères)
        </span>
      </div>
      <StatusBadge status={chunk.status} />
    </div>
    <p className="text-sm text-gray-600 mb-3 border-l-4 border-gray-200 pl-3">
      {chunk.text}
    </p>
    {chunk.audioUrl && <AudioPlayer url={chunk.audioUrl} />}
  </div>
);