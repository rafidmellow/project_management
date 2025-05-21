'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectStatusManager } from '@/components/project/project-status-manager';
import { Project, ProjectStatus } from '@/types/project';

interface ProjectSettingsDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  project: Project;
  statuses: ProjectStatus[];
}

export function ProjectSettingsDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess,
  project,
  statuses,
}: ProjectSettingsDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || '',
    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
    endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '',
    estimatedTime: project.estimatedTime || 0,
  });

  // Update form data when project changes
  useEffect(() => {
    setFormData({
      title: project.title,
      description: project.description || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '',
      estimatedTime: project.estimatedTime || 0,
    });
  }, [project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          dueDate: formData.dueDate || null,
          estimatedTime: formData.estimatedTime ? Number(formData.estimatedTime) : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      toast({
        title: 'Project updated',
        description: 'Project settings have been updated successfully',
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update project',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="mb-2 sm:mb-4">
          <DialogTitle className="text-lg sm:text-xl">Project Settings</DialogTitle>
          <DialogDescription className="text-sm">
            Update your project details and manage statuses
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2 sm:mt-4">
          <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
            <TabsTrigger value="general" className="text-xs sm:text-sm">
              General
            </TabsTrigger>
            <TabsTrigger value="statuses" className="text-xs sm:text-sm">
              Statuses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <form id="project-form" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="title" className="text-sm sm:text-base">
                  Project Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="h-9 sm:h-10"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="description" className="text-sm sm:text-base">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="min-h-[80px] sm:min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="startDate" className="text-sm sm:text-base">
                    Start Date
                  </Label>
                  <div className="flex">
                    <div className="bg-muted p-1 sm:p-2 rounded-l-md flex items-center">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="rounded-l-none h-9 sm:h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="endDate" className="text-sm sm:text-base">
                    End Date
                  </Label>
                  <div className="flex">
                    <div className="bg-muted p-1 sm:p-2 rounded-l-md flex items-center">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="rounded-l-none h-9 sm:h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="dueDate" className="text-sm sm:text-base">
                    Due Date
                  </Label>
                  <div className="flex">
                    <div className="bg-muted p-1 sm:p-2 rounded-l-md flex items-center">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="rounded-l-none h-9 sm:h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="estimatedTime" className="text-sm sm:text-base">
                    Estimated Hours
                  </Label>
                  <div className="flex">
                    <div className="bg-muted p-1 sm:p-2 rounded-l-md flex items-center">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <Input
                      id="estimatedTime"
                      name="estimatedTime"
                      type="number"
                      min="0"
                      value={formData.estimatedTime}
                      onChange={handleChange}
                      className="rounded-l-none h-9 sm:h-10"
                    />
                  </div>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="statuses" className="mt-3 sm:mt-4">
            <ProjectStatusManager projectId={projectId} initialStatuses={statuses} />
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto order-2 sm:order-1 h-9 sm:h-10 text-sm"
          >
            Cancel
          </Button>
          {activeTab === 'general' ? (
            <Button
              type="submit"
              form="project-form"
              disabled={isLoading}
              className="w-full sm:w-auto order-1 sm:order-2 h-9 sm:h-10 text-sm"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          ) : (
            <Button
              onClick={() => {
                const saveButton = document.getElementById('status-save-button');
                if (saveButton) saveButton.click();
              }}
              disabled={isLoading}
              className="w-full sm:w-auto order-1 sm:order-2 h-9 sm:h-10 text-sm"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
