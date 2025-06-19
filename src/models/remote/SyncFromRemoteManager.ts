import { FileRepository } from 'src/repositories/FileRepository';
import { Remote } from './Remote';
import { Notice } from 'obsidian';

export class SyncFromRemoteManager {
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
      await this.syncFromRemote();
    }, this.syncIntervalMs);
  }

  private async syncFromRemote(): Promise<void> {
    try {
      const remoteTasks = [];
      for (const remote of this.remotes) {
        // 각 Remote의 모든 태스크 조회
        const remotedTask = await remote.getAllTasks();
        remoteTasks.push(...remotedTask);
      }

      await this.repo.syncTasks(remoteTasks);
    } catch (error) {
      console.error('Remote sync failed:', error);
      new Notice(`Remote sync failed: ${error.message}`);
    }
  }
}
