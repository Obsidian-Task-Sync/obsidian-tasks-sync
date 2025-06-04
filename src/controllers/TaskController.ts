import { debounce } from 'es-toolkit';
import { App, TFile } from 'obsidian';
import { FileRepository } from 'src/repositories/FileRepository';

export class TaskController {
  private abortController = new AbortController();

  constructor(
    private readonly app: App,
    private readonly fileRepo: FileRepository,
  ) {}

  init(): void {
    const fileOpenEvent = this.app.workspace.on('file-open', async (file: TFile | null) => {
      if (file != null) {
        await this.fileRepo.get(file.path)?.scan();
      }
    });

    const fileSaveEvent = this.app.vault.on(
      'modify',
      debounce((file) => this.fileRepo.get(file.path)?.scan(), 300, { signal: this.abortController.signal }),
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
