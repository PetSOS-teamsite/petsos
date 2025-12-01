import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X, Check, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { apiRequest } from "@/lib/queryClient";

interface SimpleFileUploaderProps {
  onUploadComplete: (result: { url: string; size: number; type: string }) => void;
  onError?: (error: string) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  disabled?: boolean;
}

export function SimpleFileUploader({
  onUploadComplete,
  onError,
  maxFileSize = 10485760, // 10MB default
  allowedTypes = ['image/*', 'application/pdf'],
  disabled = false,
}: SimpleFileUploaderProps) {
  const { language } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
      onError?.(language === 'zh-HK' 
        ? `文件過大，最大允許 ${maxSizeMB}MB` 
        : `File too large, max ${maxSizeMB}MB allowed`);
      return;
    }

    // Validate file type - support wildcards like 'image/*'
    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        // Wildcard match: 'image/*' matches 'image/jpeg', 'image/heic', etc.
        const category = type.replace('/*', '/');
        return file.type.startsWith(category);
      }
      return file.type === type;
    });

    if (!isValidType) {
      onError?.(language === 'zh-HK' 
        ? '不支援的文件格式' 
        : 'Unsupported file format');
      // Clear the input to allow retry
      if (event.target) event.target.value = '';
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    // Auto-upload
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get upload URL from backend
      const response = await apiRequest('POST', '/api/medical-records/upload-url');
      const { uploadURL } = await response.json();

      // Upload file directly to object storage
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('PUT', uploadURL);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // Success
      onUploadComplete({
        url: uploadURL.split('?')[0], // Remove query params for storage
        size: file.size,
        type: file.type,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      onError?.(language === 'zh-HK' 
        ? '上傳失敗，請重試' 
        : 'Upload failed, please try again');
      setSelectedFile(null);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const acceptTypes = allowedTypes.map(t => {
    if (t === 'application/pdf') return '.pdf';
    if (t.startsWith('image/')) return t;
    return t;
  }).join(',');

  return (
    <div className="space-y-3">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
        data-testid="input-file-select"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
        data-testid="input-camera-capture"
      />

      {/* Upload buttons */}
      {!selectedFile && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="flex-1"
            data-testid="button-select-file"
          >
            <Upload className="w-4 h-4 mr-2" />
            {language === 'zh-HK' ? '選擇文件' : 'Select File'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="flex-1"
            data-testid="button-take-photo"
          >
            <Camera className="w-4 h-4 mr-2" />
            {language === 'zh-HK' ? '拍照' : 'Take Photo'}
          </Button>
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && (
        <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-start gap-3">
            {/* Preview thumbnail */}
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-16 h-16 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
            )}

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>

              {/* Progress bar */}
              {isUploading && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'zh-HK' ? `上傳中 ${uploadProgress}%` : `Uploading ${uploadProgress}%`}
                  </p>
                </div>
              )}

              {/* Success indicator */}
              {!isUploading && uploadProgress === 100 && (
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs">
                    {language === 'zh-HK' ? '已上傳' : 'Uploaded'}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  data-testid="button-clear-file"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
