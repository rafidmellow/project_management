/**
 * Type definitions for next-auth providers
 */

export interface OAuthConfig<P> {
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
