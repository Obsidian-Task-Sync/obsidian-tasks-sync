import { App, PluginSettingTab } from 'obsidian';
import TaskSyncPlugin from 'src/main';
import { Remote } from 'src/models/remote/Remote';

export class SettingTab extends PluginSettingTab {
  private remotes: Remote[];

  constructor(app: App, plugin: TaskSyncPlugin, remotes: Remote[]) {
    super(app, plugin);
    this.remotes = remotes;

    for (const remote of this.remotes) {
      remote.settingTab.init(this);
    }
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h4', { text: '옵시디언 태스크 싱크 설정' });

    for (const remote of this.remotes) {
      const settingTab = remote.settingTab;
      containerEl.createEl('h5', { text: remote.id });
      settingTab.display();
    }
  }
}
