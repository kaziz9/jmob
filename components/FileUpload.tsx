import React from 'react';

interface UploadOptionsProps {
  onFileSelect: (files: File[]) => void;
  onTakePhoto: () => void;
  onCaptureScreen: () => void;
  onExtractPdf: () => void;
}

const FileUpload: React.FC<UploadOptionsProps> = ({ onFileSelect, onTakePhoto, onCaptureScreen, onExtractPdf }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(Array.from(e.target.files));
      // Reset the input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
        <p className="text-gray-500 mb-4">
          Upload an image, PDF, DOCX, or ACCDB file containing your order list.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {/* File Upload Button */}
          <button
            onClick={() => document.getElementById('file-upload-input')?.click()}
            className="flex items-center justify-center w-full md:w-auto gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Files
          </button>
          <input
            id="file-upload-input"
            type="file"
            accept="image/*,.pdf,.docx,.accdb,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msaccess"
            className="hidden"
            onChange={handleFileChange}
            multiple
          />

          {/* Camera Button */}
          <button
            onClick={onTakePhoto}
            className="flex items-center justify-center w-full md:w-auto gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Take Photo
          </button>
          
          {/* Screenshot Button */}
          <button
            onClick={onCaptureScreen}
            className="flex items-center justify-center w-full md:w-auto gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Capture Screen
          </button>

          {/* Extract PDF Text Button */}
          <button
            onClick={onExtractPdf}
            className="flex items-center justify-center w-full md:w-auto gap-3 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Extract PDF Text
          </button>
        </div>
    </div>
  );
};

export default FileUpload;