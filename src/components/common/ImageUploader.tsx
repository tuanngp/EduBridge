import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Maximize2 } from 'lucide-react';
import ImagePreviewModal from './ImagePreviewModal';

interface ImageUploaderProps {
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  initialPreviews?: string[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesChange,
  maxImages = 5,
  initialPreviews = [],
}) => {
  const [previews, setPreviews] = useState<string[]>(initialPreviews);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    const totalFiles = files.length + selectedFiles.length;
    
    if (totalFiles > maxImages) {
      alert(`You can only upload a maximum of ${maxImages} images.`);
      return;
    }
    
    // Generate previews for the new files
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    
    // Update state
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    setPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    
    // Notify parent component
    onImagesChange([...files, ...selectedFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index]);
    
    // Remove the file and preview
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
    
    // Notify parent component
    onImagesChange(newFiles);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const openPreviewModal = (index: number) => {
    setCurrentPreviewIndex(index);
    setPreviewModalOpen(true);
  };

  const closePreviewModal = () => {
    setPreviewModalOpen(false);
  };

  const goToPreviousImage = () => {
    setCurrentPreviewIndex(prev => 
      prev === 0 ? previews.length - 1 : prev - 1
    );
  };

  const goToNextImage = () => {
    setCurrentPreviewIndex(prev => 
      prev === previews.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-4 mb-4">
        {previews.map((preview, index) => (
          <div 
            key={index} 
            className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300 group"
          >
            <img 
              src={preview} 
              alt={`Preview ${index + 1}`} 
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => openPreviewModal(index)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200 flex items-center justify-center">
              <button
                type="button"
                onClick={() => openPreviewModal(index)}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                aria-label="Preview image"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {files.length < maxImages && (
          <button
            type="button"
            onClick={triggerFileInput}
            className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors duration-200"
          >
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="text-xs text-gray-500 mt-1">Add Image</span>
          </button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="text-xs text-gray-500">
        {files.length > 0 ? (
          <span>
            {files.length} of {maxImages} images selected
          </span>
        ) : (
          <span>
            <ImageIcon className="inline-block h-3 w-3 mr-1" />
            Upload up to {maxImages} images of your device
          </span>
        )}
      </div>

      {previewModalOpen && (
        <ImagePreviewModal
          images={previews}
          currentIndex={currentPreviewIndex}
          onClose={closePreviewModal}
          onPrevious={goToPreviousImage}
          onNext={goToNextImage}
        />
      )}
    </div>
  );
};

export default ImageUploader;