import { SettingTab } from 'obsidian';
import TaskSyncPlugin from 'src/main';
import { Task } from '../Task';

export interface Remote {
  id: string;
  name: string;
  settingTab: RemoteSettingPanel;
  get(id: string): Promise<Task>;
  update(id: string, from: Task): Promise<void>;
  create(title: string, due?: string, args?: Record<string, string>): Promise<Task>;
  authorize(): Promise<void>;
  unauthorize(): Promise<void>;
  checkIsAuthorized(): Promise<boolean>;
  getAllTasks(): Promise<Task[]>;

  init(): Promise<void>;
  dispose?(): void;
}

export abstract class RemoteSettingPanel<TData extends object = object> {
  protected plugin: TaskSyncPlugin;
  protected remote: Remote;
  protected data: TData;
  protected settingTab: SettingTab;
  private container: HTMLElement | null = null;

  get containerEl(): HTMLElement {
    return this.settingTab.containerEl;
  }

  constructor(plugin: TaskSyncPlugin, settings: TData, remote: Remote) {
    this.plugin = plugin;
    this.data = settings;
    this.remote = remote;
  }

  init(settingTab: SettingTab): void {
    this.settingTab = settingTab;
  }

  abstract display(): void;

  update(settings: Partial<TData>) {
    this.plugin.updateSettings(settings);
    this.rerender();
  }

  rerender() {
    this.settingTab.display();
  }

  setContainer(container: HTMLElement) {
    this.container = container;
  }

  protected getContainer(): HTMLElement {
    if (!this.container) throw new Error('Container not set');
    return this.container;
  }
}
