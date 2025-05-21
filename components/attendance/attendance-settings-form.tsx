'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Settings, Clock, Calendar, Bell, CheckCircle2 } from 'lucide-react';
import { AttendanceSettings, UpdateAttendanceSettingsDTO } from '@/types/attendance';

interface AttendanceSettingsFormProps {
  userId?: string; // Optional - if not provided, uses current user
}

const DAYS_OF_WEEK = [
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
  { value: '6', label: 'Sat' },
  { value: '0', label: 'Sun' },
];

export function AttendanceSettingsForm({ userId }: AttendanceSettingsFormProps) {
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, [userId]);

  // Parse workDays string into array when settings change
  useEffect(() => {
    if (settings?.workDays) {
      setSelectedDays(settings.workDays.split(','));
    }
  }, [settings]);

  async function fetchSettings() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/attendance/settings');

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Error fetching attendance settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!settings) return;

    try {
      setIsSaving(true);

      // Convert selected days array back to comma-separated string
      const updatedSettings: UpdateAttendanceSettingsDTO = {
        workHoursPerDay: settings.workHoursPerDay,
        workDays: selectedDays.join(','),
        reminderEnabled: settings.reminderEnabled,
        reminderTime: settings.reminderTime,
        autoCheckoutEnabled: settings.autoCheckoutEnabled,
        autoCheckoutTime: settings.autoCheckoutTime,
      };

      const response = await fetch('/api/attendance/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      setSettings(data.settings);

      toast({
        title: 'Success',
        description: 'Attendance settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating attendance settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update attendance settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleDayToggle(day: string) {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day].sort();
      }
    });
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Attendance Settings
          </CardTitle>
          <CardDescription>Loading your attendance settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <Settings className="mr-2 h-5 w-5 text-primary" />
          Field Attendance Settings
        </CardTitle>
        <CardDescription>
          Configure your work schedule and location tracking preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Work Schedule Section */}
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center mb-4">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <h3 className="font-medium">Work Schedule</h3>
            </div>

            {/* Work Days */}
            <div className="space-y-3 mb-5">
              <Label htmlFor="workDays" className="text-sm text-muted-foreground">
                Select your work days
              </Label>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <div
                    key={day.value}
                    className={`flex flex-col items-center justify-center p-2 rounded-md cursor-pointer transition-colors ${
                      selectedDays.includes(day.value)
                        ? 'bg-black text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                    onClick={() => handleDayToggle(day.value)}
                  >
                    <span className="text-xs sm:text-sm">{day.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tap on days to select or deselect them
              </p>
            </div>

            {/* Work Hours */}
            <div className="space-y-2">
              <Label htmlFor="workHoursPerDay" className="text-sm text-muted-foreground">
                Expected hours per work day
              </Label>
              <div className="flex items-center">
                <Input
                  id="workHoursPerDay"
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  value={settings?.workHoursPerDay || 8}
                  onChange={e =>
                    setSettings(prev =>
                      prev ? { ...prev, workHoursPerDay: parseFloat(e.target.value) } : null
                    )
                  }
                  className="w-24"
                />
                <span className="ml-2 text-sm">hours</span>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center mb-4">
              <Bell className="h-4 w-4 mr-2 text-primary" />
              <h3 className="font-medium">Notifications</h3>
            </div>

            {/* Check-in Reminders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reminderEnabled" className="cursor-pointer flex items-center">
                    Check-in Reminders
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get notified when it's time to check in
                  </p>
                </div>
                <Switch
                  id="reminderEnabled"
                  checked={settings?.reminderEnabled || false}
                  onCheckedChange={checked =>
                    setSettings(prev => (prev ? { ...prev, reminderEnabled: checked } : null))
                  }
                />
              </div>

              {settings?.reminderEnabled && (
                <div className="bg-background rounded-md p-3 space-y-2 border">
                  <Label htmlFor="reminderTime" className="text-sm">
                    Reminder Time
                  </Label>
                  <Input
                    id="reminderTime"
                    type="time"
                    value={settings?.reminderTime || '09:00'}
                    onChange={e =>
                      setSettings(prev => (prev ? { ...prev, reminderTime: e.target.value } : null))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll receive a notification at this time on your work days
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Auto-Checkout Section */}
          <div className="bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-center mb-4">
              <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
              <h3 className="font-medium">Automatic Check-out</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoCheckoutEnabled" className="cursor-pointer">
                    Auto-Checkout
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically check out at a specific time
                  </p>
                </div>
                <Switch
                  id="autoCheckoutEnabled"
                  checked={settings?.autoCheckoutEnabled || false}
                  onCheckedChange={checked =>
                    setSettings(prev => (prev ? { ...prev, autoCheckoutEnabled: checked } : null))
                  }
                />
              </div>

              {settings?.autoCheckoutEnabled && (
                <div className="bg-background rounded-md p-3 space-y-2 border">
                  <Label htmlFor="autoCheckoutTime" className="text-sm">
                    Auto-Checkout Time
                  </Label>
                  <Input
                    id="autoCheckoutTime"
                    type="time"
                    value={settings?.autoCheckoutTime || '17:00'}
                    onChange={e =>
                      setSettings(prev =>
                        prev ? { ...prev, autoCheckoutTime: e.target.value } : null
                      )
                    }
                  />
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      You'll be automatically checked out at this time if you forget to do so
                    </p>
                    <div className="bg-black/5 p-3 rounded-md">
                      <h4 className="text-xs font-medium mb-1">How auto-checkout works:</h4>
                      <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                        <li>
                          The system will check if you're still checked in at the specified time
                        </li>
                        <li>If you're checked in, you'll be automatically checked out</li>
                        <li>
                          Auto-checkout only applies when you're actively using the application
                        </li>
                        <li>
                          Records created by auto-checkout are marked in your attendance history
                        </li>
                        <li>You can disable this feature at any time</li>
                      </ul>
                    </div>
                    <Badge
                      variant="outline"
                      className="mt-2 text-xs bg-yellow-50 text-yellow-800 border-yellow-200"
                    >
                      Auto-checkout is active
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="w-full bg-black hover:bg-black/90 text-white"
          >
            {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Save Settings
          </Button>
        </form>
      </CardContent>
      <CardFooter className="bg-muted/30 px-6 py-4 border-t text-xs text-muted-foreground">
        <p>
          These settings affect how your attendance is tracked and recorded. Your location is only
          recorded during check-in and check-out.
        </p>
      </CardFooter>
    </Card>
  );
}
