'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusManagement } from '@/components/project/status-management';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';

export default function ProjectSettingsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'general');
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    estimatedTime: '' as string | number,
  });
  const { toast } = useToast();

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }

        const data = await response.json();
        setProject(data.project);

        // Initialize form data
        setFormData({
          title: data.project.title || '',
          description: data.project.description || '',
          startDate: data.project.startDate ? new Date(data.project.startDate) : null,
          endDate: data.project.endDate ? new Date(data.project.endDate) : null,
          estimatedTime: data.project.estimatedTime || '',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch project details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (field: string, value: Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate ? formData.startDate.toISOString() : null,
          endDate: formData.endDate ? formData.endDate.toISOString() : null,
          estimatedTime: formData.estimatedTime === '' ? null : Number(formData.estimatedTime),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      const updatedProject = await response.json();
      setProject(updatedProject.project);

      toast({
        title: 'Project updated',
        description: 'Project details have been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update project details',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <p className="text-muted-foreground mt-2">
          The project you're looking for doesn't exist or you don't have access to it.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project.title} Settings</h1>
        <p className="text-muted-foreground">Manage project settings and configuration</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Update basic information about your project</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !formData.startDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? (
                            format(formData.startDate, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          selected={formData.startDate}
                          onSelect={date => handleDateChange('startDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !formData.endDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? (
                            format(formData.endDate, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          selected={formData.endDate}
                          onSelect={date => handleDateChange('endDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Estimated Time (hours)</Label>
                  <div className="flex items-center">
                    <Input
                      id="estimatedTime"
                      name="estimatedTime"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.estimatedTime}
                      onChange={handleInputChange}
                    />
                    <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statuses">
          <StatusManagement projectId={projectId} />
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>Manage team members and their roles in this project</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Team management functionality will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
