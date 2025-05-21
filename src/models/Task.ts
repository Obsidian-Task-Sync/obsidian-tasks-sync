export type TaskStatus = 'needsAction' | 'completed';

export class Task {
  id: string;
  title: string;
  status: TaskStatus;

  constructor(id: string, title: string, status: TaskStatus) {
    this.id = id;
    this.title = title;
    this.status = status;
  }

  setTitle(title: string): void {
    this.title = title;
  }

  setStatus(status: TaskStatus): void {
    this.status = status;
  }

  toMarkdown(): string {
    const status = this.status === 'completed' ? 'x' : ' ';
    return `- [${status}] [${this.title}](gtask:${this.id})`;
  }
}
