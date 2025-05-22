/**
 * Central export file for all type definitions
 *
 * This file re-exports all types from their respective domain files
 * for easier imports throughout the application.
 */

// Re-export types from domain-specific files
export * from './user';
export * from './project';
export * from './task';
export * from './attendance';
export * from './permission';
export * from './document';
export type { Activity, ActivityWithRelations, CreateActivityDTO } from './activity';
export * from './dashboard';

// Re-export types from infrastructure files
export * from './api';
export * from './prisma';
export * from './service';

// Re-export KanbanColumn as Column for backward compatibility
export type Column = import('./task').KanbanColumn;
