import { SampleModal } from 'src/main';
import type GTaskSyncPlugin from 'src/main';

export function registerCommands(plugin: GTaskSyncPlugin) {
  plugin.addCommand({
    id: 'sync-from-remote',
    name: 'Sync from Remote',
    callback: () => {
      new SampleModal(plugin.app).open();
    },
  });
}
