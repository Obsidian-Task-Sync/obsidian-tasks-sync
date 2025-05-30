import { OAuth2Client } from 'google-auth-library';
import { Notice, Platform } from 'obsidian';

class GTaskAuthData {
  accessToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  accessTokenExpiresAt: number;

  constructor(accessToken: string, refreshToken: string, clientId: string, clientSecret: string, expiresIn: number) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.clientId = clientId;
    this.accessTokenExpiresAt = Date.now() + expiresIn * 1000;
  }

  accessTokenIsValid(): boolean {
    return Date.now() < this.accessTokenExpiresAt;
  }

  async refresh(): Promise<void> {
    const oAuth2Client = new OAuth2Client(this.clientId, this.clientSecret, GTaskAuthorization.REDIRECT_URI);
    oAuth2Client.setCredentials({ refresh_token: this.refreshToken });
    const { credentials } = await oAuth2Client.refreshAccessToken();
    this.accessToken = credentials.access_token!;
    this.accessTokenExpiresAt =
      Date.now() + (credentials.expiry_date ? (credentials.expiry_date - Date.now()) / 1000 : 3600) * 1000;
  }
}

export class GTaskAuthorization {
  static SERVER_PORT = 42813;
  static SERVER_URI = 'http://127.0.0.1:' + GTaskAuthorization.SERVER_PORT;
  static REDIRECT_URI = GTaskAuthorization.SERVER_URI + '/callback';

  private static SCOPES = 'https://www.googleapis.com/auth/tasks';

  private authData: GTaskAuthData;
  private saveAuthData: (data: GTaskAuthData) => Promise<void>;
  private loadAuthData: () => Promise<GTaskAuthData>;

  private constructor(
    saveAuthData: (data: GTaskAuthData) => Promise<void>,
    loadAuthData: () => Promise<GTaskAuthData>,
    authData: GTaskAuthData,
  ) {
    this.saveAuthData = saveAuthData;
    this.loadAuthData = loadAuthData;
    this.authData = authData;
  }

  static async getAuthorization(
    saveAuthData: (data: GTaskAuthData) => Promise<void>,
    loadAuthData: () => Promise<GTaskAuthData>,
    clientId: string,
    clientSecret: string,
  ): Promise<GTaskAuthorization> {
    const authData = await loadAuthData();

    if (authData != null) {
      if (authData.accessTokenIsValid()) {
        return new GTaskAuthorization(saveAuthData, loadAuthData, authData);
      } else {
        //TODO: refresh Token이 유효하지 않은 경우 새로 발급받도록 하기
        await authData.refresh();
        await saveAuthData(authData);
      }
      return new GTaskAuthorization(saveAuthData, loadAuthData, authData);
    }

    const registeredAuthData = await this.loginGoogle(clientId, clientSecret);

    await saveAuthData(registeredAuthData);
    return new GTaskAuthorization(saveAuthData, loadAuthData, registeredAuthData);
  }

  private static async loginGoogle(clientId: string, clientSecret: string): Promise<GTaskAuthData> {
    if (Platform.isDesktop) {
      const http = require('http');
      const url = require('url');

      const oAuth2Client = new OAuth2Client(clientId, clientSecret, GTaskAuthorization.REDIRECT_URI);

      const authorizeUrl = oAuth2Client.generateAuthUrl({
        scope: GTaskAuthorization.SCOPES,
        access_type: 'offline',
        prompt: 'consent',
      });

      return new Promise<GTaskAuthData>((resolve, reject) => {
        const server = http
          .createServer(async (req: any, res: any) => {
            try {
              if (req.url.indexOf('/callback') > -1) {
                const qs = new url.URL(req.url, GTaskAuthorization.SERVER_URI).searchParams;
                const code = qs.get('code');
                res.end('Authentication successful! Please return to obsidian.');

                try {
                  const tokens = (await oAuth2Client.getToken(code)).tokens;
                  server.close();
                  if (!tokens.access_token || !tokens.refresh_token) {
                    reject(
                      new Error(
                        'Missing required token fields: ' +
                          JSON.stringify({
                            access_token: tokens.access_token,
                            refresh_token: tokens.refresh_token,
                            expiry_date: tokens.expiry_date,
                          }),
                      ),
                    );
                    return;
                  }
                  resolve(
                    new GTaskAuthData(
                      tokens.access_token,
                      tokens.refresh_token,
                      clientId,
                      clientSecret,
                      tokens.expiry_date ? (tokens.expiry_date - Date.now()) / 1000 : 3600,
                    ),
                  );
                } catch (err) {
                  reject(err);
                }
              }
            } catch (e) {
              reject(e);
            }
          })
          .listen(GTaskAuthorization.SERVER_PORT, () => {
            window.open(authorizeUrl, '_blank');
          });
      });
    } else {
      new Notice("Can't use OAuth on this device");
      throw new Error('OAuth not supported on this device');
    }
  }
}
