import { Extension, RangeSetBuilder, StateField } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import { assert } from 'es-toolkit';
import { MarkdownView, Notice, Workspace } from 'obsidian';
import { getGTaskLineMeta, GTaskLineMeta } from 'src/libs/regexp';
import GTaskSyncPlugin from 'src/main';
import { Remote } from 'src/models/remote/Remote';
import { FileRepository } from 'src/repositories/FileRepository';

// 위젯 캐시를 위한 클래스
class WidgetCache {
  private cache = new Map<string, SyncFromRemoteWidget>();

  get(key: string): SyncFromRemoteWidget | undefined {
    return this.cache.get(key);
  }

  set(key: string, widget: SyncFromRemoteWidget) {
    this.cache.set(key, widget);
  }

  clear() {
    this.cache.clear();
  }
}

class SyncFromRemoteWidget extends WidgetType {
  private static widgetCache = new WidgetCache();
  private static widgetIdCounter = 0;
  public readonly widgetId: string;
  private button: HTMLButtonElement | null = null;

  constructor(
    private meta: GTaskLineMeta,
    private index: number,
    private workspace: Workspace,
    private fileRepo: FileRepository,
    private remote: Remote,
  ) {
    super();
    this.widgetId = `sync-widget-${SyncFromRemoteWidget.widgetIdCounter++}`;
  }

  static create(
    meta: GTaskLineMeta,
    index: number,
    workspace: Workspace,
    fileRepo: FileRepository,
    remote: Remote,
  ): SyncFromRemoteWidget {
    const cacheKey = `${meta.id}-${meta.tasklistId}-${index}`;
    const cached = this.widgetCache.get(cacheKey);

    if (cached && cached.meta.id === meta.id && cached.meta.tasklistId === meta.tasklistId && cached.index === index) {
      return cached;
    }

    const widget = new SyncFromRemoteWidget(meta, index, workspace, fileRepo, remote);
    this.widgetCache.set(cacheKey, widget);
    return widget;
  }

  toDOM(): HTMLElement {
    if (this.button) {
      return this.button;
    }

    this.button = document.createElement('button');
    this.button.textContent = 'Sync from Remote';
    this.button.className = 'cm-sync-button';
    this.button.dataset.widgetId = this.widgetId;
    this.button.dataset.taskId = this.meta.id;
    this.button.dataset.tasklistId = this.meta.tasklistId;
    this.button.dataset.lineIndex = this.index.toString();

    this.button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Button clicked directly!', this.meta.id);

      const markdownView = this.workspace.getActiveViewOfType(MarkdownView);
      assert(markdownView != null, 'Markdown 뷰를 찾을 수 없습니다');
      assert(markdownView.file != null, 'Markdown 파일을 찾을 수 없습니다');

      try {
        const file = this.fileRepo.get(markdownView.file.path);
        assert(file != null, '파일을 찾을 수 없습니다');

        const task = file.getTask(this.meta.id, this.meta.tasklistId);
        assert(task != null, '태스크를 찾을 수 없습니다');

        this.remote.get(this.meta.id, this.meta.tasklistId).then((remoteTask) => {
          task.setTitle(remoteTask.title);
          task.setStatus(remoteTask.status);
          markdownView.editor.setLine(this.index, task.toMarkdown());
          new Notice(`동기화됨`);
        });
      } catch (e) {
        new Notice(`오류: ${e.message}`);
      }
    });

    return this.button;
  }

  eq(other: SyncFromRemoteWidget): boolean {
    if (!other) return false;
    return (
      this.widgetId === other.widgetId &&
      this.meta.id === other.meta.id &&
      this.meta.tasklistId === other.meta.tasklistId &&
      this.index === other.index &&
      this.button === other.button // DOM 요소도 비교
    );
  }

  updateDOM(dom: HTMLElement): boolean {
    // DOM이 이미 존재하고 동일한 위젯의 것이라면 업데이트하지 않음
    return dom === this.button;
  }

  destroy(dom: HTMLElement) {
    // 버튼 참조 제거
    if (dom === this.button) {
      this.button = null;
    }
  }
}

export const createSyncFromRemoteExtension = (
  plugin: GTaskSyncPlugin,
  fileRepo: FileRepository,
  remote: Remote,
): Extension => {
  return [
    EditorView.theme(
      {
        '&': {
          '& .cm-sync-button': {
            cursor: 'pointer',
          },
        },
      },
      {
        dark: true,
      },
    ),
    StateField.define({
      create() {
        return Decoration.none;
      },
      update(_, tr) {
        const builder = new RangeSetBuilder<Decoration>();
        const lines = tr.state.doc.toString().split('\n');

        if (!plugin.getIsAuthorized()) {
          return builder.finish();
        }

        let pos = 0;
        for (const [index, line] of lines.entries()) {
          const meta = getGTaskLineMeta(line);

          if (meta != null) {
            builder.add(
              pos + line.length,
              pos + line.length,
              Decoration.widget({
                widget: SyncFromRemoteWidget.create(meta, index, plugin.app.workspace, fileRepo, remote),
                side: 1,
              }),
            );
          }
          pos += line.length + 1;
        }

        return builder.finish();
      },
      provide: (f) => EditorView.decorations.from(f),
    }),
  ];
};
