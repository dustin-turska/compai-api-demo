'use client';

import { useState, useEffect } from 'react';
import { Comment } from '@/lib/types';
import { compAIClient } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, User, Paperclip, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommentsListProps {
  entityId: string;
  entityType: string;
  refreshTrigger?: number;
  className?: string;
}

export function CommentsList({ entityId, entityType, refreshTrigger = 0, className = '' }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await compAIClient.getComments(entityId, entityType);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        setComments(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [entityId, entityType, refreshTrigger]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading comments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchComments}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-300 mb-3">
          <MessageSquare className="h-8 w-8 mx-auto" />
        </div>
        <p className="text-gray-500 text-sm">No comments yet</p>
        <p className="text-gray-400 text-xs">Be the first to add a comment!</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
        <MessageSquare className="h-4 w-4" />
        <span>{comments.length} comment{comments.length === 1 ? '' : 's'}</span>
      </div>
      
      {comments.map((comment) => (
        <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          {/* Comment Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {comment.author.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </p>
              </div>
            </div>
            <code className="text-xs text-gray-400 font-mono">
              {comment.id}
            </code>
          </div>

          {/* Comment Content */}
          <div className="pl-10">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>

            {/* Comment Attachments */}
            {comment.attachments && comment.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  <Paperclip className="h-3 w-3" />
                  <span>{comment.attachments.length} attachment{comment.attachments.length === 1 ? '' : 's'}</span>
                </div>
                <div className="space-y-1">
                  {comment.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                      <Paperclip className="h-3 w-3 text-gray-400" />
                      <span className="font-medium text-gray-700">{attachment.name}</span>
                      <span className="text-gray-500">• {attachment.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
