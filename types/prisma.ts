/**
 * Prisma Query Types
 *
 * This file contains type definitions for Prisma queries and filters.
 * Following Next.js 15 documentation standards for type definitions.
 */

import { Prisma } from '@prisma/client';

/**
 * User Where Input
 */
export type UserWhereInput = Prisma.UserWhereInput;

/**
 * Project Where Input
 */
export type ProjectWhereInput = Prisma.ProjectWhereInput;

/**
 * Task Where Input
 */
export type TaskWhereInput = Prisma.TaskWhereInput;

/**
 * Attendance Where Input
 */
export type AttendanceWhereInput = Prisma.AttendanceWhereInput;

/**
 * Activity Where Input
 */
export type ActivityWhereInput = Prisma.ActivityWhereInput;

/**
 * Document Where Input
 */
export type DocumentWhereInput = Prisma.DocumentWhereInput;

/**
 * Role Where Input
 */
export type RoleWhereInput = Prisma.RoleWhereInput;

/**
 * Permission Where Input
 */
export type PermissionWhereInput = Prisma.PermissionWhereInput;

/**
 * User Include Input
 */
export type UserIncludeInput = Prisma.UserInclude;

/**
 * Project Include Input
 */
export type ProjectIncludeInput = Prisma.ProjectInclude;

/**
 * Task Include Input
 */
export type TaskIncludeInput = Prisma.TaskInclude;

/**
 * Attendance Include Input
 */
export type AttendanceIncludeInput = Prisma.AttendanceInclude;

/**
 * Activity Include Input
 */
export type ActivityIncludeInput = Prisma.ActivityInclude;

/**
 * Document Include Input
 */
export type DocumentIncludeInput = Prisma.DocumentInclude;

/**
 * Role Include Input
 */
export type RoleIncludeInput = Prisma.RoleInclude;

/**
 * Permission Include Input
 */
export type PermissionIncludeInput = Prisma.PermissionInclude;

/**
 * User Order By Input
 */
export type UserOrderByInput = Prisma.UserOrderByWithRelationInput;

/**
 * Project Order By Input
 */
export type ProjectOrderByInput = Prisma.ProjectOrderByWithRelationInput;

/**
 * Task Order By Input
 */
export type TaskOrderByInput = Prisma.TaskOrderByWithRelationInput;

/**
 * Attendance Order By Input
 */
export type AttendanceOrderByInput = Prisma.AttendanceOrderByWithRelationInput;

/**
 * Activity Order By Input
 */
export type ActivityOrderByInput = Prisma.ActivityOrderByWithRelationInput;

/**
 * Document Order By Input
 */
export type DocumentOrderByInput = Prisma.DocumentOrderByWithRelationInput;

/**
 * Role Order By Input
 */
export type RoleOrderByInput = Prisma.RoleOrderByWithRelationInput;

/**
 * Permission Order By Input
 */
export type PermissionOrderByInput = Prisma.PermissionOrderByWithRelationInput;

/**
 * Generic Prisma Query Parameters
 */
export interface PrismaQueryParams<WhereInput, IncludeInput, OrderByInput> {
  where?: WhereInput;
  include?: IncludeInput;
  orderBy?: OrderByInput | OrderByInput[];
  skip?: number;
  take?: number;
  cursor?: any;
  distinct?: string[];
}

/**
 * User Query Parameters
 */
export type UserQueryParams = PrismaQueryParams<UserWhereInput, UserIncludeInput, UserOrderByInput>;

/**
 * Project Query Parameters
 */
export type ProjectQueryParams = PrismaQueryParams<
  ProjectWhereInput,
  ProjectIncludeInput,
  ProjectOrderByInput
>;

/**
 * Task Query Parameters
 */
export type TaskQueryParams = PrismaQueryParams<TaskWhereInput, TaskIncludeInput, TaskOrderByInput>;

/**
 * Attendance Query Parameters
 */
export type AttendanceQueryParams = PrismaQueryParams<
  AttendanceWhereInput,
  AttendanceIncludeInput,
  AttendanceOrderByInput
>;

/**
 * Activity Query Parameters
 */
export type ActivityQueryParams = PrismaQueryParams<
  ActivityWhereInput,
  ActivityIncludeInput,
  ActivityOrderByInput
>;

/**
 * Document Query Parameters
 */
export type DocumentQueryParams = PrismaQueryParams<
  DocumentWhereInput,
  DocumentIncludeInput,
  DocumentOrderByInput
>;

/**
 * Role Query Parameters
 */
export type RoleQueryParams = PrismaQueryParams<RoleWhereInput, RoleIncludeInput, RoleOrderByInput>;

/**
 * Permission Query Parameters
 */
export type PermissionQueryParams = PrismaQueryParams<
  PermissionWhereInput,
  PermissionIncludeInput,
  PermissionOrderByInput
>;
