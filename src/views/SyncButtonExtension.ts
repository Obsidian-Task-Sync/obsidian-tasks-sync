// src/views/SyncButtonExtension.ts

import { WidgetType, Decoration, EditorView } from '@codemirror/view';
import { StateField, RangeSetBuilder } from '@codemirror/state';
import { Notice, MarkdownView } from 'obsidian';
import { getPluginInstance, getRemote } from 'src/main';

class SyncButtonWidget extends WidgetType {
  constructor(private id: string) {
    super();
  }

  toDOM(): HTMLElement {
    const button = document.createElement('button');
    button.textContent = 'SYNC';
    button.className = 'cm-sync-button';

    button.onclick = async () => {
      if (!getPluginInstance()) {
        new Notice('❌ pluginInstance가 아직 로드되지 않았습니다');
        return;
      }
      const view = getPluginInstance().app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) {
        new Notice('❌ Markdown 뷰를 찾을 수 없습니다');
        return;
      }
      const editor = view.editor;
      const lines = editor.getValue().split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`gtask:${this.id}`)) {
          try {
            const task = await getRemote().get(this.id);

            const status = task.status === 'completed' ? 'x' : ' ';
            const newLine = `- [${status}] [${task.title}](gtask:${task.id})`;

            editor.setLine(i, newLine);
            new Notice(`✅ '${task.title}'로 동기화됨`);
          } catch (e) {
            new Notice(`❌ 오류: ${e.message}`);
          }
          return;
        }
      }

      new Notice('❌ 해당 줄을 찾을 수 없습니다.');
    };

    return button;
  }
}

export const SyncButtonExtension = StateField.define({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    const builder = new RangeSetBuilder<Decoration>();
    const lines = tr.state.doc.toString().split('\n');

    let pos = 0;
    for (const line of lines) {
      const match = line.match(/\[.*\]\(gtask:(\w+)\)/);
      if (match) {
        const id = match[1];
        builder.add(
          pos + line.length,
          pos + line.length,
          Decoration.widget({
            widget: new SyncButtonWidget(id),
            side: 1,
          }),
        );
      }
      pos += line.length + 1;
    }

    return builder.finish();
  },
  provide: (f) => EditorView.decorations.from(f),
});
