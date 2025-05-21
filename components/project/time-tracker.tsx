'use client';

import { useState, useEffect } from 'react';
import { Clock, Play, Pause, Save, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { formatDistanceToNow } from 'date-fns';

interface TimeTrackerProps {
  taskId: string;
  initialTimeSpent?: number | null;
  onTimeUpdate?: (newTime: number) => void;
}

export function TimeTracker({ taskId, initialTimeSpent = 0, onTimeUpdate }: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [timeSpent, setTimeSpent] = useState(initialTimeSpent || 0);
  const [manualTime, setManualTime] = useState(timeSpent.toString());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Initialize time spent when initialTimeSpent changes
  useEffect(() => {
    setTimeSpent(initialTimeSpent || 0);
    setManualTime((initialTimeSpent || 0).toString());
  }, [initialTimeSpent]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTracking && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = (now.getTime() - startTime.getTime()) / 1000 / 60 / 60; // Convert to hours
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, startTime]);

  const handleStartTracking = () => {
    setStartTime(new Date());
    setIsTracking(true);
  };

  const handleStopTracking = async () => {
    if (!startTime) return;

    setIsTracking(false);

    const now = new Date();
    const trackingTimeHours = (now.getTime() - startTime.getTime()) / 1000 / 60 / 60; // Convert to hours
    const newTimeSpent = timeSpent + trackingTimeHours;

    setTimeSpent(newTimeSpent);
    setManualTime(newTimeSpent.toFixed(2));
    setStartTime(null);

    // Save the updated time
    await saveTimeToServer(newTimeSpent);
  };

  const handleManualTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualTime(e.target.value);
  };

  const handleManualTimeBlur = async () => {
    const newTime = parseFloat(manualTime);
    if (isNaN(newTime) || newTime < 0) {
      setManualTime(timeSpent.toString());
      return;
    }

    setTimeSpent(newTime);

    // Save the updated time
    await saveTimeToServer(newTime);
  };

  const handleIncrement = async () => {
    const newTime = timeSpent + 0.25; // Add 15 minutes (0.25 hours)
    setTimeSpent(newTime);
    setManualTime(newTime.toFixed(2));

    // Save the updated time
    await saveTimeToServer(newTime);
  };

  const handleDecrement = async () => {
    const newTime = Math.max(0, timeSpent - 0.25); // Subtract 15 minutes (0.25 hours), but not below 0
    setTimeSpent(newTime);
    setManualTime(newTime.toFixed(2));

    // Save the updated time
    await saveTimeToServer(newTime);
  };

  const saveTimeToServer = async (newTime: number) => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/tasks/${taskId}/time`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeSpent: newTime,
          updateProjectTotal: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update time');
      }

      if (onTimeUpdate) {
        onTimeUpdate(newTime);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save time tracking data',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Format time as hours and minutes
  const formatTime = (timeInHours: number) => {
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-lg flex items-center">
          <Clock className="mr-2.5 h-5 w-5" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1">Total Time Spent</p>
              <p className="text-2xl font-bold">{formatTime(timeSpent + elapsedTime)}</p>
              {isTracking && startTime && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Started {formatDistanceToNow(startTime, { addSuffix: true })}
                </p>
              )}
            </div>

            <div>
              {!isTracking ? (
                <Button onClick={handleStartTracking} size="sm" className="h-9 px-4">
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
              ) : (
                <Button
                  onClick={handleStopTracking}
                  variant="destructive"
                  size="sm"
                  className="h-9 px-4"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={isTracking || timeSpent <= 0}
              className="h-10 w-10"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <Input
                type="number"
                min="0"
                step="0.25"
                value={manualTime}
                onChange={handleManualTimeChange}
                onBlur={handleManualTimeBlur}
                disabled={isTracking || isSaving}
                className="text-center h-10"
              />
              <p className="text-xs text-center text-muted-foreground mt-1.5">Hours</p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={isTracking}
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {isSaving && (
            <div className="flex justify-center mt-2">
              <Spinner size="sm" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
