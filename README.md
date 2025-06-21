# Obsidian Task Sync

A plugin that helps you synchronize your Obsidian tasks with various task management platforms.

## Features

- Bi-directional task synchronization
- Support for multiple task platforms
- Command palette integration for task management
- Real-time status updates
- Markdown-friendly task format

## Supported Platforms

Currently supported platforms:

- [Google Tasks](docs/platform/GTask.md)
- [Todoist](docs/platform/Todoist.md)

Coming soon:

- Microsoft To Do
- Want to add your favorite platform?
  - [Create an issue!](https://github.com/hong-sile/obsidian-tasks-sync/issues)

## Getting Started

1. Install the plugin
2. Choose your preferred task platform
3. Follow the platform-specific setup guide
4. Start syncing your tasks!

## Installation

### 1. Download the Release

1. Visit the [Releases Page](https://github.com/hong-sile/obsidian-tasks-sync/releases) of the repository.
2. Download the latest `obsidian-tasks-sync.zip` file under **Assets**.


### 2. Install into Obsidian

1. Open your Obsidian Vault.
2. Locate the `.obsidian/plugins/` folder in your vault’s directory.
3. Extract the contents of the zip file into a subfolder named `obsidian-tasks-sync`.

```
/YourVault/
└── .obsidian/
    └── plugins/
        └── obsidian-tasks-sync/
            ├── main.js
            └── manifest.json
```

4. Restart Obsidian or go to **Settings → Community Plugins** and enable `Obsidian Tasks Sync`.


### 3. Authorize Your Task Platform

If you're using Google Tasks or Todoist:

* Go to **Settings → Obsidian Tasks Sync**
* Input your Client ID and Client Secret
* Click **Connect to \[Platform]** and follow the login flow

> 🔒 *Each user must register their own credentials for Google or Todoist due to quota and security reasons.*


### 4. Start Using the Plugin

Use the Command Palette (`Cmd+P` or `Ctrl+P`) to:

* `Turn into Google Task`
* `Sync from Remote`

Tasks will be synced in both directions once authorized.


### Optional: Customize or Update

* You can replace the plugin folder with a newer release anytime.
* For developers, see the [Development Guide](https://github.com/hong-sile/obsidian-tasks-sync/wiki/Development-Guide) if you'd like to build from source.

## How to use

Creating Task

- Write your task in Obsidian using the standard checkbox format
- Use the command palette (Cmd/Ctrl + P) and select "Turn into Google Task" or "Turn into Todoist Task"
- The task will be created on the selected platform and synced automatically

Syncing Changes

- From Obsidian to Remote:
  - Check/uncheck the checkbox
  - Edit the task content
  - Changes are **automatically** synced to the remote platform
- From Remote to Obsidian:
  - Make changes in Google Tasks or Todoist
  - Changes will be reflected in your Obsidian notes
  - "Sync from Remote" button appears when remote changes are detected

![example](docs/images/usages.png)

## Contributing

welcome contributions! Whether you want to:

- Add support for a new task platform
- Fix bugs or improve existing features
- Enhance documentation

Check out our [Contributing Guide](docs/contributing.md) to get started.

## Task Format

```markdown
- [ ] Task Title <!--platform:taskId:additional-info-->
```

See platform-specific documentation for detailed format information.

## Documentation

- [Contributing Guidelines](docs/contributing.md)
- Supported Platforms:
  - [Google Tasks](docs/platform/GTask.md)
  - [Todoist](docs/platform/todoist.md)

## 📦 Using the Release in Your Obsidian Vault

This guide explains how to download and install a published release of **Obsidian Tasks Sync** into your own Obsidian vault — no development or build setup required.
