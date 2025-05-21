'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Move, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

interface ProjectStatus {
  id: string;
  name: string;
  color: string;
  description?: string | null;
  order: number;
  isDefault: boolean;
  projectId: string;
}

interface StatusManagementProps {
  projectId: string;
}

/**
 * A sortable status item component that can be dragged and dropped
 */
function SortableStatusItem({
  status,
  onEdit,
  onDelete,
}: {
  status: ProjectStatus;
  onEdit: (status: ProjectStatus) => void;
  onDelete: (statusId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-md mb-2"
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab">
          <Move className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: status.color }} />
        <div>
          <div className="font-medium flex items-center">
            {status.name}
            {status.isDefault && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Default
              </span>
            )}
          </div>
          {status.description && (
            <div className="text-xs text-muted-foreground">{status.description}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(status)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(status.id)}
          disabled={status.isDefault && status.isDefault}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function StatusManagement({ projectId }: StatusManagementProps) {
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newStatus, setNewStatus] = useState({
    name: '',
    color: '#6E56CF',
    description: '',
    isDefault: false,
  });
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch statuses
  const fetchStatuses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}/statuses`);

      if (!response.ok) {
        throw new Error('Failed to fetch statuses');
      }

      const data = await response.json();
      setStatuses(data.statuses || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch statuses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load statuses on component mount
  useEffect(() => {
    if (projectId) {
      fetchStatuses();
    }
  }, [projectId]);

  const handleAddStatus = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/statuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatus),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create status');
      }

      setNewStatus({ name: '', color: '#6E56CF', description: '', isDefault: false });
      setIsAddDialogOpen(false);
      await fetchStatuses();
      toast({
        title: 'Status created',
        description: 'The status has been created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create status',
        variant: 'destructive',
      });
    }
  };

  const handleEditStatus = async () => {
    if (!editingStatus) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/statuses/${editingStatus.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingStatus.name,
          color: editingStatus.color,
          description: editingStatus.description,
          isDefault: editingStatus.isDefault,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      setEditingStatus(null);
      setIsEditDialogOpen(false);
      await fetchStatuses();
      toast({
        title: 'Status updated',
        description: 'The status has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this status? All tasks in this status will be moved to the default status.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/statuses/${statusId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete status');
      }

      await fetchStatuses();
      toast({
        title: 'Status deleted',
        description: 'The status has been deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete status',
        variant: 'destructive',
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Return if no over item or if the item is dropped onto itself
    if (!over || active.id === over.id) return;

    try {
      // Get the indices for the source and destination
      const sourceIndex = statuses.findIndex(status => status.id === active.id);
      const destinationIndex = statuses.findIndex(status => status.id === over.id);

      if (sourceIndex === -1 || destinationIndex === -1) return;

      // Optimistically update the UI
      setStatuses(prev => {
        const newStatuses = arrayMove(prev, sourceIndex, destinationIndex);
        return newStatuses;
      });

      // Send the update to the server
      const response = await fetch(`/api/projects/${projectId}/statuses/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusId: active.id as string,
          sourceIndex,
          destinationIndex,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reorder statuses');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reorder statuses',
        variant: 'destructive',
      });
      // Refetch to ensure we have the correct data
      await fetchStatuses();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Statuses</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Status
            </Button>
          </DialogTrigger>
          <DialogContent style={{ zIndex: 100 }}>
            <DialogHeader>
              <DialogTitle>Create New Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newStatus.name}
                  onChange={e => setNewStatus({ ...newStatus, name: e.target.value })}
                  placeholder="e.g., In Progress"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={newStatus.color}
                    onChange={e => setNewStatus({ ...newStatus, color: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={newStatus.color}
                    onChange={e => setNewStatus({ ...newStatus, color: e.target.value })}
                    placeholder="#6E56CF"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newStatus.description}
                  onChange={e => setNewStatus({ ...newStatus, description: e.target.value })}
                  placeholder="Describe what this status represents"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={newStatus.isDefault}
                  onChange={e => setNewStatus({ ...newStatus, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isDefault">Make this the default status for new tasks</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStatus} disabled={!newStatus.name}>
                Create Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : statuses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No statuses defined. Create your first status to get started.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={statuses.map(status => status.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {statuses.map(status => (
                  <SortableStatusItem
                    key={status.id}
                    status={status}
                    onEdit={status => {
                      setEditingStatus(status);
                      setIsEditDialogOpen(true);
                    }}
                    onDelete={handleDeleteStatus}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Edit Status Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent style={{ zIndex: 100 }}>
            <DialogHeader>
              <DialogTitle>Edit Status</DialogTitle>
            </DialogHeader>
            {editingStatus && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingStatus.name}
                    onChange={e => setEditingStatus({ ...editingStatus, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-color">Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-color"
                      type="color"
                      value={editingStatus.color || '#6E56CF'}
                      onChange={e => setEditingStatus({ ...editingStatus, color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={editingStatus.color || '#6E56CF'}
                      onChange={e => setEditingStatus({ ...editingStatus, color: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description (optional)</Label>
                  <Textarea
                    id="edit-description"
                    value={editingStatus.description || ''}
                    onChange={e =>
                      setEditingStatus({ ...editingStatus, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isDefault"
                    checked={editingStatus.isDefault}
                    onChange={e =>
                      setEditingStatus({ ...editingStatus, isDefault: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="edit-isDefault">Make this the default status for new tasks</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditStatus} disabled={!editingStatus?.name}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
