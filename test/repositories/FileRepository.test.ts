import * as regexpModule from 'src/libs/regexp';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Remote } from 'src/models/remote/Remote';
import { GTaskMockRemote } from 'src/models/remote/GTask/GTaskMockRemote';
import { TFile } from 'obsidian';
import { FileRepository, File } from 'src/repositories/FileRepository';
import { createTest2MdFixture, createTest1MdFixture } from '../fixtures/FileFixtures';
import { Task } from 'src/models/Task';

describe('FileRepository', () => {
  let app: any;
  let remote: Remote;
  let repo: FileRepository;

  beforeEach(() => {
    app = {
      vault: {
        getFileByPath: vi.fn(),
        getMarkdownFiles: vi.fn(),
        read: vi.fn(),
      },
    };
    remote = new GTaskMockRemote();

    const files = new Map();
    const tFile: TFile = createTest1MdFixture();
    const file = new File(app, remote, tFile);
    files.set('test1.md', file);

    repo = new FileRepository(app, remote, files);
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

  it('initialize batches files and only adds files with tasks', async () => {
    const tFiles = [createTest1MdFixture(), createTest2MdFixture()];
    app.vault.getMarkdownFiles.mockReturnValue(tFiles);

    // Mock File and its methods
    app.vault.read.mockImplementation((file: TFile) => {
      if (file.path === 'test1.md') {
        return '- [ ] [Task 1](gtask:id1:list1)\n';
      } else if (file.path === 'test2.md') {
        return '- [x] [Task 2](gtask:id2:list2)';
      }
      return '';
    });

    await repo.initialize();

    // Should call initialize for each file
    expect(repo.get('test1.md')).toBeDefined();
    expect(repo.get('test2.md')).toBeDefined();

    // Restore
    vi.restoreAllMocks();
  });
});

describe('File', () => {
  let app: any;
  let remote: Remote;
  let tFile: any;
  let file: File;

  beforeEach(() => {
    app = {
      vault: {
        read: vi.fn(),
      },
    };
    remote = {
      get: vi.fn(),
      create: vi.fn(),
      authorize: vi.fn(),
      update: vi.fn(),
    }
    tFile = { path: 'test1.md' };
    file = new File(app, remote, tFile);
  });

  it('initialize parses lines and adds tasks', async () => {
    app.vault.read.mockResolvedValue('- [ ] [Title](gtask:id1:list1)\nnotask');

    await file.initialize();
    expect(file.getTask('id1', 'list1')).toBeInstanceOf(Task);
  });

  it('scan adds and updates tasks, removes missing tasks, and calls remote.update', async () => {
    // Initial state: one task
    app.vault.read.mockResolvedValue('- [ ] [Title](gtask:id1:list1)\n- [x] [Done](gtask:id2:list2)');

    await file.initialize();

    // Now scan with updated content (id1 updated, id2 removed, id3 added)
    app.vault.read.mockResolvedValue('- [x] [Title Updated](gtask:id1:list1)\n- [ ] [New](gtask:id3:list3)');

    await file.scan();

    // id1 should be updated, id2 removed, id3 added
    expect(file.getTask('id1', 'list1')).toBeInstanceOf(Task);
    expect(file.getTask('id3', 'list3')).toBeInstanceOf(Task);
    expect(file.getTask('id2', 'list2')).toBeUndefined();
    expect(remote.update).toHaveBeenCalled();
  });

  it('hasAnyTask returns true if tasks exist', async () => {
    app.vault.read.mockResolvedValue('- [ ] [Title](gtask:id1:list1)');
    await file.initialize();
    expect(file.hasAnyTask()).toBe(true);
  });

  it('hasAnyTask returns false if no tasks', async () => {
    app.vault.read.mockResolvedValue('no tasks here');
    await file.initialize();
    expect(file.hasAnyTask()).toBe(false);
  });
});
