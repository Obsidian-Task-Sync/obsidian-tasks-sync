import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerTurnIntoGoogleTaskCommand } from '../../src/commands/TurnIntoGoogleTaskCommand';

describe('registerTurnIntoGoogleTaskCommand', () => {
  let plugin: any;
  let remote: any;
  let editor: any;
  let view: any;

  beforeEach(() => {
    plugin = {
      addCommand: vi.fn(),
    };
    remote = {
      create: vi.fn(),
    };
    editor = {
      getSelection: vi.fn(),
      replaceSelection: vi.fn(),
    };
    view = {};
  });

  it('should create a google task and replace selection', async () => {
    editor.getSelection.mockReturnValue('My Task');
    const fakeTask = { toMarkdown: () => '- [ ] [My Task](gtask:id:list)' };
    remote.create.mockResolvedValue(fakeTask);

    registerTurnIntoGoogleTaskCommand(plugin, remote);
    const call = plugin.addCommand.mock.calls[0][0];
    await call.editorCallback(editor, view);

    expect(remote.create).toHaveBeenCalledWith('My Task', '@default');
    expect(editor.replaceSelection).toHaveBeenCalledWith('- [ ] [My Task](gtask:id:list)');
  });

  it('should show error notice if remote.create throws', async () => {
    editor.getSelection.mockReturnValue('My Task');
    remote.create.mockRejectedValue(new Error('fail'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    registerTurnIntoGoogleTaskCommand(plugin, remote);
    const call = plugin.addCommand.mock.calls[0][0];
    await call.editorCallback(editor, view);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
