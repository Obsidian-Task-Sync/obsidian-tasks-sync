import { Task } from '../../Task';
import { Remote } from '../Remote';

export interface GTaskItem {
  id: string;
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
          title: '운영체제 과제 제출',
          status: 'completed',
          due: '2021-01-04',
          updated: '2021-01-04',
        },
      ],
    ]);
  }

  get(id: string) {
    const item = this.mockedItemsMap.get(id);

    if (item == null) {
      throw new Error(`Item with id ${id} not found`);
    }

    return Promise.resolve(mapToTask(item));
  }

  list() {
    return Promise.resolve(this.mockedItems.map(mapToTask));
  }

  update(from: Task): Promise<void> {
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
  return new Task(item.id, item.title, item.status);
}

const defaultItem: GTaskItem = {
  id: '',
  title: '',
  status: 'needsAction',
  updated: new Date().toISOString(),
};
