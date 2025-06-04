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
}

interface ScanFileResult {
  added: Task[];
  updated: Task[];
}

type TaskKey = `${string}:${string}`;

export class File {
  private tasks: Map<TaskKey, Task> = new Map();

  constructor(
    private app: App,
    private remote: Remote,
    private file: TFile,
  ) {}

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

    for (const task of this.tasks.values()) {
      if (!lines.some((line) => line.includes(`gtask:${task.tasklistId}:${task.id}`))) {
        this.tasks.delete(`${task.id}:${task.tasklistId}`);
      }
    }

    await Promise.all(result.updated.map((task) => this.remote.update(task.id, task.tasklistId, task)));
  }
}
