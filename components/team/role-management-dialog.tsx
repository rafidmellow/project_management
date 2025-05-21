'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RoleBadge } from '@/components/ui/role-badge';
import { teamManagementApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  projectId: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  project: {
    id: string;
    title: string;
  };
}

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMember: TeamMember | null;
  onSuccess?: () => void;
}

export function RoleManagementDialog({
  open,
  onOpenChange,
  teamMember,
  onSuccess,
}: RoleManagementDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This dialog is now informational only - it shows the user's system role
  // but doesn't allow changing it since we're removing project roles

  // Close the dialog
  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  if (!teamMember) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Team Member Role</DialogTitle>
          <DialogDescription>View the system role for this team member.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="default" className="mb-4 border">
            <Info className="h-4 w-4" />
            <AlertTitle>System Role</AlertTitle>
            <AlertDescription>
              <p className="text-sm mt-1">
                This user's system role determines what they can do across the entire application.
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col items-center justify-center p-4 border rounded-md">
            <div className="text-center mb-2">
              <h3 className="font-medium break-words max-w-full">
                {teamMember.user.name || teamMember.user.email}
              </h3>
              <p className="text-sm text-muted-foreground">System Role</p>
            </div>
            <RoleBadge role={teamMember.user.role} showTooltip={true} />
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            To change a user's system role, please go to the User Management section.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
