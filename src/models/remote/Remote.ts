import { Task } from '../Task';

export interface Remote {
  get(id: string): Promise<Task>;
  list(): Promise<Task[]>;
  update(from: Task): Promise<void>;
}
