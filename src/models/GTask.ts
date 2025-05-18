export enum GTaskItemStatus {
	NeedsAction = "needsAction",
	Completed = "completed",
}

export interface GTaskItem {
	id: string;
	title: string;
	status: GTaskItemStatus;
	due?: string;
	updated: string;
}

export interface GTaskDataSource {
	get(id: string): Promise<GTaskItem>;
	list(): Promise<GTaskItem[]>;
	update(id: string, data: Partial<GTaskItem>): Promise<void>;
	insert(meta: { title: string; due?: string }): Promise<GTaskItem>;
}

export class GTask {
	dataSource: GTaskDataSource;

	constructor(dataSource: GTaskDataSource) {
		this.dataSource = dataSource;
	}

	async get(id: string) {
		return this.dataSource.get(id);
	}

	async list() {
		return this.dataSource.list();
	}

	async update(id: string, data: Partial<GTaskItem>) {
		return this.dataSource.update(id, data);
	}

	async insert(meta: { title: string; due?: string }) {
		return this.dataSource.insert(meta);
	}
}
