import { debounce } from 'es-toolkit';
import { App, EditorPosition, TFile } from 'obsidian';
import { getTaskLineMeta, TaskLineMeta, TaskPlatform } from 'src/libs/regexp';
import TaskSyncPlugin from 'src/main';
import { Task } from 'src/models/Task';

export class FileRepository {
  private files: Map<string, File> = new Map();

  private abortController = new AbortController();

  constructor(
    private app: App,
    private plugin: TaskSyncPlugin,
  ) {
    const fileOpenEvent = this.app.workspace.on('file-open', async (file) => {
      if (file != null) {
        console.log('file-open', file.path);
        await this.get(file.path)?.initialize();
      }
    });

    const fileSaveEvent = this.app.vault.on(
      'modify',
      debounce((file) => this.get(file.path)?.scan(), 10, { signal: this.abortController.signal }),
    );

    this.abortController.signal.addEventListener('abort', () => {
      this.app.workspace.offref(fileOpenEvent);
      this.app.workspace.offref(fileSaveEvent);
    });
  }

  async init() {
    const markdownFiles = this.app.vault.getMarkdownFiles();
    const batchSize = 20;

    for (let i = 0; i < markdownFiles.length; i += batchSize) {
      const batch = markdownFiles.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (tFile) => {
          const file = new File(this.app, this.plugin, tFile);
          await file.initialize();

          if (file.hasAnyTask()) {
            this.files.set(tFile.path, file);
          }
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  dispose(): void {
    this.abortController.abort();
  }

  //Remote Task들을 Local에 동기화 기존에 있는 태스크들의 변경사항만 반영하고, 없는 태스크는 추가하지 않음
  async syncTasks(remoteTasks: Task[]) {
    for (const file of this.files.values()) {
      await file.syncFrom(remoteTasks);
    }
  }

  get(path: string): File | undefined {
    let file = this.files.get(path);

    if (file == null) {
      const tFile = this.app.vault.getFileByPath(path);

      if (tFile == null) {
        return undefined;
      }

      file = new File(this.app, this.plugin, tFile);
      this.files.set(path, file);
    }

    return file;
  }

  getAllFiles(): File[] {
    return Array.from(this.files.values());
  }
}

interface ScanFileResult {
  added: Task[];
  updated: Task[];
}

interface TaskWithPosition {
  task: Task;
  position: EditorPosition;
}

export class File {
  private static readonly TASK_PREFIX = '- [';
  private tasks: Map<string, TaskWithPosition> = new Map();

  constructor(
    private app: App,
    private plugin: TaskSyncPlugin,
    private file: TFile,
  ) {}

  async initialize(): Promise<void> {
    try {
      const content = await this.app.vault.read(this.file);
      const lines = content.split('\n');

      lines.forEach((lineContent, lineNumber) => {
        const meta = getTaskLineMeta(lineContent);
        if (!meta) return;

        const taskId = getTaskItemIdentifierFromMeta(meta);
        const position: EditorPosition = {
          line: lineNumber,
          ch: lineContent.indexOf(File.TASK_PREFIX),
        };

        // 새 태스크 생성 및 메모리에 저장
        const task = Task.fromLineMeta(meta, this.plugin.getRemoteByPlatform(meta.platform));

        this.tasks.set(taskId, {
          position,
          task,
        });
      });
    } catch (error) {
      console.error(`Failed to initialize file ${this.file.path}:`, error);
      throw error;
    }
  }

  getTask(meta: TaskLineMeta): Task | undefined {
    return this.tasks.get(getTaskItemIdentifierFromMeta(meta))?.task;
  }

  async scan(): Promise<void> {
    const content = await this.app.vault.read(this.file);
    const lines = content.split('\n');

    const result: ScanFileResult = {
      added: [],
      updated: [],
    };

    lines.forEach((line, lineNumber) => {
      const meta = getTaskLineMeta(line);
      if (!meta) return;

      const taskId = getTaskItemIdentifierFromMeta(meta);
      const position: EditorPosition = {
        line: lineNumber,
        ch: line.indexOf(File.TASK_PREFIX),
      };

      const existing = this.tasks.get(taskId);
      if (existing) {
        // 항상 position은 업데이트
        existing.position = position;
        const task = existing.task;

        // task 내용이 변경된 경우만 result.updated에 추가
        const isTitleUpdated = task.title !== meta.title;
        const isCompletedUpdated = task.completed !== meta.completed;
        const isDueDateUpdated = task.dueDate !== meta.dueDate;

        if (isTitleUpdated || isCompletedUpdated || isDueDateUpdated) {
          if (isTitleUpdated) {
            task.setTitle(meta.title);
          }
          if (isCompletedUpdated) {
            task.setCompleted(meta.completed);
          }
          if (isDueDateUpdated && meta.dueDate !== undefined) {
            task.setDueDate(meta.dueDate);
          }
          result.updated.push(task);
        }
      } else {
        // 새로운 task 추가
        const task = Task.fromLineMeta(meta, this.plugin.getRemoteByPlatform(meta.platform));

        this.tasks.set(taskId, {
          position,
          task,
        });
        result.added.push(task);
      }
    });

    for (const cached of this.tasks.values()) {
      const mapId = getTaskItemIdentifierFromTask(cached.task);
      if (!lines.some((line) => line.includes(mapId))) {
        this.tasks.delete(mapId);
      }
    }

    if (result.updated.length > 0) {
      await Promise.all(result.updated.map((task) => task.remote.update(task.identifier, task)));
    }
  }

  hasAnyTask(): boolean {
    return this.tasks.size > 0;
  }

  async syncFrom(remoteTasks: Task[]) {
    const remoteTasksMap = new Map(remoteTasks.map((task) => [task.getIdentifier(), task]));

    this.tasks.forEach((taskWithPos) => {
      const task = taskWithPos.task;
      const taskId = task.getIdentifier();
      const remoteTask = remoteTasksMap.get(taskId);

      if (remoteTask) {
        const isTitleUpdated = task.title !== remoteTask.title;
        const isCompletedUpdated = task.completed !== remoteTask.completed;
        const isDueDateUpdated = task.dueDate !== remoteTask.dueDate;

        if (isTitleUpdated || isCompletedUpdated || isDueDateUpdated) {
          if (isTitleUpdated) {
            task.setTitle(remoteTask.title);
          }
          if (isCompletedUpdated) {
            task.setCompleted(remoteTask.completed);
          }
          if (isDueDateUpdated && remoteTask.dueDate !== undefined) {
            task.setDueDate(remoteTask.dueDate);
          }

          this.updateTaskAtPosition(taskWithPos.position, task);
        }
      }
    });
  }

  async updateTaskAtPosition(position: EditorPosition, task: Task): Promise<void> {
    const content = await this.app.vault.read(this.file);
    const lines = content.split('\n');

    if (position.line < 0 || position.line >= lines.length) {
      throw new Error(`Invalid line number: ${position.line}`);
    }

    const taskMarkDown = task.toMarkdown();
    lines[position.line] = taskMarkDown;

    await this.app.vault.modify(this.file, lines.join('\n'));
  }
}

type TaskItemIdentifier = `task:${TaskPlatform}:${string}`;

function getTaskItemIdentifierFromMeta(meta: TaskLineMeta): TaskItemIdentifier {
  return `task:${meta.platform}:${meta.identifier}` as const;
}

function getTaskItemIdentifierFromTask(task: Task): TaskItemIdentifier {
  return `task:${task.remote.id as TaskPlatform}:${task.identifier}` as const;
}
