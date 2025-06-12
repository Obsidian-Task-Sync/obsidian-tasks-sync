import { Editor, Notice } from 'obsidian';
import TaskSyncPlugin from '../../../main';
import { TodoistRemote } from './TodoistRemote';
import { getTaskInitialMeta } from 'src/libs/regexp';

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
        new Notice('텍스트를 드래그하여 선택해주세요.');
        return;
      }

      try {
        const meta = getTaskInitialMeta(selectedText);
        if (meta == null) {
          throw new Error('선택한 텍스트가 유효한 Task가 아닙니다.');
        }

        const task = await remote.create(meta.title, {
          ...(meta.dueDate ? { due: meta.dueDate } : {}),
        });
        editor.replaceRange(task.toMarkdown(), from, to);
        new Notice('Todoist Task로 생성되었습니다.');
      } catch (err) {
        console.error('Task 생성 실패:', err);
        new Notice('Todoist Task 생성 중 오류가 발생했습니다.');
      }
    },
  });
}
