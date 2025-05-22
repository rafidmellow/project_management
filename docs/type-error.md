          ~
245         __tag__: 'DELETE'
    ~~~~~~~~~~~~~~~~~~~~~~~~~
...
247         __param_type__: SecondArg<MaybeField<TEntry, 'DELETE'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
248       },
    ~~~~~~~

.next/types/app/api/tasks/[taskId]/comments/route.ts:49:7 - error TS2344: Type '{ __tag__: "GET"; __param_position__: "second"; __param_type__: { params: { taskId: string; } | Promise<{ taskId: string; }>; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ taskId: string; } | Promise<{ taskId: string; }>' is not assignable to type 'Promise<any>'.
      Type '{ taskId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

 49       {
          ~
 50         __tag__: 'GET'
    ~~~~~~~~~~~~~~~~~~~~~~
...
 52         __param_type__: SecondArg<MaybeField<TEntry, 'GET'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 53       },
    ~~~~~~~

.next/types/app/api/tasks/[taskId]/comments/route.ts:166:7 - error TS2344: Type '{ __tag__: "POST"; __param_position__: "second"; __param_type__: { params: { taskId: string; } | Promise<{ taskId: string; }>; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ taskId: string; } | Promise<{ taskId: string; }>' is not assignable to type 'Promise<any>'.
      Type '{ taskId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

166       {
          ~
167         __tag__: 'POST'
    ~~~~~~~~~~~~~~~~~~~~~~~
...
169         __param_type__: SecondArg<MaybeField<TEntry, 'POST'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
170       },
    ~~~~~~~

.next/types/app/api/tasks/[taskId]/comments/route.ts:244:7 - error TS2344: Type '{ __tag__: "DELETE"; __param_position__: "second"; __param_type__: { params: { taskId: string; } | Promise<{ taskId: string; }>; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ taskId: string; } | Promise<{ taskId: string; }>' is not assignable to type 'Promise<any>'.
      Type '{ taskId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

244       {
          ~
245         __tag__: 'DELETE'
    ~~~~~~~~~~~~~~~~~~~~~~~~~
...
247         __param_type__: SecondArg<MaybeField<TEntry, 'DELETE'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
248       },
    ~~~~~~~

.next/types/app/api/tasks/[taskId]/toggle-completion/route.ts:166:7 - error TS2344: Type '{ __tag__: "POST"; __param_position__: "second"; __param_type__: { params: { taskId: string; } | Promise<{ taskId: string; }>; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ taskId: string; } | Promise<{ taskId: string; }>' is not assignable to type 'Promise<any>'.
      Type '{ taskId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

166       {
          ~
167         __tag__: 'POST'
    ~~~~~~~~~~~~~~~~~~~~~~~
...
169         __param_type__: SecondArg<MaybeField<TEntry, 'POST'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
170       },
    ~~~~~~~

.next/types/app/api/users/[userId]/documents/route.ts:49:7 - error TS2344: Type '{ __tag__: "GET"; __param_position__: "second"; __param_type__: { params: { userId: string; } | Promise<{ userId: string; }>; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ userId: string; } | Promise<{ userId: string; }>' is not assignable to type 'Promise<any>'.
      Type '{ userId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

 49       {
          ~
 50         __tag__: 'GET'
    ~~~~~~~~~~~~~~~~~~~~~~
...
 52         __param_type__: SecondArg<MaybeField<TEntry, 'GET'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 53       },
    ~~~~~~~

.next/types/app/api/users/[userId]/documents/route.ts:166:7 - error TS2344: Type '{ __tag__: "POST"; __param_position__: "second"; __param_type__: { params: { userId: string; } | Promise<{ userId: string; }>; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ userId: string; } | Promise<{ userId: string; }>' is not assignable to type 'Promise<any>'.
      Type '{ userId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

166       {
          ~
167         __tag__: 'POST'
    ~~~~~~~~~~~~~~~~~~~~~~~
...
169         __param_type__: SecondArg<MaybeField<TEntry, 'POST'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
170       },
    ~~~~~~~

.next/types/app/api/users/[userId]/documents/route.ts:244:7 - error TS2344: Type '{ __tag__: "DELETE"; __param_position__: "second"; __param_type__: { params: { userId: string; } | Promise<{ userId: string; }>; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ userId: string; } | Promise<{ userId: string; }>' is not assignable to type 'Promise<any>'.
      Type '{ userId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

244       {
          ~
245         __tag__: 'DELETE'
    ~~~~~~~~~~~~~~~~~~~~~~~~~
...
247         __param_type__: SecondArg<MaybeField<TEntry, 'DELETE'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
248       },
    ~~~~~~~

.next/types/app/api/users/[userId]/image/route.ts:205:7 - error TS2344: Type '{ __tag__: "PUT"; __param_position__: "second"; __param_type__: { params: { userId: string; } | Promise<{ userId: string; }>; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ userId: string; } | Promise<{ userId: string; }>' is not assignable to type 'Promise<any>'.
      Type '{ userId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

205       {
          ~
206         __tag__: 'PUT'
    ~~~~~~~~~~~~~~~~~~~~~~
...
208         __param_type__: SecondArg<MaybeField<TEntry, 'PUT'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
209       },
    ~~~~~~~

.next/types/app/api/users/[userId]/route.ts:49:7 - error TS2344: Type '{ __tag__: "GET"; __param_position__: "second"; __param_type__: { params: { userId: string; } | Promise<{ userId: string; }>; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ userId: string; } | Promise<{ userId: string; }>' is not assignable to type 'Promise<any>'.
      Type '{ userId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

 49       {
          ~
 50         __tag__: 'GET'
    ~~~~~~~~~~~~~~~~~~~~~~
...
 52         __param_type__: SecondArg<MaybeField<TEntry, 'GET'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 53       },
    ~~~~~~~

.next/types/app/api/users/[userId]/route.ts:244:7 - error TS2344: Type '{ __tag__: "DELETE"; __param_position__: "second"; __param_type__: { params: { userId: string; } | Promise<{ userId: string; }>; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ userId: string; } | Promise<{ userId: string; }>' is not assignable to type 'Promise<any>'.
      Type '{ userId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

244       {
          ~
245         __tag__: 'DELETE'
    ~~~~~~~~~~~~~~~~~~~~~~~~~
...
247         __param_type__: SecondArg<MaybeField<TEntry, 'DELETE'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
248       },
    ~~~~~~~

