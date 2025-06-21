import { Editor, Notice } from 'obsidian';
import { getTaskInitialMeta } from 'src/libs/regexp';
import TaskSyncPlugin from '../../../main';
import { GTaskRemote } from './GTaskRemote';

export function registerTurnIntoGoogleTaskCommand(plugin: TaskSyncPlugin, remote: GTaskRemote): void {
  plugin.addCommand({
    id: 'turn-into-google-task',
    name: 'Turn into Google Task',
    editorCallback: async (editor: Editor) => {
      const selectedText = editor.getSelection().trim();
      // 현재 선택 범위의 시작과 끝 위치를 저장
      const from = editor.getCursor('from');
      const to = editor.getCursor('to');

      if (!selectedText) {
        new Notice('Please select text by dragging');
        return;
      }

      try {
        const meta = getTaskInitialMeta(selectedText);
        if (meta == null) {
          throw new Error('Selected text is not a valid Task');
        }

        const task = await remote.create(meta.title, meta.dueDate, {
          tasklistId: '@default',
        });
        editor.replaceRange(task.toMarkdown(), from, to);
        new Notice('Google Task created');
      } catch (err) {
        console.error('Failed to create Google Task:', err);
        new Notice('Failed to create Google Task');
      }
    },
  });
}
