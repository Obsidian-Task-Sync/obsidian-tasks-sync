import { TodoistApi } from '@doist/todoist-api-typescript';
import { assert } from 'es-toolkit';
import { App, Notice } from 'obsidian';
import TaskSyncPlugin from 'src/main';
import { z } from 'zod';
import { Task } from '../../Task';
import { Remote } from '../Remote';
import { TodoistSettingsData, TodoistSettingTab } from './TodoistSettingTab';
import { registerTurnIntoTodoistCommand } from './TurnIntoTodoistCommand';

// Todoist identifier는 단순히 taskId만 사용
export const todoistIdentifierSchema = z.string();

export class TodoistRemote implements Remote {
  id = 'todoist';

  private _client?: TodoistApi;
  settingTab: TodoistSettingTab;

  constructor(
    private app: App,
    private plugin: TaskSyncPlugin,
    private settings: TodoistSettingsData,
  ) {
    this.settingTab = new TodoistSettingTab(plugin, settings, this);
  }

  async getAllTasks(): Promise<Task[]> {
    const client = await this.assure();
    const activeTasks = (await client.getTasks()).results;

    return activeTasks.map(
      (todoistTask) =>
        new Task(
          todoistTask.content,
          this,
          todoistTask.id,
          todoistTask.completedAt != null,
          todoistTask.due?.date,
          todoistTask.updatedAt ? todoistTask.updatedAt : new Date().toISOString(),
        ),
    );
  }

  dispose?(): void {
    throw new Error('Method not implemented.');
  }

  async init() {
    if (!this.settings.todoistApiToken) {
      return;
    }

    this._client = new TodoistApi(this.settings.todoistApiToken);

    registerTurnIntoTodoistCommand(this.plugin, this);
  }

  async authorize() {
    if (!this.settings.todoistApiToken) {
      throw new Error('Todoist API token is not set');
    }
    // API 토큰이 있으면 이미 인증된 상태
  }

  async unauthorize() {
    // API 토큰을 제거하는 것은 설정에서 처리
  }

  async checkIsAuthorized() {
    return !!this.settings.todoistApiToken;
  }

  private async assure() {
    if (!this._client) {
      throw new Error('Todoist API client is not initialized. Please check the API token in the settings.');
    }
    return this._client;
  }

  async get(id: string): Promise<Task> {
    try {
      const taskId = todoistIdentifierSchema.parse(id);
      const client = await this.assure();

      const todoistTask = await client.getTask(taskId);
      assert(todoistTask.id, 'Task ID is null');
      assert(todoistTask.content, 'Task content is null');

      return new Task(
        todoistTask.content,
        this,
        todoistTask.id,
        todoistTask.completedAt != null,
        todoistTask.due?.date,
      );
    } catch (error) {
      new Notice(`Failed to get task: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, from: Task): Promise<void> {
    try {
      const taskId = todoistIdentifierSchema.parse(id);
      const client = await this.assure();

      const requestBody: {
        content: string;
        dueString?: string;
      } = {
        content: from.title,
      };

      if (from.dueDate) {
        requestBody.dueString = from.dueDate;
      }

      await client.updateTask(taskId, requestBody);

      if (from.completed) {
        await client.closeTask(taskId);
      } else {
        await client.reopenTask(taskId);
      }

      new Notice('Task updated');
    } catch (error) {
      new Notice(`Failed to update task: ${error.message}`);
      throw error;
    }
  }

  async create(title: string, due?: string): Promise<Task> {
    try {
      const client = await this.assure();

      const requestBody: {
        content: string;
        dueString?: string;
      } = {
        content: title,
      };

      if (due) {
        requestBody.dueString = due;
      }

      const task = await client.addTask(requestBody);

      assert(task.id, 'Task ID is null');
      assert(task.content, 'Task content is null');

      return new Task(task.content, this, task.id, task.completedAt != null, due);
    } catch (error) {
      new Notice(`Failed to create task: ${error.message}`);
      throw error;
    }
  }

  // Todoist API 관련 추가 메서드들
  async getProjects() {
    const client = await this.assure();
    return client.getProjects();
  }

  async getTasks(projectId?: string) {
    const client = await this.assure();
    return client.getTasks({ projectId });
  }
}