.next/types/app/api/users/[userId]/route.ts:283:7 - error TS2344: Type '{ __tag__: "PATCH"; __param_position__: "second"; __param_type__: { params: { userId: string; } | Promise<{ userId: string; }>; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'.
  The types of '__param_type__.params' are incompatible between these types.
    Type '{ userId: string; } | Promise<{ userId: string; }>' is not assignable to type 'Promise<any>'.
      Type '{ userId: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]

283       {
          ~
284         __tag__: 'PATCH'
    ~~~~~~~~~~~~~~~~~~~~~~~~
...
286         __param_type__: SecondArg<MaybeField<TEntry, 'PATCH'>>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
287       },
    ~~~~~~~

app/api/tasks/[taskId]/status/route.ts:43:65 - error TS2339: Property 'userId' does not exist on type '{ id: string; }'.

43     const isTeamMember = task.project.teamMembers.some(tm => tm.userId === session.user.id);
                                                                   ~~~~~~

app/api/tasks/[taskId]/time/route.ts:45:65 - error TS2339: Property 'userId' does not exist on type '{ id: string; }'.

45     const isTeamMember = task.project.teamMembers.some(tm => tm.userId === session.user.id);
                                                                   ~~~~~~

app/api/tasks/[taskId]/time/route.ts:46:47 - error TS2304: Cannot find name 'PermissionService'.

