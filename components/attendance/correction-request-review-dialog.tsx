'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, XCircle, Info } from 'lucide-react';

interface CorrectionRequestReviewDialogProps {
  request: any;
  onComplete?: () => void;
}

export function CorrectionRequestReviewDialog({
  request,
  onComplete,
}: CorrectionRequestReviewDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const handleApprove = async () => {
    await processRequest('approved');
  };

  const handleReject = async () => {
    await processRequest('rejected');
  };

  const processRequest = async (status: 'approved' | 'rejected') => {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch('/api/attendance/admin/correction-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: request.id,
          status,
          reviewNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.message || `Failed to ${status} correction request`
        );
      }

      toast({
        title: status === 'approved' ? 'Request Approved' : 'Request Rejected',
        description: `The correction request has been ${status}.`,
      });

      setOpen(false);
      if (onComplete) onComplete();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${status} correction request`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Info className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Review</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Review Correction Request</DialogTitle>
          <DialogDescription>
            Review and approve or reject this attendance correction request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Info */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Requested By</h4>
            <p className="text-sm">{request.user.name || request.user.email}</p>
          </div>

          {/* Original Times */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Original Times</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Check-in:</span>{' '}
                {format(new Date(request.originalCheckInTime), 'MMM d, yyyy h:mm a')}
              </div>
              <div>
                <span className="text-muted-foreground">Check-out:</span>{' '}
                {request.originalCheckOutTime
                  ? format(new Date(request.originalCheckOutTime), 'MMM d, yyyy h:mm a')
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Requested Times */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Requested Times</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Check-in:</span>{' '}
                {format(new Date(request.requestedCheckInTime), 'MMM d, yyyy h:mm a')}
              </div>
              <div>
                <span className="text-muted-foreground">Check-out:</span>{' '}
                {request.requestedCheckOutTime
                  ? format(new Date(request.requestedCheckOutTime), 'MMM d, yyyy h:mm a')
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Reason for Correction</h4>
            <p className="text-sm p-3 bg-muted rounded-md">{request.reason}</p>
          </div>

          {/* Review Notes */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Review Notes (Optional)</h4>
            <Textarea
              placeholder="Add notes about your decision..."
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReject}
            disabled={loading}
            className="gap-1"
          >
            {loading ? <Spinner className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            Reject
          </Button>
          <Button type="button" onClick={handleApprove} disabled={loading} className="gap-1">
            {loading ? <Spinner className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
