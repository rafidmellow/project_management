'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Trash } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeleteConfirmation } from './team-types';

interface DeleteTeamMemberDialogProps {
  isOpen: boolean;
  isDeleting: boolean;
  teamMemberToDelete: DeleteConfirmation | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

/**
 * A memoized dialog component for confirming team member deletion
 */
export const DeleteTeamMemberDialog = memo(function DeleteTeamMemberDialog({
  isOpen,
  isDeleting,
  teamMemberToDelete,
  onClose,
  onConfirm,
}: DeleteTeamMemberDialogProps) {
  if (!teamMemberToDelete) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Team Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {teamMemberToDelete.name || teamMemberToDelete.email}{' '}
            from the team?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Remove</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
