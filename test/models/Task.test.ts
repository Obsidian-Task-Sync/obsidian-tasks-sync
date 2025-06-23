import { TaskLineMeta } from 'src/libs/regexp';
import { Remote, RemoteSettingPanel } from 'src/models/remote/Remote';
import { Task } from 'src/models/Task';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock RemoteSettingPanel for testing
class MockRemoteSettingPanel extends RemoteSettingPanel {
  display(): void {
    // Mock implementation
  }
}

// Mock Remote for testing
const createMockRemote = (id: string): Remote => {
  const mockPlugin = {
    updateSettings: vi.fn(),
  } as any;

  const mockSettingTab = {
    containerEl: null, // Node.js 환경에서는 null 사용
    display: vi.fn(),
  } as any;

  const settingPanel = new MockRemoteSettingPanel(mockPlugin, {}, {} as Remote);
  settingPanel.init(mockSettingTab);

  return {
    id,
    name: `Mock ${id} Remote`,
    settingTab: settingPanel,
    get: vi.fn(),
    create: vi.fn(),
    authorize: vi.fn(),
    unauthorize: vi.fn(),
    checkIsAuthorized: vi.fn(),
    getAllTasks: vi.fn(),
    update: vi.fn(),
    init: vi.fn(),
  };
};

describe('Task', () => {
  let mockRemote: Remote;

  beforeEach(() => {
    mockRemote = createMockRemote('gtask');
  });

  describe('constructor', () => {
    it('should create a task with required parameters', () => {
      const task = new Task('Test Task', mockRemote, 'task-123');

      expect(task.title).toBe('Test Task');
      expect(task.remote).toBe(mockRemote);
      expect(task.identifier).toBe('task-123');
      expect(task.completed).toBe(false);
      expect(task.dueDate).toBeUndefined();
      expect(task.updatedAt).toBeDefined();
    });

    it('should create a completed task when completed is true', () => {
      const task = new Task('Completed Task', mockRemote, 'task-456', true);

      expect(task.title).toBe('Completed Task');
      expect(task.completed).toBe(true);
    });

    it('should create a task with due date', () => {
      const dueDate = '2024-01-15';
      const task = new Task('Task with Due Date', mockRemote, 'task-789', false, dueDate);

      expect(task.dueDate).toBe(dueDate);
    });

    it('should create a task with custom updatedAt', () => {
      const customUpdatedAt = '2024-01-01T00:00:00.000Z';
      const task = new Task('Task with Custom UpdatedAt', mockRemote, 'task-999', false, undefined, customUpdatedAt);

      expect(task.updatedAt).toBe(customUpdatedAt);
    });
  });

  describe('fromLineMeta', () => {
    it('should create a task from TaskLineMeta', () => {
      const meta: TaskLineMeta = {
        title: 'Task from Meta',
        platform: 'gtask',
        identifier: 'meta-task-123',
        completed: true,
        dueDate: '2024-02-01',
      };

      const task = Task.fromLineMeta(meta, mockRemote);

      expect(task.title).toBe('Task from Meta');
      expect(task.remote).toBe(mockRemote);
      expect(task.identifier).toBe('meta-task-123');
      expect(task.completed).toBe(true);
      expect(task.dueDate).toBe('2024-02-01');
    });

    it('should create a task from TaskLineMeta without due date', () => {
      const meta: TaskLineMeta = {
        title: 'Task without Due Date',
        platform: 'todoist',
        identifier: 'todoist-task-456',
        completed: false,
      };

      const task = Task.fromLineMeta(meta, mockRemote);

      expect(task.title).toBe('Task without Due Date');
      expect(task.completed).toBe(false);
      expect(task.dueDate).toBeUndefined();
    });
  });

  describe('setTitle', () => {
    it('should update the task title', () => {
      const task = new Task('Original Title', mockRemote, 'task-123');

      task.setTitle('Updated Title');

      expect(task.title).toBe('Updated Title');
    });
  });

  describe('setCompleted', () => {
    it('should update the task completion status', () => {
      const task = new Task('Test Task', mockRemote, 'task-123', false);

      task.setCompleted(true);
      expect(task.completed).toBe(true);

      task.setCompleted(false);
      expect(task.completed).toBe(false);
    });
  });

  describe('setDueDate', () => {
    it('should set a due date', () => {
      const task = new Task('Test Task', mockRemote, 'task-123');
      const dueDate = '2024-03-15';

      task.setDueDate(dueDate);

      expect(task.dueDate).toBe(dueDate);
    });

    it('should clear due date when undefined is passed', () => {
      const task = new Task('Test Task', mockRemote, 'task-123', false, '2024-01-01');

      task.setDueDate(undefined);

      expect(task.dueDate).toBeUndefined();
    });
  });

  describe('setUpdatedAt', () => {
    it('should update the updatedAt timestamp', () => {
      const task = new Task('Test Task', mockRemote, 'task-123');
      const newTimestamp = '2024-01-01T12:00:00.000Z';

      task.setUpdatedAt(newTimestamp);

      expect(task.updatedAt).toBe(newTimestamp);
    });
  });

  describe('toMarkdown', () => {
    it('should generate markdown for incomplete task without due date', () => {
      const task = new Task('Simple Task', mockRemote, 'task-123');

      const markdown = task.toMarkdown();

      expect(markdown).toBe('- [ ] Simple Task  <!-- task:gtask:task-123 -->');
    });

    it('should generate markdown for completed task', () => {
      const task = new Task('Completed Task', mockRemote, 'task-456', true);

      const markdown = task.toMarkdown();

      expect(markdown).toBe('- [x] Completed Task  <!-- task:gtask:task-456 -->');
    });

    it('should generate markdown for task with due date', () => {
      const task = new Task('Task with Due Date', mockRemote, 'task-789', false, '2024-01-15');

      const markdown = task.toMarkdown();

      expect(markdown).toBe('- [ ] Task with Due Date  [due::2024-01-15] <!-- task:gtask:task-789 -->');
    });

    it('should generate markdown for completed task with due date', () => {
      const task = new Task('Completed Task with Due Date', mockRemote, 'task-999', true, '2024-02-01');

      const markdown = task.toMarkdown();

      expect(markdown).toBe('- [x] Completed Task with Due Date  [due::2024-02-01] <!-- task:gtask:task-999 -->');
    });

    it('should generate markdown with different remote platform', () => {
      const todoistRemote = createMockRemote('todoist');
      const task = new Task('Todoist Task', todoistRemote, 'todoist-123');

      const markdown = task.toMarkdown();

      expect(markdown).toBe('- [ ] Todoist Task  <!-- task:todoist:todoist-123 -->');
    });
  });

  describe('getIdentifier', () => {
    it('should return the task identifier', () => {
      const task = new Task('Test Task', mockRemote, 'unique-task-id');

      const identifier = task.getIdentifier();

      expect(identifier).toBe('unique-task-id');
    });
  });
});
