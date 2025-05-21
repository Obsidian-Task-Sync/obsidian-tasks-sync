import { debounce } from 'es-toolkit';
import { App, TFile } from 'obsidian';
import { TaskRepository } from '../repositories/TaskRepository';

export class TaskController {
  private abortController = new AbortController();

  constructor(
    private readonly app: App,
    private readonly repository: TaskRepository,
  ) {}

  init(): void {
    const fileOpenEvent = this.app.workspace.on('file-open', async (file: TFile | null) => {
      if (file) {
        await this.repository.scanFile(file);
      }
    });

    const fileSaveEvent = this.app.vault.on(
      'modify',
      debounce((file) => this.repository.scanFile(file), 300, { signal: this.abortController.signal }),
    );

    this.abortController.signal.addEventListener('abort', () => {
      this.app.workspace.offref(fileOpenEvent);
      this.app.workspace.offref(fileSaveEvent);
    });
  }

  dispose(): void {
    this.abortController.abort();
  }
}
