'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserSelector } from './user-selector';
import { Upload, File, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UploadAttachmentRequest } from '@/lib/types';

interface FileUploadProps {
  onUpload: (file: UploadAttachmentRequest) => Promise<void>;
  isUploading?: boolean;
  className?: string;
}

const ACCEPTED_FILE_TYPES = {
  'image/jpeg': '.jpg,.jpeg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
} as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUpload({ onUpload, isUploading = false, className = '' }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    // Check file type
    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
      return `File type ${file.type} is not supported. Supported types: ${Object.values(ACCEPTED_FILE_TYPES).join(', ')}`;
    }

    return null;
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    setSuccess(false);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (!selectedUserId) {
      setError('Please select a user for attribution');
      return;
    }

    console.log('🔄 Starting file upload process:');
    console.log('Selected File:', selectedFile.name, selectedFile.type, selectedFile.size);
    console.log('Selected User ID:', selectedUserId);
    console.log('Description:', description);

    setError(null);
    setSuccess(false);

    try {
      const base64Data = await convertFileToBase64(selectedFile);
      console.log('✅ File converted to base64, length:', base64Data.length);
      
        const uploadRequest: UploadAttachmentRequest = {
          fileName: selectedFile.name,
          fileType: selectedFile.type as UploadAttachmentRequest['fileType'],
          fileData: base64Data,
          description: description.trim() || undefined,
          createdBy: selectedUserId, // Try createdBy field name
        };

      console.log('📤 Upload request prepared:', {
        fileName: uploadRequest.fileName,
        fileType: uploadRequest.fileType,
        description: uploadRequest.description,
        createdBy: uploadRequest.createdBy,
        fileDataLength: uploadRequest.fileData.length
      });

      await onUpload(uploadRequest);
      console.log('✅ Upload successful!');
      setSuccess(true);
      setSelectedFile(null);
      setSelectedUserId('');
      setDescription('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.log('❌ Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setSelectedUserId('');
    setDescription('');
    setError(null);
    setSuccess(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-accent-400 bg-accent-50'
            : selectedFile
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <File className="h-8 w-8" />
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clearFile}>
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className={`h-12 w-12 mx-auto ${dragActive ? 'text-accent-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {dragActive ? 'Drop file here' : 'Drag & drop a file here'}
              </p>
              <p className="text-sm text-gray-500">
                or click to browse files
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              id="file-upload"
              accept={Object.values(ACCEPTED_FILE_TYPES).join(',')}
              onChange={handleFileInput}
            />
            <Button variant="outline" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Choose File
              </label>
            </Button>
          </div>
        )}
      </div>

      {/* User Selection */}
      {selectedFile && (
        <div>
          <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-2">
            Uploaded by
            <span className="text-xs text-gray-500 font-normal ml-2">(for tracking purposes)</span>
          </label>
          <UserSelector
            value={selectedUserId}
            onValueChange={setSelectedUserId}
            placeholder="Select who is uploading this file..."
            disabled={isUploading}
          />
        </div>
      )}

      {/* Description Input */}
      {selectedFile && (
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for this attachment..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/500 characters
          </p>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && (
        <Button 
          onClick={handleUpload} 
          disabled={isUploading || !selectedUserId}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Attachment
            </>
          )}
        </Button>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            File uploaded successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* File Type Info */}
      <div className="text-xs text-gray-500">
        <p className="font-medium mb-1">Supported file types:</p>
        <p>Images (JPEG, PNG, GIF, WebP), PDF, Text files, Word documents</p>
        <p>Maximum file size: {MAX_FILE_SIZE / 1024 / 1024}MB</p>
      </div>
    </div>
  );
}
