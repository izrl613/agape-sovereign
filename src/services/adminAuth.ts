/**
 * Admin Access Control
 * Ensures the Admin Portal is strictly limited to verified identities.
 */

export class AdminAuth {
  private static readonly ALLOWED_ADMINS = ['idin@agape.nyc', 'agape@sovereign.nyc'];

  static async verifyAdminAccess(userToken: any): Promise<boolean> {
    const email = userToken.email;
    const verified = userToken.email_verified;

    if (!verified) return false;
    
    return this.ALLOWED_ADMINS.includes(email);
  }
}
