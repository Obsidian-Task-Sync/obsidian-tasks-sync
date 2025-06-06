import { describe, it, expect } from 'vitest';
import { Task, TaskStatus } from '../../src/models/Task';

// src/modelV/Task.test.ts

describe('Task', () => {
  const id = 'task123';
  const tasklistId = 'list456';
  const title = 'Test Task';
  const status: TaskStatus = 'needsAction';

  it('should construct with given values', () => {
    const task = new Task(id, tasklistId, title, status);
    expect(task.id).toBe(id);
    expect(task.tasklistId).toBe(tasklistId);
    expect(task.title).toBe(title);
    expect(task.status).toBe(status);
  });

  it('setTitle should update the title', () => {
    const task = new Task(id, tasklistId, title, status);
    task.setTitle('New Title');
    expect(task.title).toBe('New Title');
  });

  it('setStatus should update the status', () => {
    const task = new Task(id, tasklistId, title, status);
    task.setStatus('completed');
    expect(task.status).toBe('completed');
  });

  it('toMarkdown should return correct markdown for needsAction', () => {
    const task = new Task(id, tasklistId, title, 'needsAction');
    const expected = `- [ ] [${title}](gtask:${id}:${tasklistId})`;
    expect(task.toMarkdown()).toBe(expected);
  });

  it('toMarkdown should return correct markdown for completed', () => {
    const task = new Task(id, tasklistId, title, 'completed');
    const expected = `- [x] [${title}](gtask:${id}:${tasklistId})`;
    expect(task.toMarkdown()).toBe(expected);
  });

  it('getIdentifier should return id:tasklistId', () => {
    const task = new Task(id, tasklistId, title, status);
    expect(task.getIdentifier()).toBe(`${id}:${tasklistId}`);
  });
});
