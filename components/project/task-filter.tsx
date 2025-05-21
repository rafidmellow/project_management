'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTaskContext } from './task-context';
import { TaskFilters } from '@/types/task';

export function TaskFilterNew() {
  const { statuses, users, filters, setFilters } = useTaskContext();

  const [statusOpen, setStatusOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const toggleStatus = (statusId: string) => {
    setFilters({
      ...filters,
      statusIds: filters.statusIds.includes(statusId)
        ? filters.statusIds.filter(id => id !== statusId)
        : [...filters.statusIds, statusId],
    });
  };

  const toggleAssignee = (userId: string) => {
    setFilters({
      ...filters,
      assigneeIds: filters.assigneeIds.includes(userId)
        ? filters.assigneeIds.filter(id => id !== userId)
        : [...filters.assigneeIds, userId],
    });
  };

  const handlePriorityChange = (value: string) => {
    setFilters({ ...filters, priority: value === 'all' ? null : value });
  };

  const handleCompletedChange = (value: string) => {
    if (value === 'all') {
      setFilters({ ...filters, completed: null });
    } else if (value === 'completed') {
      setFilters({ ...filters, completed: true });
    } else {
      setFilters({ ...filters, completed: false });
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      statusIds: [],
      assigneeIds: [],
      priority: null,
      completed: null,
    });
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.statusIds.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.priority !== null ||
    filters.completed !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9 h-10 bg-background"
            value={filters.search}
            onChange={handleSearchChange}
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent hover:text-primary"
              onClick={() => setFilters({ ...filters, search: '' })}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Popover open={statusOpen} onOpenChange={setStatusOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start w-full h-10 bg-background hover:bg-muted/50"
              >
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="truncate">Status</span>
                {filters.statusIds.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 rounded-full px-2 bg-primary/10 text-primary"
                  >
                    {filters.statusIds.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search status..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {statuses.map(status => (
                      <CommandItem
                        key={status.id}
                        onSelect={() => toggleStatus(status.id)}
                        className="flex items-center gap-2"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Checkbox
                            checked={filters.statusIds.includes(status.id)}
                            onCheckedChange={() => toggleStatus(status.id)}
                          />
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          <span>{status.name}</span>
                        </div>
                        {filters.statusIds.includes(status.id) && <Check className="h-4 w-4" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start w-full h-10 bg-background hover:bg-muted/50"
              >
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="truncate">Assignee</span>
                {filters.assigneeIds.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 rounded-full px-2 bg-primary/10 text-primary"
                  >
                    {filters.assigneeIds.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search assignee..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    {users.map(user => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => toggleAssignee(user.id)}
                        className="flex items-center gap-2"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Checkbox
                            checked={filters.assigneeIds.includes(user.id)}
                            onCheckedChange={() => toggleAssignee(user.id)}
                          />
                          <span>{user.name || user.email}</span>
                        </div>
                        {filters.assigneeIds.includes(user.id) && <Check className="h-4 w-4" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Select value={filters.priority || 'all'} onValueChange={handlePriorityChange}>
            <SelectTrigger className="w-full h-10 bg-background hover:bg-muted/50">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.completed === null ? 'all' : filters.completed ? 'completed' : 'active'}
            onValueChange={handleCompletedChange}
          >
            <SelectTrigger className="w-full h-10 bg-background hover:bg-muted/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t">
          <div className="flex flex-wrap gap-2">
            {filters.statusIds.length > 0 && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-3 py-1"
              >
                Statuses: {filters.statusIds.length}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0 hover:bg-transparent hover:text-destructive"
                  onClick={() => setFilters({ ...filters, statusIds: [] })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.assigneeIds.length > 0 && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-3 py-1"
              >
                Assignees: {filters.assigneeIds.length}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0 hover:bg-transparent hover:text-destructive"
                  onClick={() => setFilters({ ...filters, assigneeIds: [] })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.priority && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-3 py-1"
              >
                Priority: {filters.priority}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0 hover:bg-transparent hover:text-destructive"
                  onClick={() => setFilters({ ...filters, priority: null })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.completed !== null && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-3 py-1"
              >
                {filters.completed ? 'Completed' : 'Active'}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0 hover:bg-transparent hover:text-destructive"
                  onClick={() => setFilters({ ...filters, completed: null })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="self-start sm:self-auto hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
