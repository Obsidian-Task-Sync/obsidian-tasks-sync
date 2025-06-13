import { Setting } from 'obsidian';
import TaskSyncPlugin from 'src/main';
import { RemoteSettingPanel } from '../Remote';
import { GTaskRemote } from './GTaskRemote';

export interface GTaskSettingsData {
  googleClientId: string | null;
  googleClientSecret: string | null;
}

export class GTaskSettingTab extends RemoteSettingPanel<GTaskSettingsData> {
  constructor(plugin: TaskSyncPlugin, settings: GTaskSettingsData, remote: GTaskRemote) {
    super(plugin, settings, remote);
  }

  display(): void {
    const container = this.getContainer();
    container.empty();

    new Setting(container)
      .setName('Google Client Id')
      .setDesc('Google의 클라이언트 아이디')
      .addText((text) =>
        text.setValue(this.data.googleClientId ?? '').onChange((value) => {
          this.update({ googleClientId: value.trim() });
          this.rerender();
        }),
      );

    new Setting(container)
      .setName('Client Secret')
      .setDesc('Google의 클라이언트 시크릿 키')
      .addText((text) =>
        text.setValue(this.data.googleClientSecret ?? '').onChange((value) => {
          this.update({ googleClientSecret: value.trim() });
          this.rerender();
        }),
      );

    if (!this.plugin.getIsAuthorized()) {
      if (this.data.googleClientId == null || this.data.googleClientSecret == null) {
        container.createEl('p', { text: 'Google Client Id와 Google Client Secret를 입력해주세요.' });
        return;
      }

      new Setting(container).setName('Google Tasks 연동').addButton((button) => {
        button.setButtonText('Google Tasks 연동').onClick(async () => {
          this.rerender();
          await this.remote.authorize();

          this.plugin.activateAuthCheckInterval(this.remote);
        });
      });
    } else {
      new Setting(container).setName('Google Tasks 연동').addButton((button) => {
        button.setButtonText('연동 취소').onClick(async () => {
          await this.remote.unauthorize();
          this.plugin.setIsAuthorized(false);
          this.rerender();
        });
      });
    }
  }
}
