import { Editor, MarkdownView, Notice } from 'obsidian';
import { GTaskRemote } from 'src/models/remote/GTask/GTaskRemote';
import { GTaskCreator } from 'src/models/remote/GTask/GTaskCreator';
import GTaskSyncPlugin from '../main';

export function registerTurnIntoGoogleTaskCommand(plugin: GTaskSyncPlugin): void {
  const remote = new GTaskRemote(plugin);

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
        await remote.init();
        await remote.authorize();

        const creator = new GTaskCreator(remote);
        await creator.createFromText(selectedText);
      } catch (err) {
        console.error('Task 생성 실패:', err);
        new Notice('Google Task 생성 중 오류가 발생했습니다.');
      }
    },
  });
}
