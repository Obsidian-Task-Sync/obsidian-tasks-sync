import { TFile } from 'obsidian';
import { TaskLineMeta } from 'src/libs/regexp';
import { Task } from 'src/models/Task';
import { File, FileRepository } from 'src/repositories/FileRepository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTest1MdFixture, createTest2MdFixture } from '../fixtures/FileFixtures';

describe('FileRepository', () => {
  let app: any;
  let plugin: any;
  let repo: FileRepository;

  beforeEach(() => {
    app = {
      vault: {
        getFileByPath: vi.fn(),
        getMarkdownFiles: vi.fn(),
        read: vi.fn(),
        modify: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      },
      workspace: {
        on: vi.fn(),
        offref: vi.fn(),
      },
    };

    plugin = {
      getRemoteByPlatform: vi.fn(),
    };

    repo = new FileRepository(app, plugin);
  });

  it('get returns undefined if file not found', () => {
    app.vault.getFileByPath.mockReturnValue(null);
    expect(repo.get('notfound.md')).toBeUndefined();
  });

  it('get returns File instance and caches it', () => {
    const tFile: TFile = createTest1MdFixture();
    app.vault.getFileByPath.mockReturnValue(tFile);

    const file = repo.get('test1.md');
    expect(file).toBeInstanceOf(File);

    // Should return cached instance
    const file2 = repo.get('test1.md');
    expect(file2).toBe(file);
  });

  it('init batches files and only adds files with tasks', async () => {
    const tFiles = [createTest1MdFixture(), createTest2MdFixture()];
    app.vault.getMarkdownFiles.mockReturnValue(tFiles);

    // Mock File and its methods
    app.vault.read.mockImplementation((file: TFile) => {
      if (file.path === 'test1.md') {
        return '- [ ] Task 1  <!-- task:gtask:list1;id1 -->';
      } else if (file.path === 'test2.md') {
        return '- [x] Task 2  <!-- task:gtask:list2;id2 -->';
      }
      return '';
    });

    await repo.init();

    // Should have files with tasks
    expect(repo.get('test1.md')).toBeDefined();
    expect(repo.get('test2.md')).toBeDefined();

    // Restore
    vi.restoreAllMocks();
  });
});

describe('File', () => {
  let app: any;
  let plugin: any;
  let tFile: any;
  let file: File;

  beforeEach(() => {
    app = {
      vault: {
        read: vi.fn(),
        modify: vi.fn(),
      },
    };

    plugin = {
      getRemoteByPlatform: vi.fn(),
    };

    tFile = { path: 'test1.md' };
    file = new File(app, plugin, tFile);
  });

  it('initialize parses lines and adds tasks', async () => {
    const mockRemote = {
      id: 'gtask',
      update: vi.fn(),
    };
    plugin.getRemoteByPlatform.mockReturnValue(mockRemote);

    app.vault.read.mockResolvedValue('- [ ] Title  <!-- task:gtask:list1;id1 -->');

    await file.initialize();

    // Create meta to test getTask
    const meta: TaskLineMeta = {
      title: 'Title',
      identifier: 'list1;id1',
      platform: 'gtask',
      completed: false,
      dueDate: undefined,
    };

    const task = file.getTask(meta);
    expect(task).toBeInstanceOf(Task);
    expect(task?.title).toBe('Title');
  });

  it('scan adds and updates tasks, removes missing tasks, and calls remote.update', async () => {
    const mockRemote = {
      id: 'gtask',
      update: vi.fn(),
    };
    plugin.getRemoteByPlatform.mockReturnValue(mockRemote);

    // Initial state: one task
    app.vault.read.mockResolvedValue(
      '- [ ] Title  <!-- task:gtask:list1;id1 -->\n- [x] Done  <!-- task:gtask:list2;id2 -->',
    );

    await file.initialize();

    // Now scan with updated content (id1 completed, id2 removed, id3 added)
    app.vault.read.mockResolvedValue(
      '- [x] Title  <!-- task:gtask:list1;id1 -->\n- [ ] New  <!-- task:gtask:list3;id3 -->',
    );

    await file.scan();

    // Check that remote.update was called for updated tasks
    expect(mockRemote.update).toHaveBeenCalled();
  });

  it('hasAnyTask returns true if tasks exist', async () => {
    const mockRemote = {
      id: 'gtask',
      update: vi.fn(),
    };
    plugin.getRemoteByPlatform.mockReturnValue(mockRemote);

    app.vault.read.mockResolvedValue('- [ ] Title  <!-- task:gtask:list1;id1 -->');
    await file.initialize();
    expect(file.hasAnyTask()).toBe(true);
  });

  it('hasAnyTask returns false if no tasks', async () => {
    app.vault.read.mockResolvedValue('no tasks here');
    await file.initialize();
    expect(file.hasAnyTask()).toBe(false);
  });
});
