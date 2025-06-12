import { createTaskMarkdown, TaskLineMeta } from 'src/libs/regexp';
import { Remote } from './remote/Remote';

export class Task {
  title: string;
  completed: boolean;
  identifier: string;
  remote: Remote;
  dueDate?: string; //yyyy-MM-dd format

  constructor(title: string, remote: Remote, identifier: string, completed = false, dueDate?: string) {
    this.title = title;
    this.remote = remote;
    this.identifier = identifier;
    this.completed = completed;
    this.dueDate = dueDate;
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

  setDueDate(dueDate: string): void {
    this.dueDate = dueDate;
  }

  toMarkdown(): string {
    return createTaskMarkdown(this);
  }

  getIdentifier(): string {
    return this.identifier;
  }
}
