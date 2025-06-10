import { Editor, Notice } from 'obsidian';
import TaskSyncPlugin from '../../../main';
import { TodoistRemote } from './TodoistRemote';

export function registerTurnIntoTodoistCommand(plugin: TaskSyncPlugin, remote: TodoistRemote): void {
  plugin.addCommand({
    id: 'turn-into-todoist-task',
    name: 'Turn into Todoist Task',
    editorCallback: async (editor: Editor) => {
      const selectedText = editor.getSelection().trim();

      if (!selectedText) {
        new Notice('텍스트를 드래그하여 선택해주세요.');
        return;
      }

      try {
        const task = await remote.create(selectedText);
        editor.replaceSelection(task.toMarkdown());
        new Notice('Todoist Task로 생성되었습니다.');
      } catch (err) {
        console.error('Task 생성 실패:', err);
        new Notice('Todoist Task 생성 중 오류가 발생했습니다.');
      }
    },
  });
}
