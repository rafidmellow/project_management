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

// PUT /api/users/[userId]/image - Upload a profile image for a user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<Response> {
  const { userId } = await params;
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to upload profile image for this user
    // Users can upload profile image to their own profile, users with user_management permission can upload to any profile
    const isOwnProfile = session.user.id === userId;
    const hasUserManagementPermission = await PermissionService.hasPermissionById(
      session.user.id,
      'user_management'
    );

    if (!isOwnProfile && !hasUserManagementPermission) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to update this user's profile image" },
        { status: 403 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(image.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 400 });
    }

    // Get file data
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename with the original extension
    const extension = image.name.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${extension}`;

    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public/uploads/profile-images');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file to disk
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Update user's profile image in database
    const imageUrl = `/uploads/profile-images/${filename}`;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json({
      message: 'Profile image updated successfully',
      image: imageUrl,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile image', details: error.message },
      { status: 500 }
    );
  }
}
