import { TaskStatus } from 'src/models/Task';

export const GTASK_REGEXP = /- \[(.+?)\] \[(.+?)\]\(gtask:([^)]+):([^)]+)\)/;

export interface GTaskLineMeta {
  status: TaskStatus;
  title: string;
  tasklistId: string;
  id: string;
}

export function getGTaskLineMeta(line: string): GTaskLineMeta | null {
  const match = line.match(GTASK_REGEXP);
  if (match != null) {
    return {
      status: match[1] === 'x' ? 'completed' : 'needsAction',
      title: match[2] as string,
      tasklistId: match[3] as string,
      id: match[4] as string,
    };
  }
  return null;
}

export function createGTaskLine(meta: GTaskLineMeta): string {
  const status = meta.status === 'completed' ? 'x' : ' ';
  return `- [${status}] [${meta.title}](gtask:${meta.tasklistId}:${meta.id})`;
}
