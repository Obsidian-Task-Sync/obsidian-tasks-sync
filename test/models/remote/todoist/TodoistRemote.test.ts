import { todoistIdentifierSchema, TodoistRemote } from 'src/models/remote/todoist/TodoistRemote';
import { TodoistSettingsData } from 'src/models/remote/todoist/TodoistSettingTab';
import { Task } from 'src/models/Task';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Todoist API
const mockTodoistApi = {
  getTasks: vi.fn(),
  getTask: vi.fn(),
  addTask: vi.fn(),
  updateTask: vi.fn(),
  closeTask: vi.fn(),
  reopenTask: vi.fn(),
  getProjects: vi.fn(),
};

vi.mock('@doist/todoist-api-typescript', () => ({
  TodoistApi: vi.fn().mockImplementation(() => mockTodoistApi),
}));

// Mock TurnIntoTodoistCommand
vi.mock('src/models/remote/todoist/TurnIntoTodoistCommand', () => ({
  registerTurnIntoTodoistCommand: vi.fn(),
}));

describe('TodoistRemote', () => {
  let todoistRemote: TodoistRemote;
  let mockApp: any;
  let mockPlugin: any;
  let mockSettings: TodoistSettingsData;

  beforeEach(() => {
    mockApp = {
      vault: {
        getFileByPath: vi.fn(),
      },
      loadLocalStorage: vi.fn(),
      saveLocalStorage: vi.fn(),
    };

    mockPlugin = {
      updateSettings: vi.fn(),
      addCommand: vi.fn(),
    };

    mockSettings = {
      todoistApiToken: 'test-api-token',
    };

    todoistRemote = new TodoistRemote(mockApp, mockPlugin, mockSettings);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create TodoistRemote with correct properties', () => {
      expect(todoistRemote.id).toBe('todoist');
      expect(todoistRemote.name).toBe('Todoist');
      expect(todoistRemote.settingTab).toBeDefined();
    });
  });

  describe('init', () => {
    it('should initialize when API token is provided', async () => {
      await todoistRemote.init();

      expect(todoistRemote['_client']).toBeDefined();
    });

    it('should not initialize when API token is missing', async () => {
      const remoteWithoutToken = new TodoistRemote(mockApp, mockPlugin, {
        todoistApiToken: null,
      });

      await remoteWithoutToken.init();

      expect(remoteWithoutToken['_client']).toBeUndefined();
    });
  });

  describe('authorization methods', () => {
    it('should authorize when API token is set', async () => {
      await todoistRemote.authorize();
      // Should not throw error when API token is available
    });

    it('should throw error when API token is not set', async () => {
      const remoteWithoutToken = new TodoistRemote(mockApp, mockPlugin, {
        todoistApiToken: null,
      });

      await expect(remoteWithoutToken.authorize()).rejects.toThrow('Todoist API token is not set');
    });

    it('should return true when API token is available', async () => {
      const result = await todoistRemote.checkIsAuthorized();
      expect(result).toBe(true);
    });

    it('should return false when API token is not available', async () => {
      const remoteWithoutToken = new TodoistRemote(mockApp, mockPlugin, {
        todoistApiToken: null,
      });

      const result = await remoteWithoutToken.checkIsAuthorized();
      expect(result).toBe(false);
    });

    it('should handle unauthorize', async () => {
      await todoistRemote.unauthorize();
      // Should not throw error
    });
  });

  describe('assure', () => {
    it('should return client when initialized', async () => {
      await todoistRemote.init();

      const client = await todoistRemote['assure']();

      expect(client).toBeDefined();
    });

    it('should throw error when not initialized', async () => {
      await expect(todoistRemote['assure']()).rejects.toThrow(
        'Todoist API client is not initialized. Please check the API token in the settings.',
      );
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      await todoistRemote.init();
    });

    it('should get task successfully', async () => {
      const mockTaskData = {
        id: 'task-123',
        content: 'Test Task',
        completedAt: null,
        due: { date: '2024-01-15' },
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockTodoistApi.getTask.mockResolvedValue(mockTaskData);

      const task = await todoistRemote.get('task-123');

      expect(mockTodoistApi.getTask).toHaveBeenCalledWith('task-123');
      expect(task.title).toBe('Test Task');
      expect(task.completed).toBe(false);
      expect(task.dueDate).toBe('2024-01-15');
      expect(task.identifier).toBe('task-123');
    });

    it('should handle completed task', async () => {
      const mockTaskData = {
        id: 'task-456',
        content: 'Completed Task',
        completedAt: '2024-01-01T00:00:00Z',
        due: null,
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockTodoistApi.getTask.mockResolvedValue(mockTaskData);

      const task = await todoistRemote.get('task-456');

      expect(task.completed).toBe(true);
      expect(task.dueDate).toBeUndefined();
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await todoistRemote.init();
    });

    it('should update task successfully', async () => {
      const task = new Task('Updated Task', todoistRemote, 'task-123', true, '2024-01-15');

      mockTodoistApi.updateTask.mockResolvedValue({});
      mockTodoistApi.closeTask.mockResolvedValue({});

      await todoistRemote.update('task-123', task);

      expect(mockTodoistApi.updateTask).toHaveBeenCalledWith('task-123', {
        content: 'Updated Task',
        dueString: '2024-01-15',
      });
      expect(mockTodoistApi.closeTask).toHaveBeenCalledWith('task-123');
    });

    it('should handle task without due date', async () => {
      const task = new Task('Task without Due', todoistRemote, 'task-123', false);

      mockTodoistApi.updateTask.mockResolvedValue({});
      mockTodoistApi.reopenTask.mockResolvedValue({});

      await todoistRemote.update('task-123', task);

      expect(mockTodoistApi.updateTask).toHaveBeenCalledWith('task-123', {
        content: 'Task without Due',
      });
      expect(mockTodoistApi.reopenTask).toHaveBeenCalledWith('task-123');
    });

    it('should handle incomplete task', async () => {
      const task = new Task('Incomplete Task', todoistRemote, 'task-123', false, '2024-01-15');

      mockTodoistApi.updateTask.mockResolvedValue({});
      mockTodoistApi.reopenTask.mockResolvedValue({});

      await todoistRemote.update('task-123', task);

      expect(mockTodoistApi.reopenTask).toHaveBeenCalledWith('task-123');
    });
  });

  describe('create', () => {
    beforeEach(async () => {
      await todoistRemote.init();
    });

    it('should create task successfully', async () => {
      const mockCreatedTask = {
        id: 'new-task-123',
        content: 'New Task',
        completedAt: null,
        due: { date: '2024-01-15' },
      };

      mockTodoistApi.addTask.mockResolvedValue(mockCreatedTask);

      const task = await todoistRemote.create('New Task', '2024-01-15');

      expect(mockTodoistApi.addTask).toHaveBeenCalledWith({
        content: 'New Task',
        dueString: '2024-01-15',
      });
      expect(task.title).toBe('New Task');
      expect(task.identifier).toBe('new-task-123');
      expect(task.dueDate).toBe('2024-01-15');
    });

    it('should create task without due date', async () => {
      const mockCreatedTask = {
        id: 'new-task-456',
        content: 'Task without Due',
        completedAt: null,
        due: null,
      };

      mockTodoistApi.addTask.mockResolvedValue(mockCreatedTask);

      const task = await todoistRemote.create('Task without Due');

      expect(mockTodoistApi.addTask).toHaveBeenCalledWith({
        content: 'Task without Due',
      });
      expect(task.dueDate).toBeUndefined();
    });
  });

  describe('getAllTasks', () => {
    beforeEach(async () => {
      await todoistRemote.init();
    });

    it('should get all tasks successfully', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          content: 'Task 1',
          completedAt: null,
          due: { date: '2024-01-15' },
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'task-2',
          content: 'Task 2',
          completedAt: '2024-01-02T00:00:00Z',
          due: null,
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ];

      mockTodoistApi.getTasks.mockResolvedValue({
        results: mockTasks,
      });

      const tasks = await todoistRemote.getAllTasks();

      expect(mockTodoistApi.getTasks).toHaveBeenCalled();
      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[0].identifier).toBe('task-1');
      expect(tasks[0].completed).toBe(false);
      expect(tasks[1].title).toBe('Task 2');
      expect(tasks[1].identifier).toBe('task-2');
      expect(tasks[1].completed).toBe(true);
    });
  });

  describe('getProjects', () => {
    beforeEach(async () => {
      await todoistRemote.init();
    });

    it('should get projects successfully', async () => {
      const mockProjects = [
        { id: 'project-1', name: 'Project 1' },
        { id: 'project-2', name: 'Project 2' },
      ];

      mockTodoistApi.getProjects.mockResolvedValue(mockProjects);

      const projects = await todoistRemote.getProjects();

      expect(mockTodoistApi.getProjects).toHaveBeenCalled();
      expect(projects).toEqual(mockProjects);
    });
  });

  describe('getTasks with projectId', () => {
    beforeEach(async () => {
      await todoistRemote.init();
    });

    it('should get tasks for specific project', async () => {
      const mockTasks = [
        { id: 'task-1', content: 'Task 1' },
        { id: 'task-2', content: 'Task 2' },
      ];

      mockTodoistApi.getTasks.mockResolvedValue({
        results: mockTasks,
      });

      const tasks = await todoistRemote.getTasks('project-123');

      expect(mockTodoistApi.getTasks).toHaveBeenCalledWith({ projectId: 'project-123' });
      expect(tasks.results).toEqual(mockTasks);
    });

    it('should get all tasks when no projectId provided', async () => {
      const mockTasks = [
        { id: 'task-1', content: 'Task 1' },
        { id: 'task-2', content: 'Task 2' },
      ];

      mockTodoistApi.getTasks.mockResolvedValue({
        results: mockTasks,
      });

      const tasks = await todoistRemote.getTasks();

      expect(mockTodoistApi.getTasks).toHaveBeenCalledWith({});
      expect(tasks.results).toEqual(mockTasks);
    });
  });

  describe('dispose', () => {
    it('should throw error when dispose is called', () => {
      expect(() => todoistRemote.dispose?.()).toThrow('Method not implemented.');
    });
  });
});

describe('TodoistIdentifier utilities', () => {
  describe('todoistIdentifierSchema', () => {
    it('should parse valid identifier', () => {
      const result = todoistIdentifierSchema.parse('task-123');
      expect(result).toBe('task-123');
    });

    it('should parse empty string', () => {
      const result = todoistIdentifierSchema.parse('');
      expect(result).toBe('');
    });
  });
});
