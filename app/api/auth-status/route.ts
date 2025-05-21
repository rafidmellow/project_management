import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Create a response with the session data
    const response = NextResponse.json({
      authenticated: !!session,
      session,
    });

    // Add cache control headers to prevent frequent calls
    // Cache for 5 minutes but allow revalidation
    response.headers.set(
      'Cache-Control',
      'public, max-age=300, s-maxage=300, stale-while-revalidate=300'
    );

    return response;
  } catch (error) {
    console.error('Error fetching auth status:', error);
    return NextResponse.json(
      {
        error: 'An error occurred while checking authentication status',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
