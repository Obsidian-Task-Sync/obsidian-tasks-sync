import { TFile } from 'obsidian';

export function createTest1MdFixture(): TFile {
  return {
    path: 'test1.md',
    stat: { ctime: 0, mtime: 0, size: 0 },
    basename: 'test1',
    extension: 'md',
    vault: {} as any,
    name: 'test1.md',
    parent: {} as any,
  };
}

export function createTest2MdFixture(): TFile {
  return {
    path: 'test2.md',
    stat: { ctime: 0, mtime: 0, size: 0 },
    basename: 'test2',
    extension: 'md',
    vault: {} as any,
    name: 'test2.md',
    parent: {} as any,
  };
}
