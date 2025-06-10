import { createTaskMarkdown, TaskLineMeta } from 'src/libs/regexp';
import { Remote } from './remote/Remote';

export class Task {
  title: string;
  completed: boolean;
  identifier: string;
  remote: Remote;

  constructor(title: string, remote: Remote, identifier: string, completed = false) {
    this.title = title;
    this.remote = remote;
    this.identifier = identifier;
    this.completed = completed;
  }

  static fromLineMeta(meta: TaskLineMeta, remote: Remote): Task {
    return new Task(meta.title, remote, meta.identifier, meta.completed);
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
