
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-8">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-gray-600">Analyzing your document...</p>
      <p className="text-sm text-gray-500">The AI is hard at work!</p>
    </div>
  );
};

export default LoadingSpinner;
