'use client';

import { useState } from 'react';
import { formatDateTimeForInput } from '@/lib/utils/date';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Clock } from 'lucide-react';

interface CorrectionRequestDialogProps {
  attendanceId: string;
  originalCheckInTime: string | Date;
  originalCheckOutTime?: string | Date | null;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CorrectionRequestDialog({
  attendanceId,
  originalCheckInTime,
  originalCheckOutTime,
  onSuccess,
  trigger,
}: CorrectionRequestDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    checkInTime: formatDateTimeForInput(originalCheckInTime),
    checkOutTime: originalCheckOutTime ? formatDateTimeForInput(originalCheckOutTime) : '',
    reason: '',
  });

  // Using the imported formatDateTimeForInput function from date-utils.ts

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for the correction request.',
        variant: 'destructive',
      });
      return;
    }

    // Validate dates
    if (!formData.checkInTime) {
      toast({
        title: 'Invalid Check-in Time',
        description: 'Please provide a valid check-in time.',
        variant: 'destructive',
      });
      return;
    }

    // If check-out time is provided, ensure it's after check-in time
    if (formData.checkOutTime) {
      const checkInDate = new Date(formData.checkInTime);
      const checkOutDate = new Date(formData.checkOutTime);

      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        toast({
          title: 'Invalid Date Format',
          description: 'One or both of the dates provided are invalid.',
          variant: 'destructive',
        });
        return;
      }

      if (checkOutDate <= checkInDate) {
        toast({
          title: 'Invalid Time Range',
          description: 'Check-out time must be after check-in time.',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/attendance/correction-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceId,
          requestedCheckInTime: formData.checkInTime,
          requestedCheckOutTime: formData.checkOutTime || null,
          reason: formData.reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.message || 'Failed to submit correction request'
        );
      }

      toast({
        title: 'Request Submitted',
        description: 'Your correction request has been submitted for review.',
      });

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: 'Request Failed',
        description: error.message || 'Failed to submit correction request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Pencil className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Request Correction</span>
            <span className="sm:hidden">Correct</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Attendance Correction</DialogTitle>
          <DialogDescription>Submit a request to correct this attendance record.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="checkInTime" className="text-sm">
              Check-in Time
            </Label>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="checkInTime"
                type="datetime-local"
                value={formData.checkInTime}
                onChange={e => setFormData({ ...formData, checkInTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkOutTime" className="text-sm">
              Check-out Time {!originalCheckOutTime && '(Optional)'}
            </Label>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                id="checkOutTime"
                type="datetime-local"
                value={formData.checkOutTime}
                onChange={e => setFormData({ ...formData, checkOutTime: e.target.value })}
                required={!!originalCheckOutTime}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm">
              Reason for Correction
            </Label>
            <Textarea
              id="reason"
              placeholder="Please explain why this correction is needed..."
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              required
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
