import { Task } from '../../Task';
import { Remote, RemoteSettingPanel } from '../Remote';
import { gTaskIdentifierSchema, stringifyGTaskIdentifier } from './GTaskRemote';

export interface GTaskItem {
  id: string;
  tasklistId: string;
  title: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated: string;
}

export interface GTaskInsertMeta {
  title: string;
  due?: string;
}

export class GTaskMockRemote implements Remote {
  mockedItemsMap: Map<string, GTaskItem>;

  get mockedItems(): GTaskItem[] {
    return Array.from(this.mockedItemsMap.values());
  }

  constructor() {
    this.mockedItemsMap = new Map([
      [
        'abc123',
        {
          id: 'abc123',
          tasklistId: '1',
          title: '옵시디언 설치하기',
          status: 'needsAction',
          due: '2021-01-01',
          updated: '2021-01-01',
        },
      ],
      [
        'def456',
        {
          id: 'def456',
          tasklistId: '1',
          title: '노션 작성하기',
          status: 'completed',
          due: '2021-01-02',
          updated: '2021-01-02',
        },
      ],
      [
        'ghi789',
        {
          id: 'ghi789',
          tasklistId: '1',
          title: '오픈소스 영상 촬영',
          status: 'needsAction',
          due: '2021-01-03',
          updated: '2021-01-03',
        },
      ],
      [
        'jkl012',
        {
          id: 'jkl012',
          tasklistId: '1',
          title: '운영체제 과제 제출',
          status: 'completed',
          due: '2021-01-04',
          updated: '2021-01-04',
        },
      ],
    ]);
  }
  getAllTasks(): Task[] {
    throw new Error('Method not implemented.');
  }
  dispose?(): void {
    throw new Error('Method not implemented.');
  }
  id: string;
  settingTab: RemoteSettingPanel<object>;
  init(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async authorize(): Promise<void> {
    console.log('Mock authorization successful');
  }

  async get(id: string): Promise<Task> {
    const { taskId } = gTaskIdentifierSchema.parse(id);
    const item = this.mockedItemsMap.get(taskId);

    if (item == null) {
      throw new Error(`Item with id ${taskId} not found`);
    }

    return mapToTask(item);
  }

  async update(id: string, from: Task): Promise<void> {
    const { taskId } = gTaskIdentifierSchema.parse(id);
    const item = this.mockedItemsMap.get(taskId) ?? defaultItem;

    this.mockedItemsMap.set(taskId, {
      ...item,
      id: taskId,
      title: from.title,
      status: from.completed ? 'completed' : 'needsAction',
    });
  }

  async create(title: string, due: string = '2025-10-14', args: Record<string, string>): Promise<Task> {
    const tasklistId = args.tasklistId;
    const item: GTaskItem = {
      id: 'mocked-id',
      tasklistId,
      title,
      status: 'needsAction',
      updated: new Date().toISOString(),
    };

    this.mockedItemsMap.set(item.id, item);

    const identifier = stringifyGTaskIdentifier({ tasklistId, taskId: item.id });
    return mapToTask(item, identifier);
  }

  async checkIsAuthorized(): Promise<boolean> {
    return true;
  }

  async unauthorize(): Promise<void> {
    console.log('Mock authorization revoked');
  }
}

function mapToTask(item: GTaskItem, identifier?: string): Task {
  const taskIdentifier = identifier ?? stringifyGTaskIdentifier({ tasklistId: item.tasklistId, taskId: item.id });
  return new Task(item.title, this, taskIdentifier, item.status === 'completed');
}

const defaultItem: GTaskItem = {
  id: '',
  tasklistId: '',
  title: '',
  status: 'needsAction',
  updated: new Date().toISOString(),
};
