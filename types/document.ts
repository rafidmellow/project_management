/**
 * Document Management Types
 *
 * This file contains all type definitions related to documents and file attachments in the application.
 * Following Next.js 15 documentation standards for type definitions.
 */

/**
 * Base Document interface representing the core document data
 */
export interface Document {
  id: string;
  name: string;
  description?: string | null;
  fileType: string;
  fileSize: number;
  filePath: string;
  userId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Document with related entities
 */
export interface DocumentWithRelations extends Document {
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
}

/**
 * Document Creation DTO
 */
export interface CreateDocumentDTO {
  name: string;
  description?: string;
  file: File;
}

/**
 * Document Update DTO
 */
export interface UpdateDocumentDTO {
  name?: string;
  description?: string | null;
}

/**
 * Document Filter Options
 */
export interface DocumentFilterOptions {
  userId?: string;
  fileType?: string;
  search?: string;
  sortBy?: 'name' | 'fileSize' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Document API Response
 */
export interface DocumentResponse {
  document: DocumentWithRelations;
}

/**
 * Documents List API Response
 */
export interface DocumentsListResponse {
  documents: DocumentWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * File Upload Response
 */
export interface FileUploadResponse {
  success: boolean;
  document?: DocumentWithRelations;
  error?: string;
}

/**
 * Supported File Types
 */
export interface SupportedFileTypes {
  documents: string[];
  images: string[];
  videos: string[];
  audio: string[];
  archives: string[];
  other: string[];
}

/**
 * File Size Limits (in bytes)
 */
export interface FileSizeLimits {
  documents: number;
  images: number;
  videos: number;
  audio: number;
  archives: number;
  other: number;
  max: number;
}
