import * as exp from 'constants';

class GTaskAuthData {
  accessToken: string;
  refreshToken: string;
  credentials: string;
}

export class GTaskAuthorize {
  private saveAuthData: (data: GTaskAuthData) => Promise<void>;
  private loadAuthData: () => Promise<GTaskAuthData>;

  constructor(saveAuthData: (data: GTaskAuthData) => Promise<void>, loadAuthData: () => Promise<GTaskAuthData>) {
    this.saveAuthData = saveAuthData;
    this.loadAuthData = loadAuthData;
  }
}
