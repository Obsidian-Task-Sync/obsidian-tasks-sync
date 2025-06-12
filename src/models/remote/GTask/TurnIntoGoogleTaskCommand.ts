import { Editor, Notice } from 'obsidian';
import TaskSyncPlugin from '../../../main';
import { GTaskRemote } from './GTaskRemote';
import { getTaskInitialMeta, getTaskLineMeta } from 'src/libs/regexp';

export function registerTurnIntoGoogleTaskCommand(plugin: TaskSyncPlugin, remote: GTaskRemote): void {
  plugin.addCommand({
    id: 'turn-into-google-task',
    name: 'Turn into Google Task',
    editorCallback: async (editor: Editor) => {
      const selectedText = editor.getSelection().trim();

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
          tasklistId: '@default',
          ...(meta.dueDate ? { due: meta.dueDate } : {}),
        });
        editor.replaceSelection(task.toMarkdown());
        new Notice('Google Task로 생성되었습니다.');
      } catch (err) {
        console.error('Task 생성 실패:', err);
        new Notice('Google Task 생성 중 오류가 발생했습니다.');
      }
    },
  });
}
