import * as exp from 'constants';

class GTaskAuthData {
  accessToken: string;
  refreshToken: string;
  credentials: string;

  constructor(accessToken: string, refreshToken: string, credentials: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.credentials = credentials;
  }
}

export class GTaskAuthorization {
  private authData: GTaskAuthData;
  private saveAuthData: (data: GTaskAuthData) => Promise<void>;
  private loadAuthData: () => Promise<GTaskAuthData | undefined>;

  private constructor(
    saveAuthData: (data: GTaskAuthData) => Promise<void>,
    loadAuthData: () => Promise<GTaskAuthData | undefined>,
    authData: GTaskAuthData,
  ) {
    this.saveAuthData = saveAuthData;
    this.loadAuthData = loadAuthData;
    this.authData = authData;
  }

  static async getAuthorization(
    saveAuthData: (data: GTaskAuthData) => Promise<void>,
    loadAuthData: () => Promise<GTaskAuthData | undefined>,
  ): Promise<GTaskAuthorization> {
    const authData = await GTaskAuthorization.authorize(saveAuthData, loadAuthData);
    return new GTaskAuthorization(saveAuthData, loadAuthData, authData);
  }

  static async authorize(
    saveAuthData: (data: GTaskAuthData) => Promise<void>,
    loadAuthData: () => Promise<GTaskAuthData | undefined>,
  ): Promise<GTaskAuthData> {
    const authData = await loadAuthData();
    return new GTaskAuthData('', '', '');
  }

  async authIsValid(authData: GTaskAuthData | undefined): Promise<boolean> {
    if (authData == null) {
      return false;
    }
    // Check 유효시간
    return true;
  }
}
