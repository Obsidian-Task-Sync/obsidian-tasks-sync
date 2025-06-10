import { Task } from '../Task';

export interface Remote {
  get(id: string): Promise<Task>;
  update(id: string, from: Task): Promise<void>;
  create(title: string, args: Record<string, string>): Promise<Task>;
  authorize(): Promise<void>;
  unauthorize(): Promise<void>;
  checkIsAuthorized(): Promise<boolean>;
}
