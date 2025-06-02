// src/extensions/SyncButtonExtension.ts

import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import { StateField, RangeSetBuilder } from '@codemirror/state';
import { Notice } from 'obsidian';

class SyncButtonWidget extends WidgetType {
  constructor(private id: string) {
    super();
  }

  toDOM() {
    const button = document.createElement('button');
    button.textContent = 'SYNC';
    button.className = 'cm-sync-button';
    button.onclick = () => {
      new Notice(`SYNC 클릭됨: ${this.id}`);
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
      pos += line.length + 1; // 줄바꿈 포함
    }

    return builder.finish();
  },
  provide: (f) => EditorView.decorations.from(f),
});
