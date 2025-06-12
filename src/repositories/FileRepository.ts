import { debounce } from 'es-toolkit';
import { App, TFile } from 'obsidian';
import { getTaskLineMeta, TaskLineMeta, TaskPlatform } from 'src/libs/regexp';
import TaskSyncPlugin from 'src/main';
import { Task } from 'src/models/Task';

export class FileRepository {
  private files: Map<string, File> = new Map();

  private abortController = new AbortController();

  constructor(
    private app: App,
    private plugin: TaskSyncPlugin,
  ) {
    const fileOpenEvent = this.app.workspace.on('file-open', async (file) => {
      if (file != null) {
        console.log('file-open', file.path);
        await this.get(file.path)?.initialize();
      }
    });

    const fileSaveEvent = this.app.vault.on(
      'modify',
      debounce((file) => this.get(file.path)?.scan(), 5, { signal: this.abortController.signal }),
    );

    this.abortController.signal.addEventListener('abort', () => {
      this.app.workspace.offref(fileOpenEvent);
      this.app.workspace.offref(fileSaveEvent);
    });
  }

  async init() {
    const markdownFiles = this.app.vault.getMarkdownFiles();
    const batchSize = 20;

    for (let i = 0; i < markdownFiles.length; i += batchSize) {
      const batch = markdownFiles.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (tFile) => {
          const file = new File(this.app, this.plugin, tFile);
          await file.initialize();

          if (file.hasAnyTask()) {
            this.files.set(tFile.path, file);
          }
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  dispose(): void {
    this.abortController.abort();
  }

  get(path: string): File | undefined {
    let file = this.files.get(path);

    if (file == null) {
      const tFile = this.app.vault.getFileByPath(path);

      if (tFile == null) {
        return undefined;
      }

      file = new File(this.app, this.plugin, tFile);
      this.files.set(path, file);
    }

    return file;
  }
}

interface ScanFileResult {
  added: Task[];
  updated: Task[];
}

export class File {
  private tasks: Map<string, Task> = new Map();

  constructor(
    private app: App,
    private plugin: TaskSyncPlugin,
    private file: TFile,
  ) {}

  async initialize(): Promise<void> {
    const content = await this.app.vault.read(this.file);
    const lines = content.split('\n');

    for (const line of lines) {
      const meta = getTaskLineMeta(line);

      if (meta != null) {
        const task = Task.fromLineMeta(meta, this.plugin.getRemoteByPlatform(meta.platform));
        this.tasks.set(getTaskItemIdentifierFromMeta(meta), task);
      }
    }
  }

  getTask(meta: TaskLineMeta): Task | undefined {
    return this.tasks.get(getTaskItemIdentifierFromMeta(meta));
  }

  async scan(): Promise<void> {
    const content = await this.app.vault.read(this.file);
    const lines = content.split('\n');

    const result: ScanFileResult = {
      added: [],
      updated: [],
    };

    for (const line of lines) {
      const meta = getTaskLineMeta(line);

      if (meta != null) {
        const { title, completed } = meta;
        const mapId = getTaskItemIdentifierFromMeta(meta);
        const cached = this.tasks.get(mapId);

        if (cached != null) {
          const isTitleUpdated = cached.title !== title;
          const isCompletedUpdated = cached.completed !== completed;

          if (isTitleUpdated) {
            cached.setTitle(title);
            result.updated.push(cached);
          }

          if (isCompletedUpdated) {
            cached.setCompleted(completed);
            result.updated.push(cached);
          }
        } else {
          const task = Task.fromLineMeta(meta, this.plugin.getRemoteByPlatform(meta.platform));

          this.tasks.set(mapId, task);
          result.added.push(task);
        }
      }
    }

    // iterator 순회중에 중간에 삭제하는 것은 위험하므로, 추후 로직 수정 필요
    for (const task of this.tasks.values()) {
      const mapId = getTaskItemIdentifierFromTask(task);
      if (!lines.some((line) => line.includes(mapId))) {
        this.tasks.delete(mapId);
      }
    }

    await Promise.all(result.updated.map((task) => task.remote.update(task.identifier, task)));
  }

  hasAnyTask(): boolean {
    return this.tasks.size > 0;
  }
}

type TaskItemIdentifier = `task:${TaskPlatform}:${string}`;

function getTaskItemIdentifierFromMeta(meta: TaskLineMeta): TaskItemIdentifier {
  return `task:${meta.platform}:${meta.identifier}` as const;
}

function getTaskItemIdentifierFromTask(task: Task): TaskItemIdentifier {
  return `task:${task.remote.id as TaskPlatform}:${task.identifier}` as const;
}
