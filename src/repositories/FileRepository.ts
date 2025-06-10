import { debounce } from 'es-toolkit';
import { App, TFile } from 'obsidian';
import { getTaskLineMeta } from 'src/libs/regexp';
import { Remote } from 'src/models/remote/Remote';
import { Task } from 'src/models/Task';

export class FileRepository {
  private files: Map<string, File> = new Map();

  private abortController = new AbortController();

  constructor(
    private app: App,
    private remote: Remote,
  ) {
    const fileOpenEvent = this.app.workspace.on('file-open', async (file) => {
      if (file != null) {
        console.log('file-open', file.path);
        await this.get(file.path)?.initialize();
      }
    });

    const fileSaveEvent = this.app.vault.on(
      'modify',
      debounce((file) => this.get(file.path)?.scan(), 300, { signal: this.abortController.signal }),
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
          const file = new File(this.app, this.remote, tFile);
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

      file = new File(this.app, this.remote, tFile);
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
    private remote: Remote,
    private file: TFile,
  ) {}

  async initialize(): Promise<void> {
    const content = await this.app.vault.read(this.file);
    const lines = content.split('\n');

    for (const line of lines) {
      const meta = getTaskLineMeta(line);

      if (meta != null) {
        const task = Task.fromLineMeta(meta);
        this.tasks.set(task.identifier, task);
      }
    }
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
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
        const { title, identifier } = meta;
        const cached = this.tasks.get(identifier);

        if (cached != null) {
          const isTitleUpdated = cached.title !== title;

          if (isTitleUpdated) {
            cached.setTitle(title);

            result.updated.push(cached);
          }
        } else {
          const task = Task.fromLineMeta(meta);

          this.tasks.set(identifier, task);
          result.added.push(task);
        }
      }
    }

    // iterator 순회중에 중간에 삭제하는 것은 위험하므로, 추후 로직 수정 필요
    for (const task of this.tasks.values()) {
      if (!lines.some((line) => line.includes(`gtask:${task.identifier}`))) {
        this.tasks.delete(task.identifier);
      }
    }

    await Promise.all(result.updated.map((task) => this.remote.update(task.identifier, task)));
  }

  hasAnyTask(): boolean {
    return this.tasks.size > 0;
  }
}
