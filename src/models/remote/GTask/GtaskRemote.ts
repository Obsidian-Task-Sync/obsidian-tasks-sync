import { Task } from '../../Task';
import { Remote } from '../Remote';
import { GTaskAuthorization } from './GTaskAuthorization';

export class GtaskRemote implements Remote {
  private authorization: GTaskAuthorization;

  constructor(authorization: GTaskAuthorization) {
    this.authorization = authorization;
  }

  get(id: string): Promise<Task> {
    throw new Error('Method not implemented.');
  }
  list(): Promise<Task[]> {
    throw new Error('Method not implemented.');
  }
  update(from: Task): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
