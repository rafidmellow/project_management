'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { taskApi } from '@/lib/api';

interface SubtaskFormProps {
  projectId: string;
  parentId: string;
  onSuccess: () => void;
  onCancel: () => void;
  isNested?: boolean;
}

export function SubtaskForm({
  projectId,
  parentId,
  onSuccess,
  onCancel,
  isNested = false,
}: SubtaskFormProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    // Validate title length
    if (trimmedTitle.length < 3) {
      toast({
        title: 'Validation Error',
        description: 'Subtask title must be at least 3 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await taskApi.createTask({
        title: trimmedTitle,
        projectId,
        parentId,
        priority: 'medium',
      });

      setTitle('');
      onSuccess();

      toast({
        title: isNested ? 'Nested subtask added' : 'Subtask added',
        description: `${isNested ? 'Nested subtask' : 'Subtask'} has been added successfully`,
      });
    } catch (error) {
      console.error(`Error adding ${isNested ? 'nested ' : ''}subtask:`, error);
      toast({
        title: 'Error',
        description: `Failed to add ${isNested ? 'nested ' : ''}subtask. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder={`Enter ${isNested ? 'nested ' : ''}subtask title...`}
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="h-8 text-sm"
        autoFocus
        disabled={isSubmitting}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
      />
      <Button size="sm" className="h-8" onClick={handleSubmit} disabled={isSubmitting}>
        Add
      </Button>
      <Button variant="ghost" size="sm" className="h-8" onClick={onCancel} disabled={isSubmitting}>
        Cancel
      </Button>
    </div>
  );
}
