import { App, PluginSettingTab, Setting } from 'obsidian';
import GTaskSyncPlugin, { GTaskSyncPluginSettings } from 'src/main';
import { Remote } from 'src/models/remote/Remote';

export class SettingTab extends PluginSettingTab {
  private plugin: GTaskSyncPlugin;
  private remote: Remote;

  private isLoading = true;
  private isAuthorized = false;

  constructor(app: App, plugin: GTaskSyncPlugin, remote: Remote) {
    super(app, plugin);
    this.plugin = plugin;
    this.remote = remote;
  }

  async init() {
    this.isAuthorized = await this.remote.checkIsAuthorized();
    this.isLoading = false;

    this.display();
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h4', { text: '옵시디언 태스크 싱크 설정' });
    containerEl.createEl('h2', { text: '현재 Google Tasks와의 연동만 지원합니다.' });

    new Setting(containerEl)
      .setName('Google Client Id')
      .setDesc('Google의 클라이언트 아이디')
      .addText((text) =>
        text.setValue(this.plugin.settings.googleClientId ?? '').onChange((value) => {
          this.update({ googleClientId: value.trim() });
          this.display();
        }),
      );

    new Setting(containerEl)
      .setName('Client Secret')
      .setDesc('Google의 클라이언트 시크릿 키')
      .addText((text) =>
        text.setValue(this.plugin.settings.googleClientSecret ?? '').onChange((value) => {
          this.update({ googleClientSecret: value.trim() });
          this.display();
        }),
      );

    if (!this.isAuthorized) {
      if (this.isLoading) {
        containerEl.createEl('p', { text: '초기화 중...' });
        return;
      }

      if (this.plugin.settings.googleClientId == null || this.plugin.settings.googleClientSecret == null) {
        containerEl.createEl('p', { text: 'Google Client Id와 Google Client Secret를 입력해주세요.' });
        return;
      }

      new Setting(containerEl).setName('Google Tasks 연동').addButton((button) => {
        button.setButtonText('Google Tasks 연동').onClick(async () => {
          this.hide();
          this.display();
          await this.remote.authorize();
        });
      });
    } else {
      new Setting(containerEl).setName('Google Tasks 연동').addButton((button) => {
        button.setButtonText('연동 취소').onClick(async () => {
          await this.remote.unauthorize();
          this.display();
        });
      });
    }
  }

  async update(settings: Partial<GTaskSyncPluginSettings>) {
    this.plugin.updateSettings(settings);
    this.display();
  }
}
