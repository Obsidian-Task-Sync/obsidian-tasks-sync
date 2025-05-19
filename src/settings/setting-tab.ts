import { App, PluginSettingTab, Setting } from 'obsidian'
import GTaskSyncPlugin from 'src/main'

export class SettingTab extends PluginSettingTab {
  plugin: GTaskSyncPlugin

  constructor(app: App, plugin: GTaskSyncPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    containerEl.createEl('h4', { text: 'Settings for Sync-Todo Plugin' })
    containerEl.createEl('h2', { text: 'Restart Obsidian to apply your new settings' })

    new Setting(containerEl)
      .setName('Use your own authentication client')
      .setDesc('If you want to use your own authentication client, please check the documentation.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.ownAuthenticationClient).onChange(async (value) => {
          if (value === true) {
            // 토글이 켜질 때
          }
          this.plugin.settings.ownAuthenticationClient = value
          await this.plugin.saveSettings()
          this.display()
        }),
      )

    if (this.plugin.settings.ownAuthenticationClient) {
      new Setting(containerEl)
        .setName('Client Id')
        .setDesc('Google client id')
        .addText((text) =>
          text
            .setPlaceholder('Enter your client id')
            .setValue(this.plugin.settings.googleClientId)
            .onChange(async (value) => {
              this.plugin.settings.googleClientId = value.trim()
              await this.plugin.saveSettings()
            }),
        )

      new Setting(containerEl)
        .setName('Client Secret')
        .setDesc('Google client secret')
        .addText((text) =>
          text
            .setPlaceholder('Enter your client secret')
            .setValue(this.plugin.settings.googleClientSecret)
            .onChange(async (value) => {
              this.plugin.settings.googleClientSecret = value.trim()
              await this.plugin.saveSettings()
            }),
        )
    }

    new Setting(containerEl).setName('Google Login').addButton((button) => {
      button.setButtonText(this.plugin.settings.isLoggedIn ? 'Logout' : 'Login').onClick(() => {
        this.hide()
        this.display()
      })
    })

    new Setting(containerEl)
      .setName('Google Redirct url')
      .setDesc('The url to the server where the oauth takes place')
      .addText((text) => {
        text.setValue(this.plugin.settings.googleRedirectUrl).onChange(async (value) => {
          this.plugin.settings.googleRedirectUrl = value.trim()
          await this.plugin.saveSettings()
        })
      })

    new Setting(containerEl)
      .setName('Google Calendar Integration')
      .setDesc('Sync your tasks with Google Calendar')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.useGoogleCalendarSync).onChange(async (state) => {
          this.plugin.settings.useGoogleCalendarSync = state
          await this.plugin.saveSettings()

          this.hide()
          this.display()
        })
      })
  }
}
