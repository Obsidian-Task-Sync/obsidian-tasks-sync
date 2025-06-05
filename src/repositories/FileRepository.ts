import { App, TFile } from 'obsidian';
import { getGTaskLineMeta } from 'src/libs/regexp';
import { Remote } from 'src/models/remote/Remote';
import { Task } from 'src/models/Task';

export class FileRepository {
  private files: Map<string, File> = new Map();

  constructor(
    private app: App,
    private remote: Remote,
  ) {}

  get(path: string): File | undefined {
    const file = this.files.get(path);

    if (file == null) {
      const tFile = this.app.vault.getFileByPath(path);
      if (tFile == null) {
        return undefined;
      }

      const file = new File(this.app, this.remote, tFile);
      this.files.set(path, file);
    }

    return file;
  }

  async initialize(): Promise<void> {
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
}

interface ScanFileResult {
  added: Task[];
  updated: Task[];
}

//taskId : tasklistId
type TaskKey = `${string}:${string}`;

export class File {
  private tasks: Map<TaskKey, Task> = new Map();

  constructor(
    private app: App,
    private remote: Remote,
    private file: TFile,
  ) {}

  async initialize(): Promise<void> {
    const content = await this.app.vault.read(this.file);
    const lines = content.split('\n');

    for (const line of lines) {
      const meta = getGTaskLineMeta(line);

      if (meta != null) {
        const { status, title, tasklistId, id } = meta;
        const task = new Task(id, tasklistId, title, status);

        this.tasks.set(`${id}:${tasklistId}`, task);
      }
    }
  }

  getTask(id: string, tasklistId: string): Task | undefined {
    return this.tasks.get(`${id}:${tasklistId}`);
  }

  async scan(): Promise<void> {
    const content = await this.app.vault.read(this.file);
    const lines = content.split('\n');

    const result: ScanFileResult = {
      added: [],
      updated: [],
    };

    for (const line of lines) {
      const meta = getGTaskLineMeta(line);

      if (meta != null) {
        const { status, title, tasklistId, id } = meta;
        const cached = this.tasks.get(`${id}:${tasklistId}`);

        if (cached != null) {
          const isStatusUpdated = cached.status !== status;
          const isTitleUpdated = cached.title !== title;

          if (isStatusUpdated || isTitleUpdated) {
            cached.setStatus(status);
            cached.setTitle(title);

            result.updated.push(cached);
          }
        } else {
          const task = new Task(id, tasklistId, title, status);

          this.tasks.set(`${id}:${tasklistId}`, task);
          result.added.push(task);
        }
      }
    }

    // iterator 순회중에 중간에 삭제하는 것은 위험하므로, 추후 로직 수정 필요
    for (const task of this.tasks.values()) {
      if (!lines.some((line) => line.includes(`gtask:${task.id}:${task.tasklistId}`))) {
        this.tasks.delete(`${task.id}:${task.tasklistId}`);
      }
    }

    await Promise.all(result.updated.map((task) => this.remote.update(task.id, task.tasklistId, task)));
  }

  hasAnyTask(): boolean {
    return this.tasks.size > 0;
  }
}