46     const hasTaskManagementPermission = await PermissionService.hasPermissionById(
                                                 ~~~~~~~~~~~~~~~~~

app/api/tasks/reorder/route.ts:306:22 - error TS18047: 'session' is possibly 'null'.

306         where: { id: session.user.id },
                         ~~~~~~~

app/api/tasks/reorder/route.ts:311:55 - error TS18047: 'session' is possibly 'null'.

311         console.warn(`Activity not created: User ID ${session.user.id} not found in database`);
                                                          ~~~~~~~

app/api/tasks/reorder/route.ts:326:21 - error TS18047: 'session' is possibly 'null'.

326             userId: session.user.id,
                        ~~~~~~~

app/api/users/[userId]/route.ts:572:20 - error TS2353: Object literal may only specify known properties, and 'createdById' does not exist in type 'TaskWhereInput'.

572           where: { createdById: userId },
                       ~~~~~~~~~~~

app/projects/[projectId]/page.tsx:157:48 - error TS7006: Parameter 'member' implicitly has an 'any' type.

157         const usersList = data.teamMembers.map(member => member.user).filter(Boolean);
                                                   ~~~~~~

app/projects/[projectId]/page.tsx:416:17 - error TS2322: Type '{ columns: { id: string; title: string; tasks: Task[]; }[]; onAddTask: () => void; onUpdateTask: (taskId: string) => void; onReorderTasks: () => void; onMoveTask: () => void; onError: () => void; showAddButton: true; emptyStateMessage: string; }' is not assignable to type 'IntrinsicAttributes & KanbanBoardProps'.
  Property 'columns' does not exist on type 'IntrinsicAttributes & KanbanBoardProps'.

416                 columns={statuses.map(status => ({
                    ~~~~~~~

app/projects/[projectId]/settings/page.tsx:215:75 - error TS2345: Argument of type 'Date | undefined' is not assignable to parameter of type 'Date | null'.
  Type 'undefined' is not assignable to type 'Date | null'.

215                           onSelect={date => handleDateChange('startDate', date)}
                                                                              ~~~~

app/projects/[projectId]/settings/page.tsx:245:73 - error TS2345: Argument of type 'Date | undefined' is not assignable to parameter of type 'Date | null'.
  Type 'undefined' is not assignable to type 'Date | null'.

245                           onSelect={date => handleDateChange('endDate', date)}
                                                                            ~~~~

app/tasks/[taskId]/page.tsx:128:18 - error TS7006: Parameter 'prev' implicitly has an 'any' type.

128       setNewTask(prev => ({
                     ~~~~

app/tasks/[taskId]/page.tsx:690:44 - error TS2345: Argument of type 'string | Date' is not assignable to parameter of type 'string | null | undefined'.
  Type 'Date' is not assignable to type 'string'.

690                     <span>Due: {formatDate(task.dueDate)} (Overdue)</span>
                                               ~~~~~~~~~~~~

app/tasks/[taskId]/page.tsx:692:44 - error TS2345: Argument of type 'string | Date' is not assignable to parameter of type 'string | null | undefined'.
  Type 'Date' is not assignable to type 'string'.

692                     <span>Due: {formatDate(task.dueDate)}</span>
                                               ~~~~~~~~~~~~

app/tasks/[taskId]/page.tsx:887:25 - error TS2322: Type 'TaskWithRelations[]' is not assignable to type 'Subtask[]'.
  Type 'TaskWithRelations' is not assignable to type 'Subtask'.
    Types of property 'assignees' are incompatible.
      Type 'TaskAssignee[] | undefined' is not assignable to type '{ id: string; user: { id: string; name: string | null; email?: string | undefined; image: string | null; }; }[] | undefined'.
        Type 'TaskAssignee[]' is not assignable to type '{ id: string; user: { id: string; name: string | null; email?: string | undefined; image: string | null; }; }[]'.
          Type 'TaskAssignee' is not assignable to type '{ id: string; user: { id: string; name: string | null; email?: string | undefined; image: string | null; }; }'.
            The types of 'user.name' are incompatible between these types.
              Type 'string | null | undefined' is not assignable to type 'string | null'.
                Type 'undefined' is not assignable to type 'string | null'.

887                         subtasks={task.subtasks}
                            ~~~~~~~~

  components/tasks/subtask-list.tsx:20:3
    20   subtasks: Subtask[];
         ~~~~~~~~
    The expected type comes from property 'subtasks' which is declared here on type 'IntrinsicAttributes & SubtaskListProps'

app/tasks/[taskId]/page.tsx:1387:52 - error TS2345: Argument of type 'string | Date' is not assignable to parameter of type 'string | null | undefined'.
  Type 'Date' is not assignable to type 'string'.

1387                   <span>{task.dueDate ? formatDate(task.dueDate) : 'Not set'}</span>
                                                        ~~~~~~~~~~~~

app/team/page.tsx:289:39 - error TS2322: Type '{ users: UserWithProfile[]; onDelete: (userId: string) => void; }' is not assignable to type 'IntrinsicAttributes & UserListProps'.
  Property 'onDelete' does not exist on type 'IntrinsicAttributes & UserListProps'.

289               <UserList users={users} onDelete={confirmDelete} />
                                          ~~~~~~~~

app/team/users/page.tsx:127:15 - error TS2322: Type '{ total: number; page: number; limit: number; totalPages: number; } | undefined' is not assignable to type 'Pagination | undefined'.
  Type '{ total: number; page: number; limit: number; totalPages: number; }' is missing the following properties from type 'Pagination': totalCount, pageSize, pageCount

127               pagination={pagination}
                  ~~~~~~~~~~

  components/team/user-list.tsx:61:3
    61   pagination?: Pagination;
         ~~~~~~~~~~
    The expected type comes from property 'pagination' which is declared here on type 'IntrinsicAttributes & UserListProps'

components/attendance/attendance-history.tsx:214:39 - error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'SetStateAction<"month" | "week" | "day" | null>'.
  Type 'string' is not assignable to type 'SetStateAction<"month" | "week" | "day" | null>'.

214             onChange={e => setGroupBy(e.target.value || null)}
                                          ~~~~~~~~~~~~~~~~~~~~~~

components/attendance/attendance-widget.tsx:174:32 - error TS18048: 'data.results' is possibly 'undefined'.

174           const successCount = data.results.filter((r: any) => r.success && !r.redundant).length;
                                   ~~~~~~~~~~~~

components/attendance/attendance-widget.tsx:175:34 - error TS18048: 'data.results' is possibly 'undefined'.

175           const redundantCount = data.results.filter((r: any) => r.redundant).length;
                                     ~~~~~~~~~~~~

components/attendance/attendance-widget.tsx:176:30 - error TS18048: 'data.results' is possibly 'undefined'.

176           const retryCount = data.results.filter((r: any) => r.willRetry).length;
                                 ~~~~~~~~~~~~

components/attendance/attendance-widget.tsx:177:32 - error TS18048: 'data.results' is possibly 'undefined'.

177           const failureCount = data.results.filter((r: any) => r.permanent).length;
                                   ~~~~~~~~~~~~

components/dashboard/attendance-summary.tsx:149:48 - error TS18047: 'attendance' is possibly 'null'.

149                 ? calculateTotalHours(new Date(attendance.checkInTime), new Date(), {
                                                   ~~~~~~~~~~

components/dashboard/attendance-summary.tsx:153:61 - error TS18047: 'attendance' is possibly 'null'.

153             activeSessionStart: hasActiveSession ? new Date(attendance.checkInTime) : undefined,
                                                                ~~~~~~~~~~

components/kanban/TaskCard.tsx:69:44 - error TS2339: Property 'avatar' does not exist on type 'TaskAssignee'.

69                 <AvatarImage src={assignee.avatar} alt={assignee.name} />
                                              ~~~~~~

components/kanban/TaskCard.tsx:69:66 - error TS2339: Property 'name' does not exist on type 'TaskAssignee'.

69                 <AvatarImage src={assignee.avatar} alt={assignee.name} />
                                                                    ~~~~

components/kanban/TaskCard.tsx:70:43 - error TS2339: Property 'name' does not exist on type 'TaskAssignee'.

70                 <AvatarFallback>{assignee.name[0]}</AvatarFallback>
                                             ~~~~

components/modals/task-create-modal.tsx:54:34 - error TS2554: Expected 0-1 arguments, but got 2.

54   const { users } = useUsers('', 100);
                                    ~~~

components/modals/task-create-modal.tsx:193:31 - error TS7006: Parameter 'project' implicitly has an 'any' type.

193                 {projects.map(project => (
                                  ~~~~~~~

components/modals/task-create-modal.tsx:214:15 - error TS2322: Type 'string[] | undefined' is not assignable to type 'string[]'.
  Type 'undefined' is not assignable to type 'string[]'.

214               selected={form.watch('assigneeIds')}
                  ~~~~~~~~

  components/ui/multi-select.tsx:11:3
    11   selected: string[];
         ~~~~~~~~
    The expected type comes from property 'selected' which is declared here on type 'IntrinsicAttributes & MultiSelectProps'

components/modals/task-create-modal.tsx:226:58 - error TS2345: Argument of type 'Date | undefined' is not assignable to parameter of type 'string | null | undefined'.
  Type 'Date' is not assignable to type 'string'.

226               onSelect={date => form.setValue('dueDate', date)}
                                                             ~~~~

components/modals/task-create-modal.tsx:234:65 - error TS2345: Argument of type 'string' is not assignable to parameter of type '"low" | "medium" | "high"'.

234               onValueChange={value => form.setValue('priority', value)}
                                                                    ~~~~~

components/profile/user-attendance-summary.tsx:158:39 - error TS2345: Argument of type 'string | Date' is not assignable to parameter of type 'string | null | undefined'.
  Type 'Date' is not assignable to type 'string'.

158                           {safeFormat(record.checkInTime, 'EEEE, MMMM d, yyyy')}
                                          ~~~~~~~~~~~~~~~~~~

components/profile/user-attendance-summary.tsx:162:39 - error TS2345: Argument of type 'string | Date' is not assignable to parameter of type 'string | null | undefined'.
  Type 'Date' is not assignable to type 'string'.

162                           {safeFormat(record.checkInTime, 'h:mm a')} -
                                          ~~~~~~~~~~~~~~~~~~

components/profile/user-attendance-summary.tsx:164:42 - error TS2345: Argument of type 'string | Date' is not assignable to parameter of type 'string | null | undefined'.
  Type 'Date' is not assignable to type 'string'.

164                             ? safeFormat(record.checkOutTime, ' h:mm a')
                                             ~~~~~~~~~~~~~~~~~~~

components/profile/user-profile-tasks.tsx:85:25 - error TS2367: This comparison appears to be unintentional because the types 'ProjectStatus | null | undefined' and 'string' have no overlap.

85                         task.status === 'completed'
                           ~~~~~~~~~~~~~~~~~~~~~~~~~~~

components/profile/user-profile-tasks.tsx:87:29 - error TS2367: This comparison appears to be unintentional because the types 'ProjectStatus | null | undefined' and 'string' have no overlap.

87                           : task.status === 'in-progress'
                               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

components/profile/user-profile-tasks.tsx:89:31 - error TS2367: This comparison appears to be unintentional because the types 'ProjectStatus | null | undefined' and 'string' have no overlap.

89                             : task.status === 'pending'
                                 ~~~~~~~~~~~~~~~~~~~~~~~~~

components/profile/user-profile-tasks.tsx:95:23 - error TS2322: Type 'ProjectStatus | null | undefined' is not assignable to type 'ReactNode'.
  Type 'ProjectStatus' is not assignable to type 'ReactNode'.

95                       {task.status}
                         ~~~~~~~~~~~~~

  node_modules/@types/react/index.d.ts:2398:9
    2398         children?: ReactNode | undefined;
                 ~~~~~~~~
    The expected type comes from property 'children' which is declared here on type 'IntrinsicAttributes & BadgeProps'

components/profile/user-project-roles.tsx:50:61 - error TS7006: Parameter 'membership' implicitly has an 'any' type.

50         const formattedMemberships = fetchedMemberships.map(membership => ({
                                                               ~~~~~~~~~~

components/project-table.tsx:17:29 - error TS2307: Cannot find module '@/hooks/use-projects' or its corresponding type declarations.

17 import { useProjects } from '@/hooks/use-projects';
                               ~~~~~~~~~~~~~~~~~~~~~~

components/project-table.tsx:75:35 - error TS2304: Cannot find name 'ProjectStatus'.

75   const getStatusBadge = (status: ProjectStatus | undefined | null) => {
                                     ~~~~~~~~~~~~~

components/project-table.tsx:147:26 - error TS7006: Parameter 'project' implicitly has an 'any' type.

147             projects.map(project => {
                             ~~~~~~~

components/project/kanban-board.tsx:113:25 - error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'SetStateAction<string | null>'.
  Type 'undefined' is not assignable to type 'SetStateAction<string | null>'.

113       setActiveStatusId(task.statusId);
                            ~~~~~~~~~~~~~

components/project/kanban-board.tsx:152:27 - error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'SetStateAction<string | null>'.
  Type 'undefined' is not assignable to type 'SetStateAction<string | null>'.

152         setActiveStatusId(overTask.statusId);
                              ~~~~~~~~~~~~~~~~~

components/project/kanban-board.tsx:245:45 - error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.

245           await moveTask(activeTaskData.id, overTaskData.statusId, overTaskData.id);
                                                ~~~~~~~~~~~~~~~~~~~~~

components/project/kanban-board.tsx:250:45 - error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.

250           await moveTask(activeTaskData.id, activeTaskData.statusId, overTaskData.id);
                                                ~~~~~~~~~~~~~~~~~~~~~~~

components/project/status-list-view-dndkit.tsx:360:25 - error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'SetStateAction<string | null>'.
  Type 'undefined' is not assignable to type 'SetStateAction<string | null>'.

360       setActiveStatusId(task.statusId);
                            ~~~~~~~~~~~~~

components/project/status-list-view-dndkit.tsx:402:27 - error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'SetStateAction<string | null>'.
  Type 'undefined' is not assignable to type 'SetStateAction<string | null>'.

402         setActiveStatusId(overTask.statusId);
                              ~~~~~~~~~~~~~~~~~

components/project/status-list-view-dndkit.tsx:407:11 - error TS2464: A computed property name must be of type 'string', 'number', 'symbol', or 'any'.

407           [overTask.statusId]: true,
              ~~~~~~~~~~~~~~~~~~~

components/project/status-list-view-dndkit.tsx:503:45 - error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.

503           await moveTask(activeTaskData.id, overTaskData.statusId, overTaskData.id);
                                                ~~~~~~~~~~~~~~~~~~~~~

components/project/status-list-view-dndkit.tsx:507:45 - error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.

507           await moveTask(activeTaskData.id, overTaskData.statusId, overTaskData.id);
                                                ~~~~~~~~~~~~~~~~~~~~~

components/project/task-context.tsx:307:23 - error TS2551: Property 'reorderTask' does not exist on type '{ getTasks: (page?: number, limit?: number, filters?: Record<string, any>) => Promise<any>; getTask: (id: string) => Promise<any>; createTask: (task: any) 
=> Promise<any>; updateTask: (id: string, task: any) => Promise<...>; deleteTask: (id: string) => Promise<...>; reorderTasks(columnId: string, tasks: Task[]): Pro...'. Did you mean 'reorderTasks'?

307         await taskApi.reorderTask(
                          ~~~~~~~~~~~

  lib/api.ts:452:9
    452   async reorderTasks(columnId: string, tasks: Task[]): Promise<void> {
                ~~~~~~~~~~~~
    'reorderTasks' is declared here.

components/project/task-form.tsx:289:24 - error TS2367: This comparison appears to be unintentional because the types 'number | null | undefined' and 'string' have no overlap.

289         estimatedTime: values.estimatedTime === '' ? null : values.estimatedTime,
                           ~~~~~~~~~~~~~~~~~~~~~~~~~~~

components/project/task-form.tsx:290:20 - error TS2367: This comparison appears to be unintentional because the types 'number | null | undefined' and 'string' have no overlap.

290         timeSpent: values.timeSpent === '' ? null : values.timeSpent,
                       ~~~~~~~~~~~~~~~~~~~~~~~

components/project/task-list-view.tsx:314:37 - error TS2345: Argument of type 'string | Date' is not assignable to parameter of type 'string | null | undefined'.
  Type 'Date' is not assignable to type 'string'.

314                         {formatDate(task.dueDate)}
                                        ~~~~~~~~~~~~

components/task-list-view.tsx:98:35 - error TS2304: Cannot find name 'DragStartEvent'.

98   const handleDragStart = (event: DragStartEvent) => {
                                     ~~~~~~~~~~~~~~

components/task-list-view.tsx:103:39 - error TS2552: Cannot find name 'DragEndEvent'. Did you mean 'DragEvent'?

103   const handleDragEnd = async (event: DragEndEvent) => {
                                          ~~~~~~~~~~~~

  node_modules/typescript/lib/lib.dom.d.ts:8109:13
    8109 declare var DragEvent: {
                     ~~~~~~~~~
    'DragEvent' is declared here.

components/task-list-view.tsx:112:47 - error TS2304: Cannot find name 'TaskDragData'.

112     const activeData = active.data.current as TaskDragData;
                                                  ~~~~~~~~~~~~

components/task-list-view.tsx:113:43 - error TS2304: Cannot find name 'TaskDragData'.

113     const overData = over.data.current as TaskDragData;
                                              ~~~~~~~~~~~~

components/task-list-view.tsx:164:34 - error TS2552: Cannot find name 'DragOverEvent'. Did you mean 'DragEvent'?

164   const handleDragOver = (event: DragOverEvent) => {
                                     ~~~~~~~~~~~~~

  node_modules/typescript/lib/lib.dom.d.ts:8109:13
    8109 declare var DragEvent: {
                     ~~~~~~~~~
    'DragEvent' is declared here.

components/task-list-view.tsx:168:47 - error TS2304: Cannot find name 'TaskDragData'.

168     const activeData = active.data.current as TaskDragData;
                                                  ~~~~~~~~~~~~

components/task-list-view.tsx:169:43 - error TS2304: Cannot find name 'TaskDragData'.

169     const overData = over.data.current as TaskDragData;
                                              ~~~~~~~~~~~~

components/task-list-view.tsx:312:43 - error TS2322: Type 'ProjectStatus | null | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.

312           <SortableTask task={activeTask} columnId={activeTask.status} view="list" />
                                              ~~~~~~~~

  components/tasks/sortable-task.tsx:9:3
    9   columnId: string;
        ~~~~~~~~
    The expected type comes from property 'columnId' which is declared here on type 'IntrinsicAttributes & Props'

components/task-list.tsx:131:23 - error TS7006: Parameter 'task' implicitly has an 'any' type.

131             tasks.map(task => (
                          ~~~~

components/task-list.tsx:168:34 - error TS7006: Parameter 'n' implicitly has an 'any' type.

168                             .map(n => n[0])
                                     ~

components/task/TaskListView.tsx:2:32 - error TS2307: Cannot find module './TaskListColumn' or its corresponding type declarations.

2 import { TaskListColumn } from './TaskListColumn';
                                 ~~~~~~~~~~~~~~~~~~

components/task/TaskListView.tsx:3:30 - error TS2307: Cannot find module './TaskListItem' or its corresponding type declarations.

3 import { TaskListItem } from './TaskListItem';
                               ~~~~~~~~~~~~~~~~

components/task/TaskListView.tsx:6:10 - error TS2305: Module '"@/lib/api"' has no exported member 'api'.

6 import { api } from '@/lib/api';
           ~~~

components/tasks/sortable-task.tsx:53:17 - error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ low: string; medium: string; high: string; }'.
  No index signature with a parameter of type 'string' was found on type '{ low: string; medium: string; high: string; }'.

53               ${priorityColors[task.priority || 'medium']}
                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

components/tasks/sortable-task.tsx:77:15 - error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ low: string; medium: string; high: string; }'.
  No index signature with a parameter of type 'string' was found on type '{ low: string; medium: string; high: string; }'.

77             ${priorityColors[task.priority || 'medium']}
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

components/tasks/task-list.tsx:324:42 - error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | null'.
  Type 'undefined' is not assignable to type 'string | null'.

324                         {getUserInitials(assignee.user.name)}
                                             ~~~~~~~~~~~~~~~~~~

components/tasks/task-list.tsx:437:15 - error TS2339: Property 'accessorKey' does not exist on type 'ColumnDef<Task>'.
  Property 'accessorKey' does not exist on type 'ColumnDefBase<Task, unknown> & StringHeaderIdentifier'.

437       if (col.accessorKey && col.header && typeof col.header === 'function') {
                  ~~~~~~~~~~~

components/tasks/task-list.tsx:440:22 - error TS7031: Binding element 'column' implicitly has an 'any' type.

440           header: ({ column }) => {
                         ~~~~~~

components/tasks/task-list.tsx:441:34 - error TS2339: Property 'accessorKey' does not exist on type 'ColumnDef<Task>'.
  Property 'accessorKey' does not exist on type 'ColumnDefBase<Task, unknown> & StringHeaderIdentifier'.

441             const columnId = col.accessorKey as string;
                                     ~~~~~~~~~~~

components/tasks/task-list.tsx:486:5 - error TS2322: Type '((ColumnDefBase<Task, unknown> & StringHeaderIdentifier) | (ColumnDefBase<Task, unknown> & IdIdentifier<Task, unknown>) | (AccessorKeyColumnDefBase<...> & Partial<...>) | { ...; } | { ...; })[]' is not 
assignable to type 'ColumnDef<Task, any>[]'.
  Type '(ColumnDefBase<Task, unknown> & StringHeaderIdentifier) | (ColumnDefBase<Task, unknown> & IdIdentifier<Task, unknown>) | (AccessorKeyColumnDefBase<...> & Partial<...>) | { ...; } | { ...; }' is not assignable to type 'ColumnDef<Task, any>'.
    Type '{ header: ({ column }: { column: any; }) => Element; columns?: ColumnDef<Task, any>[] | undefined; getUniqueValues?: AccessorFn<Task, unknown[]> | undefined; ... 22 more ...; id?: string | undefined; }' is not assignable to type 'ColumnDef<Task, any>'.
      Type '{ header: ({ column }: { column: any; }) => Element; columns?: ColumnDef<Task, any>[] | undefined; getUniqueValues?: AccessorFn<Task, unknown[]> | undefined; ... 22 more ...; id?: string | undefined; }' is not assignable to type 'GroupColumnDefBase<Task, any> & IdIdentifier<Task, any>'.
        Type '{ header: ({ column }: { column: any; }) => Element; columns?: ColumnDef<Task, any>[] | undefined; getUniqueValues?: AccessorFn<Task, unknown[]> | undefined; ... 22 more ...; id?: string | undefined; }' is not assignable to type 'IdIdentifier<Task, any>'.
          Types of property 'id' are incompatible.
            Type 'string | undefined' is not assignable to type 'string'.
              Type 'undefined' is not assignable to type 'string'.

486     columns: tableColumns,
        ~~~~~~~

  node_modules/@tanstack/table-core/build/lib/core/table.d.ts:23:5
    23     columns: ColumnDef<TData, any>[];
           ~~~~~~~
    The expected type comes from property 'columns' which is declared here on type 'TableOptions<Task>'

components/tasks/task-list.tsx:686:48 - error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | null'.
  Type 'undefined' is not assignable to type 'string | null'.

686                               {getUserInitials(assignee.user.name)}
                                                   ~~~~~~~~~~~~~~~~~~

components/team-table.tsx:153:29 - error TS7006: Parameter 'member' implicitly has an 'any' type.

153             teamMembers.map(member => (
                                ~~~~~~

components/team-table.tsx:162:32 - error TS7006: Parameter 'n' implicitly has an 'any' type.

162                           .map(n => n[0])
                                   ~

components/team/team-member-row.tsx:55:32 - error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | null'.
  Type 'undefined' is not assignable to type 'string | null'.

55               {getUserInitials(member.user?.name)}
                                  ~~~~~~~~~~~~~~~~~

components/team/team-members-list.tsx:99:25 - error TS7006: Parameter 'member' implicitly has an 'any' type.

99     teamMembers.forEach(member => {
                           ~~~~~~

components/team/team-members-list.tsx:352:31 - error TS2322: Type 'boolean | null' is not assignable to type 'boolean'.
  Type 'null' is not assignable to type 'boolean'.

352                               canDeleteTeamMembers={canDeleteTeamMembers}
                                  ~~~~~~~~~~~~~~~~~~~~

  components/team/team-member-row.tsx:23:3
    23   canDeleteTeamMembers: boolean;
         ~~~~~~~~~~~~~~~~~~~~
    The expected type comes from property 'canDeleteTeamMembers' which is declared here on type 'IntrinsicAttributes & TeamMemberRowProps'

components/team/team-members-list.tsx:413:17 - error TS2322: Type 'boolean | null' is not assignable to type 'boolean'.
  Type 'null' is not assignable to type 'boolean'.

413                 canDeleteTeamMembers={canDeleteTeamMembers}
                    ~~~~~~~~~~~~~~~~~~~~

  components/team/team-member-row.tsx:23:3
    23   canDeleteTeamMembers: boolean;
         ~~~~~~~~~~~~~~~~~~~~
    The expected type comes from property 'canDeleteTeamMembers' which is declared here on type 'IntrinsicAttributes & TeamMemberRowProps'

components/team/user-card.tsx:63:13 - error TS18048: 'user.role' is possibly 'undefined'.

63     switch (user.role.toLowerCase()) {
               ~~~~~~~~~

components/team/user-list.tsx:207:27 - error TS7006: Parameter 'line' implicitly has an 'any' type.

207               {lines.map((line, index) => (
                              ~~~~

components/team/user-list.tsx:207:33 - error TS7006: Parameter 'index' implicitly has an 'any' type.

207               {lines.map((line, index) => (
                                    ~~~~~

components/team/user-list.tsx:266:44 - error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | null'.
  Type 'undefined' is not assignable to type 'string | null'.

266                           {getUserInitials(user.name)}
                                               ~~~~~~~~~

components/team/user-list.tsx:282:42 - error TS2339: Property 'active' does not exist on type 'UserSummary'.

282                     <Badge variant={user.active ? 'outline' : 'secondary'}>
                                             ~~~~~~

components/team/user-list.tsx:283:29 - error TS2339: Property 'active' does not exist on type 'UserSummary'.

283                       {user.active ? 'Active' : 'Inactive'}
                                ~~~~~~

components/team/user-list.tsx:347:42 - error TS2345: Argument of type 'string | null | undefined' is not assignable to parameter of type 'string | null'.
  Type 'undefined' is not assignable to type 'string | null'.

347                         {getUserInitials(user.name)}
                                             ~~~~~~~~~

components/ui/calendar.tsx:96:7 - error TS2322: Type 'Date | Date[] | null | undefined' is not assignable to type 'Matcher | Matcher[] | undefined'.
  Type 'null' is not assignable to type 'Matcher | Matcher[] | undefined'.

96       selected={parsedSelected}
         ~~~~~~~~

  node_modules/react-day-picker/dist/index.d.ts:678:5
    678     selected?: Matcher | Matcher[] | undefined;
            ~~~~~~~~
    The expected type comes from property 'selected' which is declared here on type 'IntrinsicAttributes & (DayPickerDefaultProps | DayPickerSingleProps | DayPickerMultipleProps | DayPickerRangeProps)'

components/ui/calendar.tsx:97:7 - error TS2322: Type '(day: Date | undefined) => void' is not assignable to type 'SelectRangeEventHandler'.
  Types of parameters 'day' and 'range' are incompatible.
    Type 'DateRange | undefined' is not assignable to type 'Date | undefined'.
      Type 'DateRange' is missing the following properties from type 'Date': toDateString, toTimeString, toLocaleDateString, toLocaleTimeString, and 37 more.

97       onSelect={handleSelect}
         ~~~~~~~~

components/ui/date-range-calendar.tsx:36:6 - error TS2322: Type '{ title?: string | undefined; id?: string | undefined; style?: CSSProperties | undefined; footer?: ReactNode; disabled?: Matcher | Matcher[] | undefined; ... 56 more ...; onSelect: (range: DateRange | undefined) => void; }' is not assignable to type 'IntrinsicAttributes & (DayPickerDefaultProps | DayPickerSingleProps | DayPickerMultipleProps | DayPickerRangeProps)'.
  Type '{ title?: string | undefined; id?: string | undefined; style?: CSSProperties | undefined; footer?: ReactNode; disabled?: Matcher | Matcher[] | undefined; ... 56 more ...; onSelect: (range: DateRange | undefined) => void; }' is not assignable to type 'DayPickerRangeProps'.
    Types of property 'mode' are incompatible.
      Type '"default" | "multiple" | "range" | "single"' is not assignable to type '"range"'.
        Type '"default"' is not assignable to type '"range"'.

36     <DayPicker
        ~~~~~~~~~

hooks/use-auth-session.ts:109:12 - error TS2367: This comparison appears to be unintentional because the types '"loading" | "unauthenticated"' and '"authenticated"' have no overlap.

109     return status === 'authenticated';
               ~~~~~~~~~~~~~~~~~~~~~~~~~~

lib/activity-logger.ts:2:29 - error TS2305: Module '"@/types/api"' has no exported member 'ActivityWithRelations'.

2 import { ActivityLogParams, ActivityWithRelations } from '@/types/api';
                              ~~~~~~~~~~~~~~~~~~~~~

lib/api.ts:246:12 - error TS2532: Object is possibly 'undefined'.

246     return this.getProjectStatusesByProjectId(firstProject.id);
               ~~~~

lib/api.ts:452:47 - error TS2304: Cannot find name 'Task'.

452   async reorderTasks(columnId: string, tasks: Task[]): Promise<void> {
                                                  ~~~~

lib/auth-options.ts:10:5 - error TS2322: Type 'OAuthConfig<GoogleProfile>' is not assignable to type 'Provider'.
  Type 'OAuthConfig<GoogleProfile>' is not assignable to type 'OAuthConfig<any>'.
    Types of property 'checks' are incompatible.
      Type 'string[] | undefined' is not assignable to type 'ChecksType | ChecksType[] | undefined'.
        Type 'string[]' is not assignable to type 'ChecksType | ChecksType[] | undefined'.
          Type 'string[]' is not assignable to type 'ChecksType[]'.
            Type 'string' is not assignable to type 'ChecksType'.

10     ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [googleProvider] : []),
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

lib/auth-options.ts:11:5 - error TS2322: Type 'OAuthConfig<GoogleProfile> | CredentialsConfig<{ email: { label: string; type: string; }; password: { label: string; type: string; }; }>' is not assignable to type 'Provider'.
  Type 'OAuthConfig<GoogleProfile>' is not assignable to type 'Provider'.
    Type 'OAuthConfig<GoogleProfile>' is not assignable to type 'OAuthConfig<any>'.
      Types of property 'checks' are incompatible.
        Type 'string[] | undefined' is not assignable to type 'ChecksType | ChecksType[] | undefined'.
          Type 'string[]' is not assignable to type 'ChecksType | ChecksType[] | undefined'.
            Type 'string[]' is not assignable to type 'ChecksType[]'.
              Type 'string' is not assignable to type 'ChecksType'.

 11     CredentialsProvider({
        ~~~~~~~~~~~~~~~~~~~~~
 12       name: 'Credentials',
    ~~~~~~~~~~~~~~~~~~~~~~~~~~
...
 55       },
    ~~~~~~~~
 56     }),
    ~~~~~~

lib/dnd-utils.ts:13:65 - error TS2345: Argument of type '{ context: SensorContext; }' is not assignable to parameter of type '{ active: UniqueIdentifier; currentCoordinates: Coordinates; context: SensorContext; }'.
  Type '{ context: SensorContext; }' is missing the following properties from type '{ active: UniqueIdentifier; currentCoordinates: Coordinates; context: SensorContext; }': active, currentCoordinates

13   const coordinates = defaultSortableKeyboardCoordinates(event, { context });
                                                                   ~~~~~~~~~~~

lib/dnd-utils.ts:186:47 - error TS2322: Type 'string' is not assignable to type 'ProjectStatus'.

186   targetTasks.splice(overIndex, 0, { ...task, status: targetColumn.id });
                                                  ~~~~~~

  types/task.ts:38:3
    38   status?: import('./project').ProjectStatus | null;
         ~~~~~~
    The expected type comes from property 'status' which is declared here on type 'TaskWithRelations'

lib/indexed-db.ts:63:7 - error TS2322: Type 'null' is not assignable to type 'string | undefined'.

63       lastAttempt: null,
         ~~~~~~~~~~~

  lib/indexed-db.ts:19:3
    19   lastAttempt?: string;
         ~~~~~~~~~~~
    The expected type comes from property 'lastAttempt' which is declared here on type 'AttendanceRecord'

lib/permissions/unified-permission-service.ts:255:9 - error TS2322: Type 'RoleCacheEntry | UiPermission[]' is not assignable to type '{ id: string; name: string; description: string; color: string; }[]'.
  Type 'RoleCacheEntry' is missing the following properties from type '{ id: string; name: string; description: string; color: string; }[]': length, pop, push, concat, and 35 more.

255         return this.roleCache['roles'];
            ~~~~~~

lib/permissions/unified-permission-service.ts:295:9 - error TS2322: Type 'RoleCacheEntry | UiPermission[]' is not assignable to type 'UiPermission[]'.
  Type 'RoleCacheEntry' is missing the following properties from type 'UiPermission[]': length, pop, push, concat, and 35 more.

295         return this.roleCache['permissions'];
            ~~~~~~

lib/queries/task-queries.ts:136:7 - error TS2322: Type '{ assignees: { include: { user: { select: { id: boolean; name: boolean; image: boolean; }; }; }; }; status: { select: { name: true; color: true; }; }; }' is not assignable to type 'TaskInclude<DefaultArgs> & { assignedTo: { select: { id: boolean; name: boolean; image: boolean; }; }; subtasks?: { orderBy: Enumerable<TaskOrderByWithRelationInput>; include: { ...; }; } | undefined; }'.
  Property 'assignedTo' is missing in type '{ assignees: { include: { user: { select: { id: boolean; name: boolean; image: boolean; }; }; }; }; status: { select: { name: true; color: true; }; }; }' but required in type '{ assignedTo: { select: { id: boolean; name: boolean; image: boolean; }; }; subtasks?: { orderBy: Enumerable<TaskOrderByWithRelationInput>; include: { ...; }; } | undefined; }'.

136       include: {
          ~~~~~~~

  lib/queries/task-queries.ts:43:7
    43       assignedTo: { select: typeof userMinimalSelectFields };
             ~~~~~~~~~~
    'assignedTo' is declared here.

lib/queries/task-queries.ts:152:9 - error TS2322: Type '{ assignees: { include: { user: { select: { id: boolean; name: boolean; image: boolean; }; }; }; }; status: { select: { name: true; color: true; }; }; }' is not assignable to type 'TaskInclude<DefaultArgs> & { assignedTo: { select: { id: boolean; name: boolean; image: boolean; }; }; subtasks?: { orderBy: Enumerable<TaskOrderByWithRelationInput>; include: { ...; }; } | undefined; }'.
  Property 'assignedTo' is missing in type '{ assignees: { include: { user: { select: { id: boolean; name: boolean; image: boolean; }; }; }; }; status: { select: { name: true; color: true; }; }; }' but required in type '{ assignedTo: { select: { id: boolean; name: boolean; image: boolean; }; }; subtasks?: { orderBy: Enumerable<TaskOrderByWithRelationInput>; include: { ...; }; } | undefined; }'.

152         include: {
            ~~~~~~~

  lib/queries/task-queries.ts:47:11
    47           assignedTo: { select: typeof userMinimalSelectFields };
                 ~~~~~~~~~~
    'assignedTo' is declared here.

lib/queries/task-queries.ts:168:11 - error TS2322: Type '{ assignees: { include: { user: { select: { id: boolean; name: boolean; image: boolean; }; }; }; }; status: { select: { name: true; color: true; }; }; }' is not assignable to type 'TaskInclude<DefaultArgs> & { assignedTo: { select: { id: boolean; name: boolean; image: boolean; }; }; }'.
  Property 'assignedTo' is missing in type '{ assignees: { include: { user: { select: { id: boolean; name: boolean; image: boolean; }; }; }; }; status: { select: { name: true; color: true; }; }; }' but required in type '{ assignedTo: { select: { id: boolean; name: boolean; image: boolean; }; }; }'.

168           include: {
              ~~~~~~~

  lib/queries/task-queries.ts:51:15
    51               assignedTo: { select: typeof userMinimalSelectFields };
                     ~~~~~~~~~~
    'assignedTo' is declared here.

lib/queries/user-queries.ts:181:9 - error TS2561: Object literal may only specify known properties, but 'status' does not exist in type 'ProjectSelect<DefaultArgs>'. Did you mean to write 'statuses'?

181         status: true,
            ~~~~~~

lib/queries/user-queries.ts:188:12 - error TS2339: Property 'tasks' does not exist on type 'UserSelect<DefaultArgs>'.

188     select.tasks = {
               ~~~~~

lib/queries/user-queries.ts:295:30 - error TS2339: Property 'tasks' does not exist on type '{ createdAt: Date; updatedAt: Date; id: string; activities: { createdAt: Date; id: string; description: string | null; userId: string; projectId: string | null; taskId: 
string | null; action: string; entityType: string; entityId: string; }[]; ... 25 more ...; teams: { ...; }[]; }'.

295   const allTasks = [...(user.tasks || [])];
                                 ~~~~~

lib/queries/user-queries.ts:300:40 - error TS2339: Property 'task' does not exist on type '{ createdAt: Date; updatedAt: Date; id: string; userId: string; taskId: string; }'.

300       .filter(assignment => assignment.task) // Filter out any null tasks
                                           ~~~~

lib/queries/user-queries.ts:301:37 - error TS2339: Property 'task' does not exist on type '{ createdAt: Date; updatedAt: Date; id: string; userId: string; taskId: string; }'.

301       .map(assignment => assignment.task);
                                        ~~~~

lib/queries/user-queries.ts:323:7 - error TS2561: Object literal may only specify known properties, but 'status' does not exist in type 'ProjectSelect<DefaultArgs>'. Did you mean to write 'statuses'?

323       status: true,
          ~~~~~~

lib/queries/user-queries.ts:364:7 - error TS2353: Object literal may only specify known properties, and 'assignedToId' does not exist in type 'TaskWhereInput'.

364       assignedToId: userId,
          ~~~~~~~~~~~~

lib/queries/user-queries.ts:407:9 - error TS2322: Type '{ name: string; email: string; image?: string; role?: string; bio?: string; jobTitle?: string; department?: string; location?: string; phone?: string; skills?: string[]; socialLinks?: { twitter?: string; linkedin?: string; github?: string; website?: string; }; }' is not assignable to type 'UserCreateInput'.
  Types of property 'skills' are incompatible.
    Type 'string[] | undefined' is not assignable to type 'string | null | undefined'.
      Type 'string[]' is not assignable to type 'string'.

407   const userToCreate: Prisma.UserCreateInput = {
            ~~~~~~~~~~~~

lib/queries/user-queries.ts:435:9 - error TS2322: Type '{ name?: string | undefined; email?: string | undefined; image?: string | undefined; role?: string | undefined; bio?: string | undefined; jobTitle?: string | undefined; department?: string | undefined; location?: string | undefined; phone?: string | undefined; skills?: string[] | undefined; socialLinks?: { twitter?:...' is not assignable to type 'UserUpdateInput'.
  Types of property 'skills' are incompatible.
    Type 'string[] | undefined' is not assignable to type 'string | NullableStringFieldUpdateOperationsInput | null | undefined'.
      Type 'string[]' is not assignable to type 'string | NullableStringFieldUpdateOperationsInput | null | undefined'.

435   const userToUpdate: Prisma.UserUpdateInput = {
            ~~~~~~~~~~~~

lib/utils/date.ts:123:17 - error TS2323: Cannot redeclare exported variable 'safeFormat'.

123 export function safeFormat(
                    ~~~~~~~~~~

lib/utils/date.ts:123:17 - error TS2393: Duplicate function implementation.

123 export function safeFormat(
                    ~~~~~~~~~~

lib/utils/date.ts:505:17 - error TS2323: Cannot redeclare exported variable 'safeFormat'.

505 export function safeFormat(
                    ~~~~~~~~~~

lib/utils/date.ts:505:17 - error TS2393: Duplicate function implementation.

505 export function safeFormat(
                    ~~~~~~~~~~

types/index.ts:20:1 - error TS2308: Module './activity' has already exported a member named 'ActivityWhereInput'. Consider explicitly re-exporting to resolve the ambiguity.

20 export * from './prisma';
   ~~~~~~~~~~~~~~~~~~~~~~~~~

types/task.ts:116:12 - error TS2304: Cannot find name 'ProjectStatus'.

116   status?: ProjectStatus | null;
               ~~~~~~~~~~~~~


Found 143 errors in 56 files.

Errors  Files
     3  .next/types/app/api/projects/[projectId]/statuses/[statusId]/route.ts:49
     1  .next/types/app/api/projects/[projectId]/statuses/reorder/route.ts:166
     2  .next/types/app/api/projects/[projectId]/statuses/route.ts:49
     3  .next/types/app/api/tasks/[taskId]/attachments/route.ts:49
     3  .next/types/app/api/tasks/[taskId]/comments/route.ts:49
     1  .next/types/app/api/tasks/[taskId]/toggle-completion/route.ts:166
     3  .next/types/app/api/users/[userId]/documents/route.ts:49
     1  .next/types/app/api/users/[userId]/image/route.ts:205
     3  .next/types/app/api/users/[userId]/route.ts:49
     1  app/api/tasks/[taskId]/status/route.ts:43
     2  app/api/tasks/[taskId]/time/route.ts:45
     3  app/api/tasks/reorder/route.ts:306
     1  app/api/users/[userId]/route.ts:572
     2  app/projects/[projectId]/page.tsx:157
     2  app/projects/[projectId]/settings/page.tsx:215
     5  app/tasks/[taskId]/page.tsx:128
     1  app/team/page.tsx:289
     1  app/team/users/page.tsx:127
     1  components/attendance/attendance-history.tsx:214
     4  components/attendance/attendance-widget.tsx:174
     2  components/dashboard/attendance-summary.tsx:149
     3  components/kanban/TaskCard.tsx:69
     5  components/modals/task-create-modal.tsx:54
     3  components/profile/user-attendance-summary.tsx:158
     4  components/profile/user-profile-tasks.tsx:85
     1  components/profile/user-project-roles.tsx:50
     3  components/project-table.tsx:17
     4  components/project/kanban-board.tsx:113
     5  components/project/status-list-view-dndkit.tsx:360
     1  components/project/task-context.tsx:307
     2  components/project/task-form.tsx:289
     1  components/project/task-list-view.tsx:314
     8  components/task-list-view.tsx:98
     2  components/task-list.tsx:131
     3  components/task/TaskListView.tsx:2
     2  components/tasks/sortable-task.tsx:53
     6  components/tasks/task-list.tsx:324
     2  components/team-table.tsx:153
     1  components/team/team-member-row.tsx:55
     3  components/team/team-members-list.tsx:99
     1  components/team/user-card.tsx:63
     6  components/team/user-list.tsx:207
     2  components/ui/calendar.tsx:96
     1  components/ui/date-range-calendar.tsx:36
     1  hooks/use-auth-session.ts:109
     1  lib/activity-logger.ts:2
     2  lib/api.ts:246
     2  lib/auth-options.ts:10
     2  lib/dnd-utils.ts:13
     1  lib/indexed-db.ts:63
     2  lib/permissions/unified-permission-service.ts:255
     3  lib/queries/task-queries.ts:136
     9  lib/queries/user-queries.ts:181
     4  lib/utils/date.ts:123
     1  types/index.ts:20
     1  types/task.ts:116