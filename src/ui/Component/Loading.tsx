import React from 'react';

const Loading: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[120px]">
    <div className="w-10 h-10 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
    <span className="text-gray-600">Loading...</span>
  </div>
);

export default Loading;
