import { Editor, MarkdownView, Notice } from 'obsidian';
import { Remote } from 'src/models/remote/Remote';
import GTaskSyncPlugin from '../main';

export function registerTurnIntoGoogleTaskCommand(plugin: GTaskSyncPlugin, remote: Remote): void {
  plugin.addCommand({
    id: 'turn-into-google-task',
    name: 'Turn into Google Task',
    editorCallback: async (editor: Editor, view: MarkdownView) => {
      const selectedText = editor.getSelection().trim();

      if (!selectedText) {
        new Notice('Please drag and select the text first');
        return;
      }

      try {
        const task = await remote.create(selectedText, '@default');
        editor.replaceSelection(task.toMarkdown());
      } catch (err) {
        console.error('Task 생성 실패:', err);
        new Notice('Google Task 생성 중 오류가 발생했습니다.');
      }
    },
  });
}
