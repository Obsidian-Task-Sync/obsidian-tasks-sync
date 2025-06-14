import { assert } from 'es-toolkit';
import { google, tasks_v1 } from 'googleapis';
import { App, Notice } from 'obsidian';
import TaskSyncPlugin from 'src/main';
import { registerTurnIntoGoogleTaskCommand } from 'src/models/remote/GTask/TurnIntoGoogleTaskCommand';
import { z } from 'zod';
import { Task } from '../../Task';
import { Remote } from '../Remote';
import { GTaskAuthorization } from './GTaskAuthorization';
import { GTaskSettingsData, GTaskSettingTab } from './GTaskSettings';

// tasklistId;taskId 형식의 문자열과 객체 간 양방향 변환을 위한 타입
type GTaskIdentifier = {
  tasklistId: string;
  taskId: string;
};

// tasklistId;taskId 형식의 문자열을 객체로 파싱하는 스키마
export const gTaskIdentifierSchema = z
  .string()
  .regex(/^([^;]+);([^;]+)$/)
  .transform((str) => {
    const [tasklistId, taskId] = str.split(';');
    return { tasklistId, taskId } as GTaskIdentifier;
  });

// GTaskIdentifier 객체를 문자열로 변환하는 함수
export function stringifyGTaskIdentifier(identifier: GTaskIdentifier): string {
  return `${identifier.tasklistId};${identifier.taskId}`;
}

const createGTaskArgs = z.object({
  tasklistId: z.string(),
});

export class GTaskRemote implements Remote {
  id = 'gtask';
  private _auth?: GTaskAuthorization;
  private _client?: tasks_v1.Tasks;
  settingTab: GTaskSettingTab;

  constructor(
    private app: App,
    private plugin: TaskSyncPlugin,
    private settings: GTaskSettingsData,
  ) {
    this.settingTab = new GTaskSettingTab(plugin, settings, this);
  }

  async init() {
    if (this.settings.googleClientId == null || this.settings.googleClientSecret == null) {
      return;
    }

    this._auth = new GTaskAuthorization(this.app, this.settings.googleClientId, this.settings.googleClientSecret);
    await this._auth.init();

    this._client = google.tasks({
      version: 'v1',
      auth: this._auth.getAuthClient(),
    });

    registerTurnIntoGoogleTaskCommand(this.plugin, this);
  }

  dispose() {
    this._auth?.dispose();
  }

  async authorize() {
    await this._auth?.authorize();
  }

  async unauthorize() {
    await this._auth?.unauthorize();
  }

  async checkIsAuthorized() {
    return (await this._auth?.checkIsAuthorized()) ?? false;
  }

  async assure() {
    if (this._client == null || this._auth == null) {
      throw new Error("There's no authentication. Please login to Google at Settings.");
    }

    return this._client;
  }

  async get(id: string): Promise<Task> {
    try {
      if (!this.settings.syncEnabled) {
        new Notice('연동이 꺼져 있어 태스크를 가져올 수 없습니다.');
        throw new Error('Google Task sync is disabled.');
      }
      const { tasklistId, taskId } = gTaskIdentifierSchema.parse(id);

      const client = await this.assure();
      const { data, status } = await client.tasks.get({
        task: taskId,
        tasklist: tasklistId,
      });

      assert(status === 200, 'Failed to get task');
      assert(data.id != null, 'Task ID is null');
      assert(data.title != null, 'Task title is null');
      assert(data.status != null, 'Task status is null');

      return new Task(data.title, this, id, data.status === 'completed');
    } catch (error) {
      new Notice(`태스크를 가져오는데 실패했습니다: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, from: Task): Promise<void> {
    if (!this.settings.syncEnabled) {
      new Notice('연동이 꺼져 있어 태스크를 업데이트할 수 없습니다.');
      throw new Error('Google Task sync is disabled.');
    }
    try {
      const { tasklistId, taskId } = gTaskIdentifierSchema.parse(id);

      const client = await this.assure();
      await client.tasks.update({
        task: taskId,
        tasklist: tasklistId,
        requestBody: {
          id: taskId,
          title: from.title,
          status: from.completed ? 'completed' : 'needsAction',
        },
      });
      new Notice('태스크가 업데이트되었습니다');
    } catch (error) {
      new Notice(`태스크 업데이트에 실패했습니다: ${error.message}`);
      throw error;
    }
  }

  async getTasklists() {
    if (!this.settings.syncEnabled) {
      new Notice('연동이 꺼져 있어 태스크를 업데이트할 수 없습니다.');
      throw new Error('Google Task sync is disabled.');
    }
    const client = await this.assure();
    const { data, status } = await client.tasklists.list();
    assert(status === 200, 'Failed to get tasklists');
    assert(data.items != null, 'Tasklists are null');
    return data.items;
  }

  async getTasks(tasklistId: string) {
    if (!this.settings.syncEnabled) {
      new Notice('연동이 꺼져 있어 태스크를 업데이트할 수 없습니다.');
      throw new Error('Google Task sync is disabled.');
    }
    const client = await this.assure();
    const { data, status } = await client.tasks.list({
      tasklist: tasklistId,
    });
    assert(status === 200, 'Failed to get tasks');
    assert(data.items != null, 'Tasks are null');
    return data.items;
  }

  async create(title: string, args: Record<string, string>): Promise<Task> {
    if (!this.settings.syncEnabled) {
      new Notice('연동이 꺼져 있어 Google Task를 생성할 수 없습니다.');
      throw new Error('Google Task sync is disabled.');
    }
    const parsedArgs = createGTaskArgs.parse(args);
    const { tasklistId } = parsedArgs;

    const client = await this.assure();

    const { data, status } = await client.tasks.insert({
      tasklist: tasklistId,
      requestBody: {
        title,
      },
    });
    assert(status === 200, 'Failed to create task');
    assert(data.id != null, 'Task ID is null');
    assert(data.title != null, 'Task title is null');

    const identifier = stringifyGTaskIdentifier({ tasklistId, taskId: data.id });
    return new Task(data.title, this, identifier, data.status === 'completed');
  }
}
