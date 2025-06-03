import { App } from 'obsidian';

export class PersistStorage<T> {
  constructor(
    private app: App,
    private key: string,
    private parser: (value: string) => T,
  ) {}

  async get() {
    const value = this.app.loadLocalStorage(this.key);
    if (value == null) {
      return null;
    }
    return this.parser(value);
  }

  async set(value: T) {
    this.app.saveLocalStorage(this.key, value);
  }
}
