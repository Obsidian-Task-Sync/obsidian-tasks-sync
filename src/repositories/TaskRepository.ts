import { App, TFile } from 'obsidian';
import { getGTaskLineMeta } from 'src/libs/regexp';
import { Remote } from 'src/models/remote/Remote';
import { Task } from '../models/Task';

interface ScanFileResult {
  added: Task[];
  updated: Task[];
}

export class TaskRepository {
  private tasksByFilePath: Map<string, Map<string, Task>> = new Map();

  constructor(
    private readonly app: App,
    private remote: Remote,
  ) {}

  async scanFile(file: TFile): Promise<ScanFileResult> {
    const content = await this.app.vault.read(file);
    const lines = content.split('\n');

    const result: ScanFileResult = {
      added: [],
      updated: [],
    };

    const tasksByFilePath = this.getTasksByFilePath(file.path);

    for (const line of lines) {
      const meta = getGTaskLineMeta(line);

      if (meta != null) {
        const { status, title, tasklistId, id } = meta;
        const cached = tasksByFilePath.get(id);

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

          tasksByFilePath.set(id, task);
          result.added.push(task);
        }
      }
    }

    for (const task of tasksByFilePath.values()) {
      if (!lines.some((line) => line.includes(`gtask:${task.tasklistId}:${task.id}`))) {
        tasksByFilePath.delete(task.id);
      }
    }

    await Promise.all(result.updated.map((task) => this.remote.update(task.id, task.tasklistId, task)));
    return result;
  }

  async syncWithDataSource(): Promise<void> {
    throw new Error('Not implemented');
  }

  private getTasksByFilePath(filePath: string): Map<string, Task> {
    let tasksByFilePath = this.tasksByFilePath.get(filePath);

    if (tasksByFilePath == null) {
      tasksByFilePath = new Map();
      this.tasksByFilePath.set(filePath, tasksByFilePath);
    }

    return tasksByFilePath;
  }
}
