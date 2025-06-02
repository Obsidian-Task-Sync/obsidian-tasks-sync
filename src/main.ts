import { merge } from 'es-toolkit';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginManifest } from 'obsidian';
import { TaskController } from './controllers/TaskController';
import { GTaskMockRemote } from './models/remote/GTask/GTaskMockRemote';
import { TaskRepository } from './repositories/TaskRepository';
import { SettingTab } from './views/SettingTab';
import { SyncFromRemote } from './views/SyncFromRemoteButton';
import { registerTurnIntoGoogleTaskCommand } from './commands/TurnIntoGoogleTaskCommand';

export let pluginInstance: GTaskSyncPlugin;
//테스트용 MockRemote() 연결, 실제로는 GTaskRemote를 사용해야 합니다.
export let remote: GTaskMockRemote;

export interface GTaskSyncPluginSettings {
  mySetting: string;
  ownAuthenticationClient: boolean;
  googleClientId: string;
  googleClientSecret: string;
  isLoggedIn: boolean;
  useGoogleCalendarSync: boolean;
  googleRedirectUrl: string;
}

const DEFAULT_SETTINGS: GTaskSyncPluginSettings = {
  mySetting: 'default',
  ownAuthenticationClient: true,
  googleClientId: '',
  googleClientSecret: '',
  isLoggedIn: false,
  useGoogleCalendarSync: true,
  googleRedirectUrl: 'https://redirect.url',
};

export default class GTaskSyncPlugin extends Plugin {
  settings: GTaskSyncPluginSettings;

  taskRepo: TaskRepository;
  taskController: TaskController;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);

    this.taskRepo = new TaskRepository(app, remote);
    this.taskController = new TaskController(app, this.taskRepo);
  }

  async onload() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    pluginInstance = this;
    remote = new GTaskMockRemote();
    await this.loadSettings();

    // 옵시디언에서 특정한 텍스트 타입 인식하게 하기 , SYNC 버튼 추가
    this.registerEditorExtension(SyncFromRemote);

    const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
      // Called when the user clicks the icon.
      new Notice('This is a notice!');
    });
    // Perform additional things with the ribbon
    ribbonIconEl.addClass('my-plugin-ribbon-class');

    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    const statusBarItemEl = this.addStatusBarItem();
    statusBarItemEl.setText('Status Bar Text');

    // This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: 'open-sample-modal-simple',
      name: 'Open sample modal (simple)',
      callback: () => {
        new SampleModal(this.app).open();
      },
    });
    // This adds an editor command that can perform some operation on the current editor instance
    this.addCommand({
      id: 'sample-editor-command',
      name: 'Sample editor command',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        console.log(editor.getSelection());
        editor.replaceSelection('Sample Editor Command');
      },
    });
    // This adds a complex command that can check whether the current state of the app allows execution of the command
    this.addCommand({
      id: 'open-sample-modal-complex',
      name: 'Open sample modal (complex)',
      checkCallback: (checking: boolean) => {
        // Conditions to check
        const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (markdownView) {
          // If checking is true, we're simply "checking" if the command can be run.
          // If checking is false, then we want to actually perform the operation.
          if (!checking) {
            new SampleModal(this.app).open();
          }

          // This command will only show up in Command Palette when the check function returns true
          return true;
        }
      },
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SettingTab(this.app, this));

    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
      console.log('click', evt);
    });

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

    registerTurnIntoGoogleTaskCommand(this);

    this.taskController.init();
  }

  onunload() {
    this.taskController.dispose();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async updateSettings(settings: Partial<GTaskSyncPluginSettings>) {
    this.settings = merge(this.settings, settings);
    await this.saveData(this.settings);
  }

  getTask(id: string) {
    return remote.get(id);
  }
}

class SampleModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.setText('Woah!');
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export function getPluginInstance() {
  return pluginInstance;
}

export function getRemote() {
  return remote;
}
