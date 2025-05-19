import { GTaskDataSource, GTaskItem, GTaskItemStatus } from './GTask'

export class GTaskMockDataSource implements GTaskDataSource {
  mockedItemsMap: Map<string, GTaskItem>

  get mockedItems(): GTaskItem[] {
    return Array.from(this.mockedItemsMap.values())
  }

  constructor() {
    this.mockedItemsMap = new Map([
      [
        '1',
        {
          id: '1',
          title: 'Test',
          status: GTaskItemStatus.NeedsAction,
          due: '2021-01-01',
          updated: '2021-01-01',
        },
      ],
      [
        '2',
        {
          id: '2',
          title: 'Test 2',
          status: GTaskItemStatus.NeedsAction,
          due: '2021-01-02',
          updated: '2021-01-02',
        },
      ],
      [
        '3',
        {
          id: '3',
          title: 'Test 3',
          status: GTaskItemStatus.NeedsAction,
          due: '2021-01-03',
          updated: '2021-01-03',
        },
      ],
      [
        '4',
        {
          id: '4',
          title: 'Test 4',
          status: GTaskItemStatus.NeedsAction,
          due: '2021-01-04',
          updated: '2021-01-04',
        },
      ],
    ])
  }

  get(id: string): Promise<GTaskItem> {
    const item = this.mockedItemsMap.get(id)

    if (item == null) {
      throw new Error(`Item with id ${id} not found`)
    }

    return Promise.resolve(item)
  }

  list(): Promise<GTaskItem[]> {
    return Promise.resolve(this.mockedItems)
  }

  update(id: string, data: Partial<GTaskItem>): Promise<void> {
    const item = this.mockedItemsMap.get(id)

    if (item == null) {
      throw new Error(`Item with id ${id} not found`)
    }

    this.mockedItemsMap.set(id, { ...item, ...data })

    return Promise.resolve()
  }

  insert(meta: { title: string; due?: string }): Promise<GTaskItem> {
    const id = this.mockedItemsMap.size + 1
    const item: GTaskItem = {
      id: id.toString(),
      title: meta.title,
      status: GTaskItemStatus.NeedsAction,
      due: meta.due,
      updated: new Date().toISOString(),
    }

    this.mockedItemsMap.set(id.toString(), item)

    return Promise.resolve(item)
  }
}
