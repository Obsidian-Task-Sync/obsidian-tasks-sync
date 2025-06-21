import { Editor, Notice } from 'obsidian';
import { getTaskInitialMeta } from 'src/libs/regexp';
import TaskSyncPlugin from '../../../main';
import { TodoistRemote } from './TodoistRemote';

export function registerTurnIntoTodoistCommand(plugin: TaskSyncPlugin, remote: TodoistRemote): void {
  plugin.addCommand({
    id: 'turn-into-todoist-task',
    name: 'Turn into Todoist Task',
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

        const task = await remote.create(meta.title, meta.dueDate);
        editor.replaceRange(task.toMarkdown(), from, to);
        new Notice('Todoist Task created');
      } catch (err) {
        console.error('Failed to create Todoist Task:', err);
        new Notice('Failed to create Todoist Task');
      }
    },
  });
}
