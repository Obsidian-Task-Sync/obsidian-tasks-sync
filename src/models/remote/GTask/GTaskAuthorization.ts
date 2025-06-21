import { OAuth2Client } from 'google-auth-library';
import { createServer, Server } from 'http';
import { App, Notice, Platform } from 'obsidian';
import { PersistStorage } from 'src/models/PersistStorage';
import { URL } from 'url';
import { z } from 'zod';

const credentials = z.object({
  access_token: z.string().nullable().optional(),
  refresh_token: z.string().nullable().optional(),
  scope: z.string().optional(),
  token_type: z.string().nullable().optional(),
  expiry_date: z.number().nullable().optional(),
});

export class GTaskAuthorization {
  private static readonly SERVER_PORT = 42813;
  private static readonly SERVER_URI = 'http://127.0.0.1:' + GTaskAuthorization.SERVER_PORT;
  private static readonly REDIRECT_URI = GTaskAuthorization.SERVER_URI + '/callback';
  private static readonly SCOPES = 'https://www.googleapis.com/auth/tasks';

  private authClient: OAuth2Client;
  private server?: Server;

  private persistedCredentials = new PersistStorage<z.infer<typeof credentials>>(this.app, 'gtask-tokens', (value) =>
    credentials.parse(value),
  );

  constructor(
    private app: App,
    clientId: string,
    clientSecret: string,
  ) {
    this.authClient = new OAuth2Client(clientId, clientSecret, GTaskAuthorization.REDIRECT_URI);
  }

  async init() {
    const savedTokens = await this.persistedCredentials.get();

    if (savedTokens != null) {
      this.authClient.setCredentials(savedTokens);
      // refresh token if it expired
      await this.authClient.getAccessToken();
      // refrhesh 된 credentials들을 다시 저장
      await this.persistedCredentials.set(this.authClient.credentials);
    }
  }

  dispose() {
    this.server?.close();
  }

  getAuthClient() {
    return this.authClient;
  }

  async authorize() {
    try {
      const accessToken = (await this.authClient.getAccessToken()).token;

      if (accessToken == null) {
        throw new Error('Access token is null');
      }

      const tokenInfo = await this.authClient.getTokenInfo(accessToken);
      const expiryDate = tokenInfo.expiry_date;
      const now = Date.now();

      if (expiryDate < now) {
        return await this.authClient.refreshAccessToken();
      }

      return accessToken;
    } catch {
      return await this.loginGoogle();
    }
  }

  async unauthorize() {
    const accessToken = (await this.authClient.getAccessToken()).token;
    if (accessToken == null) {
      return;
    }

    await this.authClient.revokeToken(accessToken);
    this.authClient.setCredentials({});
    this.persistedCredentials.set({});
    this.server?.close();
  }

  async checkIsAuthorized() {
    try {
      const accessToken = (await this.authClient.getAccessToken()).token;
      return accessToken != null;
    } catch {
      return false;
    }
  }

  private async loginGoogle() {
    if (Platform.isDesktop) {
      const authorizeUrl = this.authClient.generateAuthUrl({
        scope: GTaskAuthorization.SCOPES,
        access_type: 'offline',
        prompt: 'consent',
      });

      // Close the server after 1 minute
      const timeout = setTimeout(() => this.server?.close(), 60_000);

      return new Promise<void>((resolve, reject) => {
        const server = createServer(async (req: any, res: any) => {
          if (req.url.indexOf('/callback') > -1) {
            const qs = new URL(req.url, GTaskAuthorization.SERVER_URI).searchParams;
            const code = qs.get('code');
            res.end('Authentication successful! Please return to obsidian.');

            if (code == null) {
              clearTimeout(timeout);
              reject(new Error('Missing required token fields: ' + JSON.stringify(code)));
              return;
            }

            const tokens = (await this.authClient.getToken(code)).tokens;
            this.authClient.setCredentials(tokens);
            this.persistedCredentials.set(tokens);

            clearTimeout(timeout);
            server.close();
            resolve();
          }
        }).listen(GTaskAuthorization.SERVER_PORT, () => {
          window.open(authorizeUrl, '_blank');
        });

        this.server = server;
      });
    } else {
      new Notice("Can't use OAuth on this device");
      throw new Error('OAuth not supported on this device');
    }
  }
}
