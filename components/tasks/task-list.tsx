'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Edit,
  Trash,
  MoreHorizontal,
  CheckCircle2,
  ArrowUpDown,
  Circle,
  CircleDotDashed,
  CircleCheck,
  Calendar,
} from 'lucide-react';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Task, TaskAssignee } from '@/types/task';

interface TaskListProps {
  tasks: Task[];
  onDelete: (taskId: string) => void;
  onToggleCompletion?: (taskId: string) => void;
}

// --- Helper Functions ---

const getUserInitials = (name: string | null) => {
  if (!name) return 'U';
  const nameParts = name.split(' ');
  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getPriorityBadgeVariant = (
  priority: string
): 'destructive' | 'warning' | 'outline' | 'secondary' => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'warning'; // Using warning color for medium
    case 'low':
      return 'secondary'; // Using secondary for low
    default:
      return 'outline';
  }
};

const getStatusBadgeVariant = (
  statusName: string | undefined | null
): 'outline' | 'secondary' | 'success' => {
  switch (statusName?.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'in-progress':
      return 'secondary';
    case 'pending':
      return 'outline';
    // Add other fallback variants if needed
    default:
      return 'outline';
  }
};

const getStatusIcon = (statusName: string | undefined | null) => {
  switch (statusName?.toLowerCase()) {
    case 'pending':
      return <Circle className="mr-1.5 h-3 w-3 text-muted-foreground" />;
    case 'in-progress':
      return <CircleDotDashed className="mr-1.5 h-3 w-3 text-yellow-600" />;
    case 'completed':
      return <CircleCheck className="mr-1.5 h-3 w-3 text-green-600" />;
    // Add more cases based on actual status names if needed
    default:
      return <Circle className="mr-1.5 h-3 w-3 text-muted-foreground" />;
  }
};

// --- Column Definitions for React Table ---

