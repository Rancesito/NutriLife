
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );
};

export const TextLoader: React.FC = () => {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
      </div>
    );
};
