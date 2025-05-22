import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';
import { PermissionService } from '@/lib/permissions/unified-permission-service';

// GET /api/users/[userId]/documents - Get documents for a specific user
export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
): Promise<Response> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Extract userId from params safely
    const { userId } = params;

    // Check if user has permission to view this user's documents
    // Users can view their own documents, users with user_management permission can view any user's documents
    const isOwnProfile = session.user.id === userId;
    const hasUserManagementPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'user_management'
    );

    if (!isOwnProfile && !hasUserManagementPermission) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this user's documents" },
        { status: 403 }
      );
    }

    // Get documents for the user
    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error('Error fetching user documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user documents', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/users/[userId]/documents - Upload a document for a user
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
): Promise<Response> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Extract userId from params safely
    const { userId } = params;

    // Check if user has permission to upload documents for this user
    // Users can upload documents to their own profile, users with user_management permission can upload to any profile
    const isOwnProfile = session.user.id === userId;
    const hasUserManagementPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'user_management'
    );

    if (!isOwnProfile && !hasUserManagementPermission) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to upload documents for this user' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const description = (formData.get('description') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Get file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename with the original extension
    const originalName = file.name;
    const extension = originalName.split('.').pop() || '';
    const filename = `${uuidv4()}.${extension}`;

    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public/uploads/documents');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file to disk
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        userId,
        name: originalName,
        description,
        fileType: file.type,
        fileSize: file.size,
        filePath: `/uploads/documents/${filename}`,
      },
    });

    return NextResponse.json({ document });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId]/documents - Delete a document
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
): Promise<Response> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Extract userId from params safely
    const { userId } = params;
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Check if user has permission to delete this document
    // Users can delete their own documents, users with user_management permission can delete any document
    const isOwnProfile = session.user.id === userId;
    const hasUserManagementPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'user_management'
    );

    if (!isOwnProfile && !hasUserManagementPermission) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete this document' },
        { status: 403 }
      );
    }

    // Check if document exists and belongs to the user
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: This document does not belong to the specified user' },
        { status: 403 }
      );
    }

    // Delete the document record
    await prisma.document.delete({
      where: { id: documentId },
    });

    // Note: We're not deleting the actual file to avoid file system operations
    // In a production environment, you would delete the file from storage

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document', details: error.message },
      { status: 500 }
    );
  }
}
