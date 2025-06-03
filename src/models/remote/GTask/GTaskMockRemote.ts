import { Task } from '../../Task';
import { Remote } from '../Remote';

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
        '1',
        {
          id: '1',
          tasklistId: '1',
          title: 'Test',
          status: 'needsAction',
          due: '2021-01-01',
          updated: '2021-01-01',
        },
      ],
      [
        '2',
        {
          id: '2',
          tasklistId: '1',
          title: 'Test 2',
          status: 'needsAction',
          due: '2021-01-02',
          updated: '2021-01-02',
        },
      ],
      [
        '3',
        {
          id: '3',
          tasklistId: '1',
          title: 'Test 3',
          status: 'needsAction',
          due: '2021-01-03',
          updated: '2021-01-03',
        },
      ],
      [
        '4',
        {
          id: '4',
          tasklistId: '1',
          title: 'Test 4',
          status: 'needsAction',
          due: '2021-01-04',
          updated: '2021-01-04',
        },
      ],
    ]);
  }

  get(id: string, tasklistId: string) {
    const item = this.mockedItemsMap.get(id);

    if (item == null) {
      throw new Error(`Item with id ${id} not found`);
    }

    return Promise.resolve(mapToTask(item));
  }

  update(id: string, tasklistId: string, from: Task): Promise<void> {
    const item = this.mockedItemsMap.get(from.id) ?? defaultItem;

    this.mockedItemsMap.set(from.id, {
      ...item,
      id: from.id,
      title: from.title,
      status: from.status,
    });

    return Promise.resolve();
  }
}

function mapToTask(item: GTaskItem): Task {
  return new Task(item.id, item.tasklistId, item.title, item.status);
}

const defaultItem: GTaskItem = {
  id: '',
  tasklistId: '',
  title: '',
  status: 'needsAction',
  updated: new Date().toISOString(),
};
