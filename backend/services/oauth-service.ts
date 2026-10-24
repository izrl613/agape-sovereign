import crypto from 'crypto';

/**
 * OAuthService handles the flow for third-party identity providers.
 */
export class OAuthService {
  private static GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
  private static GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';
  private static REDIRECT_URI = 'http://localhost:3001/api/auth/google/callback';

  /**
   * Generates the Google Authorization URL.
   */
  static getGoogleAuthUrl() {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: this.REDIRECT_URI,
      client_id: this.GOOGLE_CLIENT_ID,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
    };

    const qs = new URLSearchParams(options).toString();
    return `${rootUrl}?${qs}`;
  }

  /**
   * Exchanges the authorization code for access and refresh tokens.
   */
  static async exchangeCodeForTokens(code: string) {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const body = {
      code,
      client_id: this.GOOGLE_CLIENT_ID,
      client_secret: this.GOOGLE_CLIENT_SECRET,
      redirect_uri: this.REDIRECT_URI,
      grant_type: 'authorization_code',
    };

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    });

    if (!response.ok) throw new Error('Failed to exchange Google code for tokens');
    return await response.json();
  }

  /**
   * Verifies the user's identity using the access token.
   */
  static async verifyUser(accessToken: string) {
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
    const response = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error('Failed to fetch Google user info');
    return await response.json();
  }
}

export { OAuthService };
