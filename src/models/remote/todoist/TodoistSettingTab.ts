import { Setting } from 'obsidian';
import TaskSyncPlugin from 'src/main';
import { RemoteSettingPanel } from '../Remote';
import { TodoistRemote } from './TodoistRemote';

export interface TodoistSettingsData {
  todoistApiToken: string | null;
}

export class TodoistSettingTab extends RemoteSettingPanel<TodoistSettingsData> {
  constructor(plugin: TaskSyncPlugin, settings: TodoistSettingsData, remote: TodoistRemote) {
    super(plugin, settings, remote);
  }

  display(): void {
    const container = this.getContainer();
    container.empty();

    new Setting(container)
      .setName('Todoist API Token')
      .setDesc('Please enter your Todoist API Token.')
      .addText((text) =>
        text.setValue(this.data.todoistApiToken ?? '').onChange((value) => {
          this.update({ todoistApiToken: value.trim() });
          this.rerender();
        }),
      );
  }
}
