'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, Attachment } from '@/lib/types';
import { compAIClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UploadModal } from './upload-modal';
import { CommentsSection } from './comments-section';
import { formatDistanceToNow } from 'date-fns';
import { Paperclip, Download, FileText, Image, File, MessageSquare } from 'lucide-react';

interface TaskCardProps {
  task: Task;
}

const statusColors = {
  todo: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
} as const;

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
} as const;

export function TaskCard({ task }: TaskCardProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown date';
    }
  };

  const getFileIcon = (fileType: string | undefined) => {
    if (!fileType) return File;
    if (fileType.startsWith('image/')) return Image;
    if (fileType === 'application/pdf') return FileText;
    return File;
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchAttachments = useCallback(async () => {
    setLoadingAttachments(true);
    try {
      const response = await compAIClient.getTaskAttachments(task.id);
      if (response.data) {
        setAttachments(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    } finally {
      setLoadingAttachments(false);
    }
  }, [task.id]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleUploadComplete = () => {
    fetchAttachments(); // Refresh attachments list
  };

  return (
    <Card className="group hover:shadow-lg hover:shadow-accent-50 transition-all duration-300 border-0 bg-white ring-1 ring-gray-200 hover:ring-accent-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <CardTitle className="text-xl font-bold text-gray-900 leading-tight group-hover:text-accent-800 transition-colors">
            {task.title}
          </CardTitle>
          <Badge 
            className={`${statusColors[task.status]} font-semibold px-3 py-1.5 text-xs border shrink-0 shadow-sm`}
          >
            {statusLabels[task.status]}
          </Badge>
        </div>
        {task.description && (
          <CardDescription className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
            {task.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0 pb-5">
        <div className="space-y-4">
          {/* Attachments Section */}
          {!loadingAttachments && attachments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Paperclip className="h-4 w-4" />
                <span>{attachments.length} attachment{attachments.length === 1 ? '' : 's'}</span>
              </div>
              <div className="space-y-2">
                {attachments.slice(0, 2).map((attachment) => {
                  const FileIcon = getFileIcon(attachment.fileType);
                  return (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <FileIcon className="h-4 w-4 text-gray-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.fileSize)}
                        </p>
                      </div>
                      {attachment.downloadUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={attachment.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  );
                })}
                {attachments.length > 2 && (
                  <p className="text-xs text-gray-500 pl-2">
                    +{attachments.length - 2} more attachment{attachments.length - 2 === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-2">
            <div className="flex gap-2">
              <UploadModal 
                task={task} 
                onUploadComplete={handleUploadComplete}
                trigger={
                  <Button variant="outline" size="sm" className="text-xs">
                    <Paperclip className="h-3 w-3 mr-1" />
                    Add File
                  </Button>
                }
              />
              <CommentsSection
                task={task}
                trigger={
                  <Button variant="outline" size="sm" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Comments
                  </Button>
                }
              />
            </div>
          </div>

          {/* Task ID */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</span>
            <code className="bg-gray-50 border border-gray-200 px-2 py-1 rounded-md text-xs font-mono text-gray-700 select-all">
              {task.id}
            </code>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              <span className="font-medium">Created {formatDate(task.createdAt)}</span>
              <span className="font-medium">Updated {formatDate(task.updatedAt)}</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-accent-500 transition-colors"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
