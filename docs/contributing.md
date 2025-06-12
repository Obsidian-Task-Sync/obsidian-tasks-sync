# 🤝 Contributing Guide

Thank you for contributing to this project! Please follow these guidelines for effective collaboration.

---

## 🧾 1. Feature Requests

- Use the templates provided in `.github/ISSUE_TEMPLATE/`
- Clearly describe:
  - Purpose of the feature
  - Problem it solves
  - Implementation ideas

---

## 🛠 2. Pull Request Guidelines

- Feature PRs must have a preceding issue
- Commit messages must include the issue number
  > Example: `resolve #23: Add duplicate request prevention during sync`
- All PRs must include:
  - Code documentation
  - Test code or manual testing instructions
  - README/Wiki documentation updates

---

## 🧪 3. Review Process

- Requires at least 1 reviewer's approval
- No direct pushes to `main` branch allowed

---

## 📦 4. Adding New Task Platform Integration

### Directory Structure

New platform integrations should follow this structure:

```
src/
  models/
    remote/
      {platform}/                         # e.g. gtask/, todoist/
        {platform}Remote.ts               # main integration class
        {platform}Settings.ts             # platform-specific Settings
        TurnInto{platform}Command.ts      # insert into platforms
```

### Implementation Requirements

1. Create a new class implementing the Remote interface:

```typescript
export interface Remote {
  id: string; // unique identifier for the platform
  settingTab: RemoteSettingPanel; // settings UI panel
  get(id: string): Promise<Task>; // fetch a task by ID
  update(id: string, from: Task): Promise<void>; // update existing task
  create(title: string, args?: Record<string, string>): Promise<Task>; // create new task
  authorize(): Promise<void>; // handle authorization
  unauthorize(): Promise<void>; // handle deauthorization
  checkIsAuthorized(): Promise<boolean>; // check auth status
  init(): Promise<void>; // initialize platform
  dispose?(): void; // cleanup resources
}
```

2. Implement RemoteSettingPanel for platform configuration:

```typescript
export abstract class RemoteSettingPanel<TData extends object = object> {
  // Handles platform-specific settings UI and data management
}
```

3. Required Files:

- `README.md` explaining platform-specific setup
- (Optinoal) Test files covering core functionality
- Type definitions for platform API responses

---

## 🔍 Review Checklist for Platform Integrations

- [ ] Follows directory structure
- [ ] Implements all required interface methods
- [ ] Has proper error handling
- [ ] Provides documentation(add README.md)
- [ ] Handles authorization securely
- [ ] Uses TypeScript types properly
