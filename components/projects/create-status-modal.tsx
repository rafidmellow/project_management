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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { HexColorPicker } from 'react-colorful';

interface CreateStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusCreated: (status: any) => void;
  projectId: string; // Add projectId prop
}

export function CreateStatusModal({
  open,
  onOpenChange,
  onStatusCreated,
  projectId,
}: CreateStatusModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: '#22c55e', // Default green color
    description: '',
    isDefault: false,
    projectId: projectId, // Include projectId in form data
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleColorChange = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Status name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/statuses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Status creation error:', data);
        throw new Error(data.error || 'Failed to create status');
      }

      console.log('Status creation response:', data);

      toast({
        title: 'Status created',
        description: `Status "${formData.name}" has been created successfully`,
      });

      // Make sure we're passing the correct data structure
      if (data.status) {
        onStatusCreated(data.status);
      } else {
        console.warn('Status created but unexpected response format:', data);
        // Try to use the data directly if it has an id
        onStatusCreated(
          data.id
            ? data
            : {
                id: 'temp-' + Date.now(),
                name: formData.name,
                color: formData.color,
                description: formData.description,
                isDefault: formData.isDefault,
              }
        );
      }

      onOpenChange(false);

      // Reset form
      setFormData({
        name: '',
        color: '#22c55e',
        description: '',
        isDefault: false,
        projectId: projectId,
      });
    } catch (err: any) {
      console.error('Error creating status:', err);
      const errorMessage = err.message || 'Failed to create status. Please try again.';
      console.log('Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Status</DialogTitle>
            <DialogDescription>Add a new project status to the system</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Status Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., In Review, Testing, Deployed"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe when this status should be used"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-col items-center space-y-3">
                <HexColorPicker color={formData.color} onChange={handleColorChange} />
                <div className="flex items-center gap-2 w-full">
                  <div
                    className="w-10 h-10 rounded-md border"
                    style={{ backgroundColor: formData.color }}
                  />
                  <Input
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isDefault" className="text-sm font-normal">
                Make this the default status for new projects
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Status
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
