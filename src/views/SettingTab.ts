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

    containerEl.createEl('h4', { text: 'Obsidian Tasks Sync Settings' });
    containerEl.createEl('h2', {}, (h2) => {
      h2.appendText('Please refer to the  ');
      h2.createEl('a', {
        text: 'GitHub repository',
        href: 'https://github.com/hong-sile/obsidian-tasks-sync',
        cls: 'external-link external-link-button',
      });
      h2.appendText('  for usage and contribution guidelines.');
    });

    const tabContainer = containerEl.createDiv({ cls: 'setting-tab-container' });
    const tabHeader = tabContainer.createDiv({ cls: 'setting-tab-header' });
    const tabContent = tabContainer.createDiv({ cls: 'setting-tab-content' });

    // 탭 변경 로직
    const showTab = (remote: Remote) => {
      tabContent.empty();
      remote.settingTab.setContainer(tabContent);
      remote.settingTab.display();
    };

    for (const remote of this.remotes) {
      const tabButton = tabHeader.createEl('button', {
        text: remote.id,
        cls: 'tab-button',
      });

      tabButton.onclick = () => {
        showTab(remote);
        tabHeader.querySelectorAll('button').forEach((btn) => btn.removeClass('active'));
        tabButton.addClass('active');
      };
    }

    // 초기 탭 선택
    if (this.remotes.length > 0) {
      showTab(this.remotes[0]);
      tabHeader.querySelector('button')?.addClass('active');
    }
  }
}
