import React, { useState } from 'react';
import ImageUploader from './ImageUploader';

const ImageUploaderTest: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  
  const handleImagesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    console.log('Files updated:', newFiles);
  };
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Image Uploader Test</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <ImageUploader 
          onImagesChange={handleImagesChange}
          maxImages={5}
        />
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="font-medium mb-2">Selected Files:</h3>
          {files.length === 0 ? (
            <p className="text-gray-500">No files selected</p>
          ) : (
            <ul className="list-disc pl-5">
              {files.map((file, index) => (
                <li key={index} className="text-sm">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploaderTest;