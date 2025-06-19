import { FileRepository } from 'src/repositories/FileRepository';
import { Remote } from './Remote';
import { Notice } from 'obsidian';

class SyncFromRemoteManager {
  private intervalId: number | null = null;

  //default 동기화 주기는 60초
  constructor(
    private readonly remotes: Remote[],
    private readonly repo: FileRepository,
    private readonly syncIntervalMs: number = 60000,
  ) {}

  start(): void {
    if (this.intervalId !== null) {
      return;
    }

    this.intervalId = window.setInterval(async () => {
      await this.sync();
    }, this.syncIntervalMs);
  }

  private async sync(): Promise<void> {
    try {
      for (const remote of this.remotes) {
        // 각 Remote의 모든 태스크 조회
        const tasks = await remote.getAllTasks();

        // FileRepository의 각 파일에 대해 동기화 수행
        for (const file of this.repo.getAllFiles()) {
        }
      }
    } catch (error) {
      console.error('Remote sync failed:', error);
      new Notice(`Remote sync failed: ${error.message}`);
    }
  }
}
