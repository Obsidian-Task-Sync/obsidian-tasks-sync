import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GTaskAuthorization } from '../../../../src/models/remote/GTask/GTaskAuthorization';
import { Platform } from 'obsidian';
import * as http from 'http';

// src/models/remote/GTask/GTaskAuthorization.test.ts

// Mocks
vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    setCredentials: vi.fn(),
    getAccessToken: vi.fn(),
    getTokenInfo: vi.fn(),
    refreshAccessToken: vi.fn(),
    generateAuthUrl: vi.fn(),
    getToken: vi.fn(),
  })),
}));

vi.mock('http', () => ({
  createServer: vi.fn(),
}));

vi.mock('src/models/PersistStorage', () => ({
  PersistStorage: vi.fn().mockImplementation(() => ({
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(),
  })),
}));

describe('GTaskAuthorization', () => {
  let app: any;
  let auth: GTaskAuthorization;
  let oAuthInstance: any;

  beforeEach(() => {
    app = {};
    auth = new GTaskAuthorization(app, 'clientId', 'clientSecret');
    oAuthInstance = auth.getAuthClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
    (global as any).window = undefined;
  });

  it('getAuthClient returns the OAuth2Client instance', () => {
    expect(auth.getAuthClient()).toBe(oAuthInstance);
  });

  it('dispose closes the server if exists', () => {
    const close = vi.fn();
    (auth as any).server = { close };
    auth.dispose();
    expect(close).toHaveBeenCalled();
  });

  it('authorize returns access token if valid and not expired', async () => {
    oAuthInstance.getAccessToken.mockResolvedValue({ token: 'token123' });
    oAuthInstance.getTokenInfo.mockResolvedValue({ expiry_date: Date.now() + 10000 });
    const result = await auth.authorize();
    expect(result).toBe('token123');
  });

  it('authorize refreshes token if expired', async () => {
    oAuthInstance.getAccessToken.mockResolvedValue({ token: 'token123' });
    oAuthInstance.getTokenInfo.mockResolvedValue({ expiry_date: Date.now() - 10000 });
    oAuthInstance.refreshAccessToken.mockResolvedValue('refreshed');
    const result = await auth.authorize();
    expect(oAuthInstance.refreshAccessToken).toHaveBeenCalled();
    expect(result).toBe('refreshed');
  });

  it('authorize calls loginGoogle if error thrown', async () => {
    oAuthInstance.getAccessToken.mockRejectedValue(new Error('fail'));
    const spy = vi.spyOn(auth as any, 'loginGoogle').mockResolvedValue('login');
    const result = await auth.authorize();
    expect(spy).toHaveBeenCalled();
    expect(result).toBe('login');
  });

  it('loginGoogle opens browser and resolves on callback with code', async () => {
    oAuthInstance.generateAuthUrl.mockReturnValue('http://auth.url');
    oAuthInstance.getToken.mockResolvedValue({ tokens: { access_token: 'abc' } });

    (global as any).window = { open: vi.fn() };

    let serverCallback: any;
    http.createServer.mockImplementation((cb: any) => {
      serverCallback = cb;
      return {
        listen: function (port: number, cb2: () => void) {
          cb2 && cb2();
          return this;
        },
        close: vi.fn(),
      };
    });

    const loginPromise = (auth as any).loginGoogle();

    // Simulate HTTP callback with code
    const req = { url: '/callback?code=thecode' };
    const res = { end: vi.fn() };
    await serverCallback(req, res);

    await expect(loginPromise).resolves.toBeUndefined();
    expect(oAuthInstance.getToken).toHaveBeenCalledWith('thecode');
    expect(oAuthInstance.setCredentials).toHaveBeenCalledWith({ access_token: 'abc' });
  });

  it('loginGoogle rejects if code is missing', async () => {
    (global as any).window = { open: vi.fn() };
    let serverCallback: any;
    http.createServer.mockImplementation((cb: any) => {
      serverCallback = cb;
      return {
        listen: function (port: number, cb2: () => void) {
          cb2 && cb2();
          return this;
        },
        close: vi.fn(),
      };
    });

    const loginPromise = (auth as any).loginGoogle();

    // Simulate HTTP callback without code
    const req = { url: '/callback' };
    const res = { end: vi.fn() };
    await serverCallback(req, res);

    await expect(loginPromise).rejects.toThrow();
  });

  it('loginGoogle throws if not desktop', async () => {
    Platform.isDesktop = false;
    await expect((auth as any).loginGoogle()).rejects.toThrow('OAuth not supported on this device');
    Platform.isDesktop = true; // restore
  });
});
