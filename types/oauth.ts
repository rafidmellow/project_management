/**
 * OAuth Provider Type Definitions
 *
 * This file contains type definitions for OAuth providers used with NextAuth.
 */

/**
 * OAuth provider configuration type
 */
export interface OAuthConfig<P = Record<string, any>> {
  id: string;
  name: string;
  type: 'oauth';
  authorization: string | { params: Record<string, string> };
  token?: string;
  userinfo?: {
    url: string;
    params?: Record<string, string>;
    request?: (context: {
      tokens: Record<string, any>;
      client: any;
      provider: any;
    }) => Promise<any>;
  };
  profile: (profile: P, tokens: Record<string, any>) => any;
  clientId: string;
  clientSecret: string;
  idToken?: boolean;
  wellKnown?: string;
  checks?: string[];
}

/**
 * Google profile type
 */
export interface GoogleProfile {
  sub: string;
  name: string;
  email: string;
  email_verified: boolean;
  picture: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
}

/**
 * Facebook profile type
 */
export interface FacebookProfile {
  id: string;
  name: string;
  email: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

/**
 * Normalized OAuth user profile
 */
export interface NormalizedProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
}
