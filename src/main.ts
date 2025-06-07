import { Extension } from '@codemirror/state';
import { merge } from 'es-toolkit';
import { App, Plugin, PluginManifest } from 'obsidian';
import { registerTurnIntoGoogleTaskCommand } from './commands/TurnIntoGoogleTaskCommand';
import { TaskController } from './controllers/TaskController';
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
  private taskController: TaskController;
  private statusBar: HTMLElement;

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
    this.taskController = new TaskController(this.app, this.fileRepo);

    await this.fileRepo.initialize();

    // 옵시디언에서 특정한 텍스트 타입 인식하게 하기 , SYNC 버튼 추가
    this.extensions.push(createSyncFromRemoteExtension(this, this.fileRepo, this.remote));

    registerTurnIntoGoogleTaskCommand(this, this.remote);

    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    this.statusBar = this.addStatusBarItem();
    this.statusBar.setText('초기화 중...');

    /**
     * [중요] Remote 초기화가 된 이후에 SettingTab이 초기화되어야 합니다.
     */
    this.taskController.init();
    await this.remote.init();

    const settingTab = new SettingTab(this.app, this, this.remote);
    await settingTab.init();
    this.addSettingTab(settingTab);

    if (await this.remote.checkIsAuthorized()) {
      this.statusBar.setText('Google Tasks와 연동됨');
    } else {
      this.statusBar.setText('Google Tasks와 연동되지 않음');
    }

    this.extensions.forEach((extension) => this.registerEditorExtension(extension));
  }

  onunload() {
    this.taskController.dispose();
    this.remote.dispose();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async updateSettings(settings: Partial<GTaskSyncPluginSettings>) {
    this.settings = merge(this.settings, settings);
    await this.saveData(this.settings);
  }
}
