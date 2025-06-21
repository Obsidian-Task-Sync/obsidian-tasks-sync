import { createTaskMarkdown, TaskLineMeta } from 'src/libs/regexp';
import { Remote } from './remote/Remote';

export class Task {
  title: string;
  completed: boolean;
  identifier: string;
  remote: Remote;
  dueDate?: string; //yyyy-MM-dd format
  updatedAt: string; // ISO 8601 format

  constructor(
    title: string,
    remote: Remote,
    identifier: string,
    completed = false,
    dueDate?: string,
    updatedAt: string = new Date().toISOString(),
  ) {
    this.title = title;
    this.remote = remote;
    this.identifier = identifier;
    this.completed = completed;
    this.dueDate = dueDate;
    this.updatedAt = updatedAt;
  }

  static fromLineMeta(meta: TaskLineMeta, remote: Remote): Task {
    return new Task(meta.title, remote, meta.identifier, meta.completed, meta.dueDate);
  }

  setTitle(title: string): void {
    this.title = title;
  }

  setCompleted(completed: boolean): void {
    this.completed = completed;
  }

  setDueDate(dueDate: string | undefined): void {
    this.dueDate = dueDate;
  }

  setUpdatedAt(updatedAt: string): void {
    this.updatedAt = updatedAt;
  }

  toMarkdown(): string {
    return createTaskMarkdown(this);
  }

  getIdentifier(): string {
    return this.identifier;
  }
}
