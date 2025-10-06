'use client';

import { useState } from 'react';
import { Task, CreateCommentRequest } from '@/lib/types';
import { compAIClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload } from './file-upload';
import { UserSelector } from './user-selector';
import { MessageSquare, Send, Paperclip, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CommentFormProps {
  task: Task;
  onCommentAdded?: () => void;
  className?: string;
}

export function CommentForm({ task, onCommentAdded, className = '' }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string; } | null>(null);
  const [attachments, setAttachments] = useState<{ fileName: string; fileType: string; fileData: string; description?: string; }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = async (uploadRequest: { fileName: string; fileType: string; fileData: string; description?: string; }) => {
    // Add to attachments array instead of uploading directly
    setAttachments(prev => [...prev, uploadRequest]);
    setShowFileUpload(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please enter a comment');
      return;
    }

    // User ID not required - API handles authentication

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const commentRequest: CreateCommentRequest = {
        content: content.trim(),
        entityId: task.id,
        entityType: 'task',
        attachments: attachments.length > 0 ? attachments as any : undefined,
      };

      console.log('💬 Preparing comment request:');
      console.log('Selected User ID:', selectedUserId);
      console.log('Task ID:', task.id);
      console.log('Content length:', content.trim().length);
      console.log('Attachments count:', attachments.length);
      console.log('Full comment request:', JSON.stringify(commentRequest, null, 2));

      const response = await compAIClient.createComment(commentRequest);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Clear form
      setContent('');
      setSelectedUserId('');
      setSelectedUser(null);
      setAttachments([]);
      setShowFileUpload(false);
      setSuccess(true);
      
      // Notify parent component
      onCommentAdded?.();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Selection */}
        <div>
          <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-2">
            Comment as (optional)
            <span className="text-xs text-gray-500 font-normal ml-2">(for UI tracking only)</span>
          </label>
          <UserSelector
            value={selectedUserId}
            onValueChange={setSelectedUserId}
            onUserChange={setSelectedUser}
            placeholder="Select who is commenting..."
            disabled={isSubmitting}
          />
        </div>

        {/* Comment Input */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Add a comment
          </label>
          <textarea
            id="comment"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Add a comment to "${task.title}"...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            maxLength={2000}
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            {content.length}/2000 characters
          </p>
        </div>

        {/* Attachments Display */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Attachments ({attachments.length})</p>
            <div className="space-y-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <Paperclip className="h-4 w-4 text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.fileName}
                    </p>
                    {attachment.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {attachment.description}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Upload Section */}
        {showFileUpload && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Add Attachment</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <FileUpload 
              onUpload={handleFileUpload}
              isUploading={false}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFileUpload(!showFileUpload)}
            disabled={isSubmitting}
          >
            <Paperclip className="h-4 w-4 mr-2" />
            {showFileUpload ? 'Cancel Attachment' : 'Add Attachment'}
          </Button>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || !content.trim()}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <MessageSquare className="h-4 w-4 animate-pulse" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Post Comment
              </>
            )}
          </Button>
        </div>
      </form>

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
            Comment posted successfully!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
