import { assert } from 'es-toolkit';
import { Notice } from 'obsidian';
import { Task } from '../../Task';
import { GTaskRemote } from './GTaskRemote';

export class GTaskCreator {
  constructor(private remote: GTaskRemote) {}

  async createFromText(text: string, tasklistId = '@default'): Promise<Task> {
    try {
      const client = await this.remote.assure();

      const { data, status } = await client.tasks.insert({
        tasklist: tasklistId,
        requestBody: {
          title: text,
        },
      });

      assert(status === 200, 'Task 생성 실패');
      assert(data.id != null, 'Task ID가 null입니다');
      assert(data.title != null, 'Task 제목이 null입니다');

      const task = new Task(data.id, tasklistId, data.title, 'needsAction');
      new Notice(`Task 생성 완료: ${task.title}`);
      return task;
    } catch (error) {
      new Notice(`Task 생성 중 오류 발생: ${error.message}`);
      throw error;
    }
  }
}
