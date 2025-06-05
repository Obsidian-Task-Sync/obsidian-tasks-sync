import { assert } from 'es-toolkit';
import { google, tasks_v1 } from 'googleapis';
import { App, Notice } from 'obsidian';
import { GTaskSyncPluginSettings } from 'src/main';
import { Task } from '../../Task';
import { Remote } from '../Remote';
import { GTaskAuthorization } from './GTaskAuthorization';

export class GTaskRemote implements Remote {
  private _auth?: GTaskAuthorization;
  private _client?: tasks_v1.Tasks;

  constructor(
    private app: App,
    private settings: GTaskSyncPluginSettings,
  ) {}

  async init() {
    if (this.settings.googleClientId == null || this.settings.googleClientSecret == null) {
      return;
    }

    this._auth = new GTaskAuthorization(this.app, this.settings.googleClientId, this.settings.googleClientSecret);
    this._client = google.tasks({
      version: 'v1',
      auth: this._auth.getAuthClient(),
    });
  }

  dispose() {
    this._auth?.dispose();
  }

  async authorize() {
    await this._auth?.authorize();
  }

  async assure() {
    if (this._client == null || this._auth == null) {
      throw new Error("There's no authentication. Please login to Google at Settings.");
    }

    return this._client;
  }

  async get(id: string, tasklistId: string): Promise<Task> {
    try {
      const client = await this.assure();
      const { data, status } = await client.tasks.get({
        task: id,
        tasklist: tasklistId,
      });

      assert(status === 200, 'Failed to get task');
      assert(data.id != null, 'Task ID is null');
      assert(data.title != null, 'Task title is null');
      assert(data.status != null, 'Task status is null');

      return new Task(data.id, tasklistId, data.title, data.completed != null ? 'completed' : 'needsAction');
    } catch (error) {
      new Notice(`태스크를 가져오는데 실패했습니다: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, tasklistId: string, from: Task): Promise<void> {
    try {
      const client = await this.assure();
      await client.tasks.update({
        task: id,
        tasklist: tasklistId,
        requestBody: {
          id: id,
          title: from.title,
          status: from.status === 'completed' ? 'completed' : 'needsAction',
        },
      });
      new Notice('태스크가 업데이트되었습니다');
    } catch (error) {
      new Notice(`태스크 업데이트에 실패했습니다: ${error.message}`);
      throw error;
    }
  }

  async getTasklists() {
    const client = await this.assure();
    const { data, status } = await client.tasklists.list();
    assert(status === 200, 'Failed to get tasklists');
    assert(data.items != null, 'Tasklists are null');
    return data.items;
  }

  async getTasks(tasklistId: string) {
    const client = await this.assure();
    const { data, status } = await client.tasks.list({
      tasklist: tasklistId,
    });
    assert(status === 200, 'Failed to get tasks');
    assert(data.items != null, 'Tasks are null');
    return data.items;
  }

  async create(title: string, tasklistId: string) {
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

    return new Task(data.id, tasklistId, data.title, 'needsAction');
  }
}
