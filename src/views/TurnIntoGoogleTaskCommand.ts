import { Plugin } from 'obsidian';

export function registerTurnIntoGoogleTaskCommand(plugin: Plugin) {
	plugin.addCommand({
		id: 'turn-into-google-task',
		name: 'Turn into Google Task',
		callback: () => {
			console.log('🧪 Turn into Google Task 명령 실행');
		},
	});
}
