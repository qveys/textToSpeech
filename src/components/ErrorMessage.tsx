import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  link?: {
    text: string;
    url: string;
  };
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, link }) => (
  <div className="rounded-md bg-red-50 p-4">
    <div className="flex">
      <AlertCircle className="h-5 w-5 text-red-400" />
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">{message}</h3>
        {link && (
          <div className="mt-2">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-red-800 hover:text-red-600 underline"
            >
              {link.text}
            </a>
          </div>
        )}
      </div>
    </div>
  </div>
);