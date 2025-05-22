import type { OAuthConfig } from 'next-auth/providers';
import { GoogleProfile } from '@/types/oauth';

// Only create the Google provider if credentials are available
const hasGoogleCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

export const googleProvider: OAuthConfig<GoogleProfile> = {
  id: 'google',
  name: 'Google',
  type: 'oauth',
  wellKnown: 'https://accounts.google.com/.well-known/openid-configuration',
  authorization: { params: { scope: 'openid email profile' } },
  idToken: true,
  checks: ['pkce', 'state'],
  profile(profile: GoogleProfile, tokens: Record<string, any>) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
};
