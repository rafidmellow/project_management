import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import {
  AttendanceSettings,
  UpdateAttendanceSettingsDTO,
  AttendanceSettingsResponse,
} from '@/types/attendance';

// Validation schema for attendance settings
const updateSettingsSchema = z.object({
  workHoursPerDay: z.number().min(1).max(24),
  workDays: z.string(),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().optional().nullable(),
  autoCheckoutEnabled: z.boolean(),
  autoCheckoutTime: z.string().optional().nullable(),
});

// GET /api/attendance/settings - Get the current user's attendance settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's attendance settings
    const settings = await prisma.attendanceSettings.findUnique({
      where: { userId: session.user.id },
    });

    // If no settings exist, create default settings
    if (!settings) {
      // First check if the user exists
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
      }

      const defaultSettings = await prisma.attendanceSettings.create({
        data: {
          userId: session.user.id,
          workHoursPerDay: 8,
          workDays: '1,2,3,4,5',
          reminderEnabled: true,
          autoCheckoutEnabled: false,
        },
      });

      const response: AttendanceSettingsResponse = {
        settings: defaultSettings as AttendanceSettings,
      };
      return NextResponse.json(response);
    }

    const response: AttendanceSettingsResponse = {
      settings: settings as AttendanceSettings,
    };
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching attendance settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance settings', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/attendance/settings - Update the current user's attendance settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = (await req.json()) as UpdateAttendanceSettingsDTO;
    const validationResult = updateSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const {
      workHoursPerDay,
      workDays,
      reminderEnabled,
      reminderTime,
      autoCheckoutEnabled,
      autoCheckoutTime,
    } = validationResult.data as UpdateAttendanceSettingsDTO;

    // Update or create settings
    const settings = await prisma.attendanceSettings.upsert({
      where: { userId: session.user.id },
      update: {
        workHoursPerDay,
        workDays,
        reminderEnabled,
        reminderTime,
        autoCheckoutEnabled,
        autoCheckoutTime,
      },
      create: {
        userId: session.user.id,
        workHoursPerDay,
        workDays,
        reminderEnabled,
        reminderTime,
        autoCheckoutEnabled,
        autoCheckoutTime,
      },
    });

    const response: AttendanceSettingsResponse = {
      settings: settings as AttendanceSettings,
    };
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error updating attendance settings:', error);
    return NextResponse.json(
      { error: 'Failed to update attendance settings', details: error.message },
      { status: 500 }
    );
  }
}
