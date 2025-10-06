'use client';

import { useState } from 'react';
import { Task } from '@/lib/types';
import { CommentForm } from './comment-form';
import { CommentsList } from './comments-list';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface CommentsSectionProps {
  task: Task;
  trigger?: React.ReactNode;
}

export function CommentsSection({ task, trigger }: CommentsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCommentAdded = () => {
    // Trigger refresh of comments list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comments
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments
          </DialogTitle>
          <DialogDescription>
            Discussion for <strong>{task.title}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-6 mt-4">
          {/* Comments List - Scrollable */}
          <div className="flex-1 overflow-y-auto pr-2">
            <CommentsList
              entityId={task.id}
              entityType="task"
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* Comment Form - Fixed at bottom */}
          <div className="border-t border-gray-200 pt-4">
            <CommentForm 
              task={task}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
