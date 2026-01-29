import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Eye, RotateCcw, ZoomIn, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface PhotoUploadPreviewProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
  title?: string;
  description?: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

export const PhotoUploadPreview = ({
  onUpload,
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/pdf'],
  maxSizeInMB = 10,
  title = "Upload documents",
  description = "Drag and drop files here or click to browse"
}: PhotoUploadPreviewProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type`);
        return;
      }

      // Check file size
      if (file.size > maxSizeInMB * 1024 * 1024) {
        errors.push(`${file.name}: File too large`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      // Show error toast
      console.error('Upload errors:', errors);
    }

    if (validFiles.length > 0) {
      const newFiles: UploadedFile[] = validFiles.slice(0, maxFiles - uploadedFiles.length).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9)
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);
      onUpload(validFiles);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return updated;
    });
  };

  const simulateUpload = async () => {
    setIsUploading(true);
    
    // Simulate upload progress
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsUploading(false);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <motion.div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-[#5FAD43] bg-green-50' 
            : uploadedFiles.length > 0 
            ? 'border-green-300 bg-green-50/50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {isUploading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="w-12 h-12 border-4 border-[#5FAD43] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-600">Processing files...</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <h4 className="font-medium text-gray-900">{title}</h4>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4"
            >
              Choose files
            </Button>
            <div className="text-xs text-gray-500">
              {acceptedTypes.includes('image/jpeg') && 'JPG, '}
              {acceptedTypes.includes('image/png') && 'PNG, '}
              {acceptedTypes.includes('application/pdf') && 'PDF '}
              up to {maxSizeInMB}MB
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* File Previews */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h5 className="font-medium text-gray-900">
              Uploaded files ({uploadedFiles.length})
            </h5>
            
            <div className="grid grid-cols-2 gap-3">
              {uploadedFiles.map((fileData, index) => (
                <motion.div
                  key={fileData.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-3 relative group">
                    {/* Preview */}
                    <div className="aspect-square rounded-md overflow-hidden bg-gray-100 mb-2">
                      {fileData.file.type.startsWith('image/') ? (
                        <img
                          src={fileData.preview}
                          alt={fileData.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 uppercase">
                              {fileData.file.name.split('.').pop()}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={() => setSelectedPreview(fileData.preview)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                          onClick={() => removeFile(fileData.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* File Info */}
                    <div>
                      <p className="text-xs font-medium truncate">
                        {fileData.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(fileData.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>

                    {/* Success indicator */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#5FAD43] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Upload Action */}
            {uploadedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  onClick={simulateUpload}
                  disabled={isUploading}
                  className="w-full bg-[#5FAD43] hover:bg-[#4A9538]"
                >
                  {isUploading ? 'Uploading...' : `Upload ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {selectedPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="max-w-4xl max-h-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPreview}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setSelectedPreview(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};