const columns = (
  onDelete: (taskId: string) => void,
  onToggleCompletion?: (taskId: string) => void
): ColumnDef<Task>[] => [
  {
    id: 'completed',
    header: '',
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 p-0', task.completed && 'text-green-500')}
            onClick={() => onToggleCompletion?.(task.id)}
            disabled={!onToggleCompletion}
          >
            {task.completed ? <CircleCheck className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            <span className="sr-only">
              {task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            </span>
          </Button>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="flex items-center gap-1 font-medium -ml-3 px-3"
      >
        Title
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className="flex flex-col">
          <Link
            href={`/tasks/${task.id}`}
            className={cn(
              'font-medium hover:text-primary hover:underline max-w-[250px] md:max-w-[350px] lg:max-w-[450px] truncate',
              task.completed && 'line-through text-muted-foreground'
            )}
            title={task.title}
          >
            {task.title}
          </Link>
          {task.description && (
            <p
              className={cn(
                'text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-[250px] md:max-w-[350px] lg:max-w-[450px]',
                task.completed && 'line-through'
              )}
            >
              {task.description}
            </p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="flex items-center gap-1 font-medium -ml-3 px-3"
      >
        Status
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const statusName = status?.name;
      const statusColor = status?.color;

      const baseBadgeClasses =
        'capitalize whitespace-nowrap flex items-center w-fit text-xs font-medium border';

      const dynamicStyle: React.CSSProperties = statusColor
        ? {
            backgroundColor: `${statusColor}1A`,
            borderColor: `${statusColor}4D`,
            color: statusColor,
          }
        : {};

      return (
        <Badge
          style={statusColor ? dynamicStyle : {}}
          variant={!statusColor ? getStatusBadgeVariant(statusName) : null}
          className={cn(
            baseBadgeClasses,
            !statusColor && 'px-2 py-0.5',
            statusColor && 'px-2 py-0.5'
          )}
        >
          {getStatusIcon(statusName)}
          {statusName || 'No Status'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'project.title',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="items-center gap-1 font-medium -ml-3 px-3 hidden lg:inline-flex"
      >
        Project
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const project = row.original.project;
      return project ? (
        <Link
          href={`/projects/${project.id}`}
          className="text-sm hover:underline whitespace-nowrap max-w-[120px] lg:max-w-[180px] truncate block"
          title={project.title}
        >
          {project.title}
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      );
    },
    sortingFn: 'alphanumeric',
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="items-center gap-1 font-medium -ml-3 px-3"
      >
        Priority
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge
        variant={getPriorityBadgeVariant(row.original.priority)}
        className="capitalize whitespace-nowrap text-xs font-medium"
      >
        {row.original.priority}
      </Badge>
    ),
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="items-center gap-1 font-medium -ml-3 px-3 hidden md:inline-flex"
      >
        Due Date
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const dueDate = row.original.dueDate;
      return dueDate ? (
        <span className="text-sm whitespace-nowrap">{new Date(dueDate).toLocaleDateString()}</span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      );
    },
  },
  {
    id: 'assignees',
    header: 'Assigned To',
    cell: ({ row }) => {
      const assignees = row.original.assignees;

      if (assignees && assignees.length > 0) {
        const displayCount = 3; // Show first 3 avatars overlapping
        const visibleAssignees = assignees.slice(0, displayCount);
        const hiddenAssignees = assignees.slice(displayCount);
        const remainingCount = hiddenAssignees.length;

        return (
          <TooltipProvider delayDuration={100}>
            {' '}
            {/* Wrap in provider */}
            <div className="flex items-center -space-x-2">
              {' '}
              {/* Revert to negative space */}
              {visibleAssignees.map(assignee => (
                <Tooltip key={assignee.id}>
                  <TooltipTrigger asChild>
                    {/* Remove the inner div and name span */}
                    <Avatar className="h-7 w-7 border-2 border-background cursor-pointer">
                      {' '}
                      {/* Added cursor */}
                      {assignee.user.image ? (
                        <AvatarImage src={assignee.user.image} alt={assignee.user.name || 'User'} />
                      ) : null}
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                        {getUserInitials(assignee.user.name || null)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{assignee.user.name || 'Unnamed User'}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {remainingCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* Tooltip for the count indicator */}
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground z-10 cursor-default">
                      +{remainingCount}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {/* List remaining names */}
                    {hiddenAssignees.map(a => a.user.name || 'Unnamed').join(', ')}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        );
      } else {
        return <span className="text-sm text-muted-foreground">Unassigned</span>;
      }
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const task = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/tasks/${task.id}`} className="cursor-pointer w-full flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4" /> View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/tasks/${task.id}`} className="cursor-pointer w-full flex items-center">
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center"
              onClick={() => onDelete(task.id)}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];

// --- Main Component ---

export function TaskList({
  tasks,
  onDelete,
  onToggleCompletion,
  sortField,
  sortDirection,
  onSort,
}: TaskListProps & {
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Use external sorting if provided
  React.useEffect(() => {
    if (sortField && sortDirection) {
      setSorting([{ id: sortField, desc: sortDirection === 'desc' }]);
    }
  }, [sortField, sortDirection]);

  const handleColumnSort = React.useCallback(
    (columnId: string) => {
      if (onSort) {
        onSort(columnId);
      } else {
        setSorting(prev => {
          const isDesc = prev[0]?.id === columnId && !prev[0]?.desc;
          return [{ id: columnId, desc: isDesc }];
        });
      }
    },
    [onSort]
  );

  const tableColumns = React.useMemo(() => {
    const cols = columns(onDelete, onToggleCompletion);

    // Update column headers to use external sorting if provided
    return cols.map(col => {
      if (
        'accessorKey' in col &&
        col.accessorKey &&
        col.header &&
        typeof col.header === 'function'
      ) {
        return {
          ...col,
          header: ({ column }: any) => {
            const columnId = col.accessorKey as string;
            const isSorted = sortField === columnId;
            const isAsc = sortDirection === 'asc';

            return (
              <Button
                variant="ghost"
                onClick={() => handleColumnSort(columnId)}
                className={cn(
                  'flex items-center gap-1 font-medium -ml-3 px-3',
                  isSorted && 'text-primary',
                  col.id === 'project.title' && 'hidden lg:inline-flex',
                  col.id === 'dueDate' && 'hidden md:inline-flex',
                  col.id === 'status' && 'hidden md:inline-flex',
                  col.id === 'priority' && 'hidden md:inline-flex'
                )}
              >
                {columnId === 'title'
                  ? 'Title'
                  : columnId === 'status'
                    ? 'Status'
                    : columnId === 'project.title'
                      ? 'Project'
                      : columnId === 'priority'
                        ? 'Priority'
                        : columnId === 'dueDate'
                          ? 'Due Date'
                          : columnId}
                <ArrowUpDown className={cn('h-4 w-4', isSorted && 'text-primary')} />
                {isSorted && (
                  <span className="sr-only">
                    {isAsc ? 'sorted ascending' : 'sorted descending'}
                  </span>
                )}
              </Button>
            );
          },
        };
      }
      return col;
    });
  }, [onDelete, onToggleCompletion, sortField, sortDirection, handleColumnSort]);

  const table = useReactTable({
    data: tasks,
    columns: tableColumns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const columnCount = React.useMemo(() => tableColumns.length, [tableColumns]);

  return (
    <>
      {/* Desktop Table View - Hidden on Small Screens */}
      <div className="hidden sm:block rounded-md border shadow-xs overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {table.getHeaderGroups()[0].headers.map(header => (
                <TableHead
                  key={header.id}
                  className={cn(
                    'whitespace-nowrap px-3 py-2 text-sm font-medium',
                    header.id === 'project.title' && 'hidden lg:table-cell',
                    header.id === 'dueDate' && 'hidden md:table-cell',
                    header.id === 'assignees' && 'hidden md:table-cell',
                    header.id === 'completed' && 'w-10',
                    header.id === 'status' && 'hidden md:table-cell',
                    header.id === 'priority' && 'hidden md:table-cell'
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'px-3 py-2.5',
                        cell.column.id === 'project.title' && 'hidden lg:table-cell',
                        cell.column.id === 'dueDate' && 'hidden md:table-cell',
                        cell.column.id === 'assignees' && 'hidden md:table-cell',
                        cell.column.id === 'completed' && 'w-10',
                        cell.column.id === 'status' && 'hidden md:table-cell',
                        cell.column.id === 'priority' && 'hidden md:table-cell'
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View - Enhanced for Small Screens */}
      <div className="sm:hidden space-y-3">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map(row => {
            const task = row.original;
            return (
              <div key={task.id} className="border rounded-md p-3 shadow-xs bg-card">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-start gap-2">
                    {onToggleCompletion && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-7 w-7 p-0 shrink-0 -ml-1.5 -mt-0.5',
                          task.completed && 'text-green-500'
                        )}
                        onClick={() => onToggleCompletion(task.id)}
                        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {task.completed ? (
                          <CircleCheck className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Link
                      href={`/tasks/${task.id}`}
                      className={cn(
                        'text-base font-medium hover:underline line-clamp-2',
                        task.completed && 'line-through text-muted-foreground'
                      )}
                    >
                      {task.title}
                    </Link>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 -mt-1 -mr-1">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                      <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="text-xs">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="cursor-pointer flex items-center"
                        >
                          <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-xs">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="cursor-pointer flex items-center"
                        >
                          <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(task.id)}
                        className="text-destructive focus:text-destructive cursor-pointer flex items-center text-xs"
                      >
                        <Trash className="mr-2 h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
                  {task.project && (
                    <div className="flex items-center gap-1">
                      <span>Project: {task.project.title}</span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    {task.status && (
                      <Badge
                        style={
                          task.status.color
                            ? {
                                backgroundColor: `${task.status.color}1A`,
                                borderColor: `${task.status.color}4D`,
                                color: task.status.color,
                              }
                            : {}
                        }
                        variant={
                          !task.status.color ? getStatusBadgeVariant(task.status.name) : null
                        }
                        className="text-xs"
                      >
                        {task.status.name}
                      </Badge>
                    )}
                    <Badge
                      variant={getPriorityBadgeVariant(task.priority)}
                      className="capitalize text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </div>

                  {task.assignees && task.assignees.length > 0 && (
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {task.assignees.slice(0, 3).map(assignee => (
                        <Avatar key={assignee.id} className="h-6 w-6 border border-black">
                          {assignee.user.image ? (
                            <AvatarImage src={assignee.user.image} alt={assignee.user.name || ''} />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                              {getUserInitials(assignee.user.name || null)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ))}
                      {task.assignees.length > 3 && (
                        <div className="flex items-center justify-center h-6 w-6 rounded-full border border-black bg-muted text-[10px] font-medium">
                          +{task.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center p-4 border rounded-md bg-muted/10 shadow-xs">
            <p className="text-muted-foreground text-sm">No tasks found</p>
          </div>
        )}
      </div>
    </>
  );
}
