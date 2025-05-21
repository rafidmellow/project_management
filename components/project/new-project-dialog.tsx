'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NewProjectDialog({ open, onOpenChange, onSuccess }: NewProjectDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState({
    name: '',
    color: '#6E56CF',
    description: '',
    isDefault: false,
  });

  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    estimatedTime: '',
    initialStatuses: [] as Array<{
      name: string;
      color: string;
      description?: string;
      isDefault: boolean;
    }>,
  });

  const resetForm = () => {
    setProjectData({
      title: '',
      description: '',
      startDate: null,
      endDate: null,
      estimatedTime: '',
      initialStatuses: [],
    });
    setNewStatus({ name: '', color: '#6E56CF', description: '', isDefault: false });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: 'startDate' | 'endDate') => (date: Date | undefined) => {
    setProjectData(prev => ({ ...prev, [name]: date || null }));
  };

  const handleAddStatus = () => {
    if (!newStatus.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Status name is required',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate status names
    if (
      projectData.initialStatuses.some(s => s.name.toLowerCase() === newStatus.name.toLowerCase())
    ) {
      toast({
        title: 'Validation Error',
        description: 'A status with this name already exists',
        variant: 'destructive',
      });
      return;
    }

    // If this is the first status or isDefault is true, make sure only one status is default
    const updatedStatuses = [...projectData.initialStatuses];

    if (newStatus.isDefault) {
      // Remove default flag from other statuses
      updatedStatuses.forEach(status => {
        status.isDefault = false;
      });
    } else if (updatedStatuses.length === 0) {
      // If this is the first status, make it default regardless
      newStatus.isDefault = true;
    }

    // Add the new status
    updatedStatuses.push({ ...newStatus });

    setProjectData(prev => ({ ...prev, initialStatuses: updatedStatuses }));
    setNewStatus({ name: '', color: '#6E56CF', description: '', isDefault: false });
    setIsStatusDialogOpen(false);
  };

  const handleRemoveStatus = (index: number) => {
    const updatedStatuses = [...projectData.initialStatuses];
    const removedStatus = updatedStatuses.splice(index, 1)[0];

    // If the removed status was default and we have other statuses, make the first one default
    if (removedStatus.isDefault && updatedStatuses.length > 0) {
      updatedStatuses[0].isDefault = true;
    }

    setProjectData(prev => ({ ...prev, initialStatuses: updatedStatuses }));
  };

  const handleSetDefaultStatus = (index: number) => {
    const updatedStatuses = [...projectData.initialStatuses];

    // Remove default flag from all statuses
    updatedStatuses.forEach((status, i) => {
      status.isDefault = i === index;
    });

    setProjectData(prev => ({ ...prev, initialStatuses: updatedStatuses }));
  };

  const validateProject = () => {
    if (!projectData.title) {
      toast({
        title: 'Validation Error',
        description: 'Project title is required',
        variant: 'destructive',
      });
      return false;
    }

    if (projectData.title.length < 3) {
      toast({
        title: 'Validation Error',
        description: 'Project title must be at least 3 characters long',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate before submission
      if (!validateProject()) {
        return;
      }

      setIsSubmitting(true);

      // Format data for submission
      const dataToSubmit = {
        ...projectData,
        startDate: projectData.startDate ? new Date(projectData.startDate).toISOString() : null,
        endDate: projectData.endDate ? new Date(projectData.endDate).toISOString() : null,
        estimatedTime:
          projectData.estimatedTime && projectData.estimatedTime.trim() !== ''
            ? parseFloat(projectData.estimatedTime)
            : null,
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Project creation error:', errorData);

        // Handle validation errors specifically
        if (response.status === 400 && errorData.details) {
          // Format validation errors for display
          const validationErrors = Object.entries(errorData.details)
            .map(([field, errors]: [string, any]) => {
              if (field === '_errors' && Array.isArray(errors)) {
                return errors.join(', ');
              }
              if (typeof errors === 'object' && errors._errors) {
                return `${field}: ${errors._errors.join(', ')}`;
              }
              return null;
            })
            .filter(Boolean)
            .join('\n');

          throw new Error(`Validation failed:\n${validationErrors || errorData.error}`);
        }

        throw new Error(errorData.error || 'Failed to create project');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      // Reset form and close dialog
      resetForm();
      onOpenChange(false);

      // Call success callback or navigate to the new project
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/projects/${data.project.id}`);
      }
    } catch (error) {
      let errorMessage = 'Failed to create project';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Check if the error message contains multiple lines (validation errors)
      if (errorMessage.includes('\n')) {
        const lines = errorMessage.split('\n');
        const title = lines[0];
        const details = lines.slice(1).join('\n');

        toast({
          title: title,
          description: (
            <div className="mt-2 max-h-[200px] overflow-y-auto">
              {details.split('\n').map((line, i) => (
                <p key={i} className="text-sm">
                  {line}
                </p>
              ))}
            </div>
          ),
          variant: 'destructive',
          duration: 5000, // Show longer for validation errors
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={newOpen => {
          if (!newOpen) resetForm();
          onOpenChange(newOpen);
        }}
      >
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="mb-2 sm:mb-4">
            <DialogTitle className="text-lg sm:text-xl">Create New Project</DialogTitle>
            <DialogDescription className="text-sm">
              Enter the details for your new project
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 py-2 sm:py-4">
            <div className="grid gap-1 sm:gap-2">
              <Label htmlFor="title" className="text-sm sm:text-base">
                Project Title (minimum 3 characters)
              </Label>
              <Input
                id="title"
                name="title"
                value={projectData.title}
                onChange={handleInputChange}
                placeholder="Enter project title"
                minLength={3}
                required
                className="h-9 sm:h-10"
              />
            </div>

            <div className="grid gap-1 sm:gap-2">
              <Label htmlFor="description" className="text-sm sm:text-base">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={projectData.description}
                onChange={handleInputChange}
                placeholder="Describe the project and its objectives"
                rows={3}
                className="min-h-[80px] sm:min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="grid gap-1 sm:gap-2">
                <Label htmlFor="startDate" className="text-sm sm:text-base">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  className="w-full h-9 sm:h-10"
                  value={
                    projectData.startDate
                      ? new Date(
                          projectData.startDate.getTime() -
                            projectData.startDate.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .split('T')[0]
                      : ''
                  }
                  onChange={e => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setProjectData(prev => ({ ...prev, startDate: date }));
                  }}
                />
              </div>

              <div className="grid gap-1 sm:gap-2">
                <Label htmlFor="endDate" className="text-sm sm:text-base">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  className="w-full h-9 sm:h-10"
                  value={
                    projectData.endDate
                      ? new Date(
                          projectData.endDate.getTime() -
                            projectData.endDate.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .split('T')[0]
                      : ''
                  }
                  onChange={e => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setProjectData(prev => ({ ...prev, endDate: date }));
                  }}
                />
              </div>

              <div className="grid gap-1 sm:gap-2">
                <Label htmlFor="estimatedTime" className="text-sm sm:text-base">
                  Estimated Time (hours)
                </Label>
                <Input
                  id="estimatedTime"
                  name="estimatedTime"
                  type="number"
                  min="0"
                  step="0.5"
                  value={projectData.estimatedTime}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="h-9 sm:h-10"
                />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm sm:text-base">Project Statuses</Label>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsStatusDialogOpen(true)}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                >
                  <Plus className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Add Status
                </Button>
              </div>

              {projectData.initialStatuses.length === 0 ? (
                <div className="text-center py-3 sm:py-4 border rounded-md bg-muted/30">
                  <p className="text-muted-foreground text-sm">
                    No statuses defined. Add statuses to organize your project tasks.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Default statuses will be created if none are specified.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[150px] sm:max-h-[200px] overflow-y-auto">
                  {projectData.initialStatuses.map((status, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-0">
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <div>
                          <div className="font-medium flex items-center text-sm sm:text-base">
                            {status.name}
                            {status.isDefault && (
                              <Badge className="ml-2 text-[10px] sm:text-xs" variant="outline">
                                Default
                              </Badge>
                            )}
                          </div>
                          {status.description && (
                            <div className="text-[10px] sm:text-xs text-muted-foreground">
                              {status.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 ml-5 sm:ml-0">
                        {!status.isDefault && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefaultStatus(index)}
                            className="h-7 sm:h-8 text-xs px-2 sm:px-3"
                          >
                            Make Default
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStatus(index)}
                          className="h-7 sm:h-8 w-7 sm:w-8 p-0"
                        >
                          <Trash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto order-2 sm:order-1 h-9 sm:h-10 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto order-1 sm:order-2 h-9 sm:h-10 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Project
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          <DialogHeader className="mb-2 sm:mb-4">
            <DialogTitle className="text-lg sm:text-xl">Add Project Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="statusName" className="text-sm sm:text-base">
                Name
              </Label>
              <Input
                id="statusName"
                value={newStatus.name}
                onChange={e => setNewStatus({ ...newStatus, name: e.target.value })}
                placeholder="e.g., In Progress"
                className="h-9 sm:h-10"
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="statusColor" className="text-sm sm:text-base">
                Color
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="statusColor"
                  type="color"
                  value={newStatus.color}
                  onChange={e => setNewStatus({ ...newStatus, color: e.target.value })}
                  className="w-14 sm:w-16 h-9 sm:h-10"
                />
                <Input
                  value={newStatus.color}
                  onChange={e => setNewStatus({ ...newStatus, color: e.target.value })}
                  placeholder="#6E56CF"
                  className="h-9 sm:h-10"
                />
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="statusDescription" className="text-sm sm:text-base">
                Description (optional)
              </Label>
              <Textarea
                id="statusDescription"
                value={newStatus.description}
                onChange={e => setNewStatus({ ...newStatus, description: e.target.value })}
                placeholder="Describe what this status represents"
                rows={2}
                className="min-h-[60px] sm:min-h-[80px]"
              />
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={newStatus.isDefault}
                onChange={e => setNewStatus({ ...newStatus, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isDefault" className="text-xs sm:text-sm">
                Make this the default status for new tasks
              </Label>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 pt-2 sm:pt-4">
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1 h-9 sm:h-10 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddStatus}
              disabled={!newStatus.name.trim()}
              className="w-full sm:w-auto order-1 sm:order-2 h-9 sm:h-10 text-sm"
            >
              Add Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
