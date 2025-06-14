import { Task } from 'src/models/Task';

// 태스크 플랫폼 타입 정의
export type TaskPlatform = 'gtask' | 'todoist';

export interface TaskInitialMeta {
  title: string;
  completed: boolean;
  dueDate?: string;
}

// 태스크 메타데이터 인터페이스
export interface TaskLineMeta {
  title: string;
  platform: TaskPlatform;
  identifier: string;
  completed: boolean;
  dueDate?: string; // yyyy-MM-dd format
}

// 태스크 메타데이터 파싱을 위한 정규식 수정
// 형식: - [ ] title [due:: yyyy-MM-dd] <!-- task:platform:identifier -->
export const TASK_REGEXP =
  /^(?:-\s+\[([ x])\]\s+)?(.+?)(?:\s*\[due::([^\]]+)\])?(?:\s*<!--\s*task:([^:\s]+):([^:\s]+)\s*-->)?$/;

// 태스크 생성 전 기본 정보 파싱을 위한 정규식
export const TASK_INITAL_REGEXP = /^(?:-\s+\[([ x])\]\s+)?([^[\n]+?)(?:\s*\[due::([^\]]+)\])?$/;

// 지원하는 플랫폼 목록
const SUPPORTED_PLATFORMS = new Set<TaskPlatform>(['gtask', 'todoist']);

// 생성되지 않은 태스크 라인에서 메타데이터 추출
export function getTaskInitialMeta(line: string): TaskInitialMeta | null {
  const match = line.match(TASK_INITAL_REGEXP);
  if (!match) return null;

  const [_, checkbox, title, dueDate] = match;

  return {
    title: title.trim(),
    completed: checkbox === 'x',
    dueDate: dueDate ? dueDate.trim() : undefined,
  };
}

// 태스크 라인에서 메타데이터 추출
export function getTaskLineMeta(line: string): TaskLineMeta | null {
  const match = line.match(TASK_REGEXP);
  if (!match) return null;

  const [_, checkbox, title, dueDate, platform, identifier] = match;

  // 메타데이터가 없는 경우 (일반 텍스트)
  if (!platform || !identifier) {
    return null;
  }

  // 플랫폼 타입 검증
  if (!isValidPlatform(platform)) {
    console.warn(`지원하지 않는 플랫폼: ${platform}`);
    return null;
  }

  // 체크박스 상태 확인
  const completed = checkbox === 'x';

  return {
    title: title.trim(),
    platform: platform as TaskPlatform,
    identifier: identifier.trim(),
    completed,
    dueDate: dueDate ? dueDate.trim() : undefined,
  };
}

// 플랫폼 타입 검증
function isValidPlatform(platform: string): platform is TaskPlatform {
  return SUPPORTED_PLATFORMS.has(platform as TaskPlatform);
}

// 태스크 메타데이터로 마크다운 라인 생성
export function createTaskMarkdown(task: Task): string {
  const checkbox = task.completed ? '- [x]' : '- [ ]';
  const dueDate = task.dueDate ? ` [due::${task.dueDate}]` : '';
  return `${checkbox} ${task.title} ${dueDate} <!-- task:${task.remote.id}:${task.identifier} -->`;
}
