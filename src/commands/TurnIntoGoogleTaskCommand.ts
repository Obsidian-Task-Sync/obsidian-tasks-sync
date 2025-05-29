import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';

export function registerTurnIntoGoogleTaskCommand(plugin: Plugin) {
  plugin.addCommand({
    id: 'turn-into-google-task',
    name: 'Turn into Google Task',
    editorCallback: (editor: Editor, view: MarkdownView) => {
      const selectedText = editor.getSelection().trim();

      if (!selectedText) {
        new Notice('Please drag and select the text first');
        return;
      }

      console.log('선택된 문구:', selectedText);
      //드래그한 selectedText Control하는 부분
    },
  });
}
