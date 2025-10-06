'use client';

import { useState } from 'react';
import { Task, UploadAttachmentRequest } from '@/lib/types';
import { compAIClient } from '@/lib/api';
import { FileUpload } from './file-upload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface UploadModalProps {
  task: Task;
  onUploadComplete?: () => void;
  trigger?: React.ReactNode;
}

export function UploadModal({ task, onUploadComplete, trigger }: UploadModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (uploadRequest: UploadAttachmentRequest) => {
    setIsUploading(true);
    
    try {
      const response = await compAIClient.uploadTaskAttachment(task.id, uploadRequest);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Close modal and notify parent component
      setIsOpen(false);
      onUploadComplete?.();
    } catch (error) {
      // Error is handled by FileUpload component
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Attachment
          </DialogTitle>
          <DialogDescription>
            Upload a file attachment to <strong>{task.title}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <FileUpload 
            onUpload={handleUpload} 
            isUploading={isUploading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
