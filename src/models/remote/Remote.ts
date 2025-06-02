import { Task } from '../Task';

export interface Remote {
  get(id: string, tasklistId: string): Promise<Task>;
  update(id: string, tasklistId: string, from: Task): Promise<void>;
}
