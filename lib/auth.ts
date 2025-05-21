import { fetchAPI } from './api';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import { RegistrationData } from '@/types/user';

/**
 * Auth utility functions for authentication and user management
 * These functions are thin wrappers around NextAuth.js functionality
 */

export type RegisterCredentials = Pick<RegistrationData, 'name' | 'email' | 'password'>;

/**
 * Register a new user
 */
export async function registerUser(credentials: RegisterCredentials) {
  try {
    const response = await fetchAPI('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        ...credentials,
        isRegistration: true,
      }),
    });
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Sign out the current user using NextAuth.js
 */
export async function signOut() {
  try {
    await nextAuthSignOut({ callbackUrl: '/login' });
  } catch (error) {
    console.error('Sign out error:', error);
  }
}
