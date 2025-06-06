import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskController } from '../../src/controllers/TaskController';

vi.mock('es-toolkit', () => ({
  debounce: (fn: any) => fn,
}));

describe('TaskController', () => {
  let app: any;
  let fileRepo: any;
  let controller: TaskController;
  let mockScan: any;
  it('should not call scan if file is null on file-open event', async () => {
    let fileOpenCallback: any;
    app.workspace.on.mockImplementation((event, cb) => {
      fileOpenCallback = cb;
      return 'fileOpenEventRef';
    });
    app.vault.on.mockReturnValue('fileSaveEventRef');
    controller.init();

    await fileOpenCallback(null);

    expect(fileRepo.get).not.toHaveBeenCalled();
    expect(mockScan).not.toHaveBeenCalled();
  });
  beforeEach(() => {
    mockScan = vi.fn();
    fileRepo = {
      get: vi.fn(() => ({ scan: mockScan })),
    };

    app = {
      workspace: {
        on: vi.fn(),
        offref: vi.fn(),
      },
      vault: {
        on: vi.fn(),
      },
    };

    controller = new TaskController(app, fileRepo);
  });

  it('should register file-open and modify events on init', () => {
    app.workspace.on.mockReturnValue('fileOpenEventRef');
    app.vault.on.mockReturnValue('fileSaveEventRef');

    controller.init();

    expect(app.workspace.on).toHaveBeenCalledWith('file-open', expect.any(Function));
    expect(app.vault.on).toHaveBeenCalledWith('modify', expect.any(Function));
  });

  it('should call scan on fileRepo when file-open event fires', async () => {
    let fileOpenCallback: any;
    app.workspace.on.mockImplementation((event, cb) => {
      fileOpenCallback = cb;
      return 'fileOpenEventRef';
    });
    app.vault.on.mockReturnValue('fileSaveEventRef');
    controller.init();

    const file = { path: 'test.md' };
    await fileOpenCallback(file);

    expect(fileRepo.get).toHaveBeenCalledWith('test.md');
    expect(mockScan).toHaveBeenCalled();
  });

  it('should call scan on fileRepo when modify event fires', async () => {
    let modifyCallback: any;
    app.workspace.on.mockReturnValue('fileOpenEventRef');
    app.vault.on.mockImplementation((event, cb) => {
      modifyCallback = cb;
      return 'fileSaveEventRef';
    });
    controller.init();

    const file = { path: 'test2.md' };
    await modifyCallback(file);

    expect(fileRepo.get).toHaveBeenCalledWith('test2.md');
    expect(mockScan).toHaveBeenCalled();
  });

  it('should remove event listeners on dispose', () => {
    app.workspace.on.mockReturnValue('fileOpenEventRef');
    app.vault.on.mockReturnValue('fileSaveEventRef');
    controller.init();

    controller.dispose();

    // The abort event should trigger offref for both events
    expect(app.workspace.offref).toHaveBeenCalledWith('fileOpenEventRef');
    expect(app.workspace.offref).toHaveBeenCalledWith('fileSaveEventRef');
  });
});
