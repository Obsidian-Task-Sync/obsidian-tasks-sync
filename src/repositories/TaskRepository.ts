import { App, TFile } from 'obsidian';
import { Remote } from 'src/models/remote/Remote';
import { Task, TaskStatus } from '../models/Task';

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
      const match = line.match(/- \[(.+?)\] \[(.+?)\]\(gtask:([^)]+):([^)]+)\)/);
      if (match) {
        const [, status, title, tasklistId, id] = match;
        const cached = tasksByFilePath.get(id);

        if (cached != null) {
          const isStatusUpdated = cached.status !== (status === 'x' ? 'completed' : 'needsAction');
          const isTitleUpdated = cached.title !== title;

          if (isStatusUpdated || isTitleUpdated) {
            cached.setStatus(status === 'x' ? 'completed' : 'needsAction');
            cached.setTitle(title);

            result.updated.push(cached);
          }
        } else {
          const taskStatus: TaskStatus = status === 'x' ? 'completed' : 'needsAction';
          const task = new Task(id, tasklistId, title, taskStatus);

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

    console.log(result.updated);

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
