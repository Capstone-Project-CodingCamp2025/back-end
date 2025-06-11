// services/googleAuthService.js
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const GoogleAuthService = {
  // Generate Google OAuth URL
  generateAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true
    });

    return authUrl;
  },

  // Verify Google token and get user info
  async verifyGoogleToken(code) {
    try {
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      
      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified
      };
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new Error('Invalid Google token');
    }
  },

  // Verify Google ID token (for frontend verification)
  async verifyIdToken(idToken) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      
      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified
      };
    } catch (error) {
      console.error('Google ID token verification failed:', error);
      throw new Error('Invalid Google ID token');
    }
  }
};

module.exports = GoogleAuthService;