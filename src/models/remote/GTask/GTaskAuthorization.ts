import * as http from 'http';
import * as url from 'url';
import { google } from 'googleapis';
import open from 'open'; // npm install open 필요

class GTaskAuthData {
  accessToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;

  constructor(accessToken: string, refreshToken: string, clientId: string, clientSecret: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  accessTokenIsValid(): boolean {
    //TODO : accessToken 유효기간 체크
    return true;
  }

  async refresh(): Promise<void> {
    //TODO : refresh token으로 access token 갱신
  }
}

export class GTaskAuthorization {
  private static REDIRECT_URI = 'http://localhost:9325/callback';

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
    const authData = await GTaskAuthorization.authorize(loadAuthData, clientId, clientSecret);
    await saveAuthData(authData);
    return new GTaskAuthorization(saveAuthData, loadAuthData, authData);
  }

  static async authorize(
    loadAuthData: () => Promise<GTaskAuthData>,
    clientId: string,
    clientSecret: string,
  ): Promise<GTaskAuthData> {
    const authData = await loadAuthData();

    if (authData != null) {
      if (authData.accessTokenIsValid()) {
        return authData;
      } else {
        //TODO: refresh Token이 유효하지 않은 경우 새로 발급받도록 하기
        await authData.refresh();
      }
      return authData;
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, GTaskAuthorization.REDIRECT_URI);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/tasks'],
      prompt: 'consent',
    });

    const code = await GTaskAuthorization.getCode(authUrl); // 사용자가 인증코드를 입력하는 함수 필요
    const { tokens } = await oauth2Client.getToken(code);

    return new GTaskAuthData(tokens.access_token ?? '', tokens.refresh_token ?? '', clientId, clientSecret);
  }

  static async getCode(authUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        try {
          const reqUrl = url.parse(req.url ?? '', true);

          if (reqUrl.pathname === '/callback') {
            if (reqUrl.query.code) {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`
                <html>
                  <body>
                    <h2>authorize complete</h2>
                    <script>setTimeout(() => window.close(), 2000);</script>
                  </body>
                </html>
              `);
              server.close();
              resolve(reqUrl.query.code as string);
            } else if (reqUrl.query.error) {
              res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(`
                <html>
                  <body>
                    <h2>authorize failed</h2>
                  </body>
                </html>
              `);
              server.close();
              reject(new Error(`인증 오류: ${reqUrl.query.error}`));
            }
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <html>
                <body>
                  <h2>wrong redirect uri</h2>
                </body>
              </html>
            `);
          }
        } catch (error) {
          console.error('server error:', error);
          server.close();
          reject(error);
        }
      });

      server.on('error', (error) => {
        console.error('server start error:', error);
        reject(error);
      });

      server.listen(9325, 'localhost', () => {
        open(authUrl).catch((err) => {
          console.error('brower open fail:', err);
        });
      });

      setTimeout(
        () => {
          server.close();
          reject(new Error('timeout (5min) please try again'));
        },
        5 * 60 * 1000,
      );
    });
  }
}
