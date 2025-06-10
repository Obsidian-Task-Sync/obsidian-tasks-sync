import { createTaskMarkdown, TaskLineMeta, TaskPlatform } from 'src/libs/regexp';

export class Task {
  title: string;
  completed: boolean;
  identifier: string;
  platform: TaskPlatform;

  constructor(title: string, platform: TaskPlatform, identifier: string, completed = false) {
    this.title = title;
    this.platform = platform;
    this.identifier = identifier;
    this.completed = completed;
  }

  static fromLineMeta(meta: TaskLineMeta): Task {
    return new Task(meta.title, meta.platform, meta.identifier, meta.completed);
  }

  setTitle(title: string): void {
    this.title = title;
  }

  setCompleted(completed: boolean): void {
    this.completed = completed;
  }

  toMarkdown(): string {
    return createTaskMarkdown(this);
  }

  getIdentifier(): string {
    return this.identifier;
  }
}
