import { Editor, Notice } from 'obsidian';
import { Remote } from 'src/models/remote/Remote';
import GTaskSyncPlugin from '../main';

export function registerTurnIntoGoogleTaskCommand(plugin: GTaskSyncPlugin, remote: Remote): void {
  plugin.addCommand({
    id: 'turn-into-google-task',
    name: '구글 태스크로 생성하기',
    editorCallback: async (editor: Editor) => {
      const selectedText = editor.getSelection().trim();

      if (!selectedText) {
        new Notice('텍스트를 드래그하여 선택해주세요.');
        return;
      }

      try {
        const task = await remote.create(selectedText, { tasklistId: '@default' });
        editor.replaceSelection(task.toMarkdown());
        new Notice('Google Task로 생성되었습니다.');
      } catch (err) {
        console.error('Task 생성 실패:', err);
        new Notice('Google Task 생성 중 오류가 발생했습니다.');
      }
    },
  });
}
