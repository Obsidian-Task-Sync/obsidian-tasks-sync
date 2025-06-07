import { Extension } from '@codemirror/state';
import { merge } from 'es-toolkit';
import { App, Notice, Plugin, PluginManifest } from 'obsidian';
import { registerTurnIntoGoogleTaskCommand } from './commands/TurnIntoGoogleTaskCommand';
import { GTaskRemote } from './models/remote/gtask/GTaskRemote';
import { FileRepository } from './repositories/FileRepository';
import { SettingTab } from './views/SettingTab';
import { createSyncFromRemoteExtension } from './views/SyncFromRemoteButton';

export interface GTaskSyncPluginSettings {
  mySetting: string;
  googleClientId?: string;
  googleClientSecret?: string;
}

const DEFAULT_SETTINGS: GTaskSyncPluginSettings = {
  mySetting: 'default',
  googleClientId: '',
  googleClientSecret: '',
};

export default class GTaskSyncPlugin extends Plugin {
  private remote: GTaskRemote;
  private fileRepo: FileRepository;
  private statusBar: HTMLElement;
  private authCheckInterval: number | null = null;
  private isAuthorized = false;
  private settingTab: SettingTab | null = null;

  settings: GTaskSyncPluginSettings;
  extensions: Extension[] = [];

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);

    (window as any).test = this;
  }

  async onload() {
    //initialize
    await this.loadSettings();
    this.remote = new GTaskRemote(this.app, this.settings);
    this.fileRepo = new FileRepository(this.app, this.remote);

    registerTurnIntoGoogleTaskCommand(this, this.remote);

    // 옵시디언에서 특정한 텍스트 타입 인식하게 하기 , SYNC 버튼 추가
    this.extensions.push(createSyncFromRemoteExtension(this, this.fileRepo, this.remote));

    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    this.statusBar = this.addStatusBarItem();
    this.statusBar.setText('초기화 중...');

    // [중요] Remote 초기화가 된 이후에 SettingTab이 초기화되어야 합니다.
    await this.remote.init();
    await this.fileRepo.init();

    this.setIsAuthorized(await this.remote.checkIsAuthorized());

    this.settingTab = new SettingTab(this.app, this, this.remote);
    await this.settingTab.init();
    this.addSettingTab(this.settingTab);

    this.extensions.forEach((extension) => this.registerEditorExtension(extension));
  }

  activateAuthCheckInterval() {
    // 1.5초마다 연동 상태 확인
    this.authCheckInterval = window.setInterval(async () => {
      this.setIsAuthorized(await this.remote.checkIsAuthorized());

      if (this.isAuthorized) {
        new Notice('Google Tasks와 연동됨');

        this.fileRepo.init();
        this.disposeAuthCheckInterval();

        // 연동 상태 확인 중단 후에 설정 탭 표시
        if (this.settingTab != null) {
          this.settingTab.display();
        }
      }
    }, 1500);

    // 30초 후에 연동 상태 확인 중단
    window.setTimeout(this.disposeAuthCheckInterval.bind(this), 30_000);
  }

  disposeAuthCheckInterval() {
    if (this.authCheckInterval != null) {
      window.clearInterval(this.authCheckInterval);
      this.authCheckInterval = null;
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async updateSettings(settings: Partial<GTaskSyncPluginSettings>) {
    this.settings = merge(this.settings, settings);
    await this.saveData(this.settings);
  }

  getIsAuthorized() {
    return this.isAuthorized;
  }

  setIsAuthorized(isAuthorized: boolean) {
    this.isAuthorized = isAuthorized;
    this.onIsAuthorizedChanged(isAuthorized);
  }

  onIsAuthorizedChanged(isAuthorized: boolean) {
    if (isAuthorized) {
      this.statusBar.setText('Google Tasks와 연동됨');
    } else {
      this.statusBar.setText('Google Tasks와 연동되지 않음');
    }
  }

  onunload() {
    this.remote.dispose();
    this.fileRepo.dispose();
    this.disposeAuthCheckInterval();
  }
}
