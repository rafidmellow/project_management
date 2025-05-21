'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Project, TeamMembersFilters as FiltersType } from './team-types';
import { cn } from '@/lib/utils';

interface TeamMembersFiltersProps {
  filters: FiltersType;
  projects: Project[] | undefined;
  onFiltersChange: (filters: FiltersType) => void;
  className?: string;
  showActiveFilters?: boolean;
}

/**
 * A memoized component for filtering team members
 * Handles search, project filtering, and sorting with active filter indicators
 */
export const TeamMembersFilters = memo(function TeamMembersFilters({
  filters,
  projects,
  onFiltersChange,
  className,
  showActiveFilters = false,
}: TeamMembersFiltersProps) {
  // Local state for search input with debounce
  const [searchInput, setSearchInput] = useState(filters.search);

  // Update search when filters change externally
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Apply search filter when user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters, onFiltersChange]);

  // Handle project filter change
  const handleProjectChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        projectId: value === 'all' ? null : value,
      });
    },
    [filters, onFiltersChange]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    onFiltersChange({
      search: '',
      projectId: null,
    });
    setSearchInput('');
  }, [onFiltersChange]);

  // Check if any filters are active
  const hasActiveFilters = filters.search || filters.projectId;

  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-center gap-3 w-full">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search team members..."
            className="pl-9 bg-background border-border h-10"
            value={searchInput}
            onChange={handleSearchChange}
            aria-label="Search team members"
          />
        </div>

        <Select value={filters.projectId || 'all'} onValueChange={handleProjectChange}>
          <SelectTrigger
            className="w-[140px] bg-background border-border h-10"
            aria-label="Filter by project"
          >
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects?.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showActiveFilters && hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="outline" className="gap-1 pl-2">
                Search: {filters.search}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => onFiltersChange({ ...filters, search: '' })}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove search filter</span>
                </Button>
              </Badge>
            )}
            {filters.projectId && (
              <Badge variant="outline" className="gap-1 pl-2">
                Project: {projects?.find(p => p.id === filters.projectId)?.title || 'Unknown'}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => onFiltersChange({ ...filters, projectId: null })}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove project filter</span>
                </Button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
