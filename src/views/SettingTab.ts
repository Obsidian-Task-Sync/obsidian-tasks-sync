import { App, PluginSettingTab } from 'obsidian';
import Logo from 'src/assets/logo.png';
import LogoWhite from 'src/assets/logo_white.png';
import TaskSyncPlugin from 'src/main';
import { Remote } from 'src/models/remote/Remote';

export class SettingTab extends PluginSettingTab {
  private remotes: Remote[];
  private darkModeObserver: MutationObserver;

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

    const isDarkMode = document.body.classList.contains('theme-dark');
    const logoSrc = isDarkMode ? LogoWhite : Logo;

    const logoEl = containerEl.createEl('img');
    logoEl.src = logoSrc;
    logoEl.alt = 'Plugin Logo';
    logoEl.style.display = 'block';
    logoEl.style.width = '200px';
    logoEl.style.height = 'auto';
    logoEl.style.margin = '20px auto';

    if (this.darkModeObserver == null) {
      this.darkModeObserver = new MutationObserver(() => {
        const newIsDarkMode = document.body.classList.contains('theme-dark');
        if (newIsDarkMode !== isDarkMode) {
          logoEl.src = newIsDarkMode ? LogoWhite : Logo;
        }
      });

      this.darkModeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    containerEl.createEl('h2', {}, (h2) => {
      h2.appendText('Please refer to the  ');
      h2.createEl('a', {
        text: 'GitHub repository',
        href: 'https://github.com/hong-sile/obsidian-tasks-sync',
      });
      h2.appendText('  for usage and contribution guidelines.');
      h2.style.padding = '20px 0';
    });

    const tabContainer = containerEl.createDiv({ cls: 'setting-tab-container' });
    const tabHeader = tabContainer.createDiv({ cls: 'setting-tab-header' });
    const tabContent = tabContainer.createDiv({ cls: 'setting-tab-content' });

    const showTab = (remote: Remote) => {
      tabContent.empty();
      remote.settingTab.setContainer(tabContent);
      remote.settingTab.display();
    };

    for (const remote of this.remotes) {
      const tabButton = tabHeader.createEl('button', {
        text: remote.name,
        cls: 'tab-button',
      });

      tabButton.onclick = () => {
        showTab(remote);
        tabHeader.querySelectorAll('button').forEach((btn) => btn.removeClass('active'));
        tabButton.addClass('active');
      };
    }

    if (this.remotes.length > 0) {
      showTab(this.remotes[0]);
      tabHeader.querySelector('button')?.addClass('active');
    }
  }
}
