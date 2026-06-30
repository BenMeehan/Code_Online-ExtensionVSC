const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const defaultApiUrl = 'https://load-balancer-1l8h.onrender.com';

let outputChannel;
let statusBarItem;
let extensionMap = {};
let languageNames = {};

// Fallback extension map (used before server fetch completes)
const fallbackExtensionMap = {
	'.asm': 'asm', '.c': 'c', '.cpp': 'cpp', '.cs': 'cs',
	'.d': 'd', '.erl': 'erl', '.exs': 'ex', '.f90': 'f90',
	'.go': 'go', '.groovy': 'groovy', '.hs': 'hs',
	'.java': 'java', '.js': 'js', '.kts': 'kt', '.lua': 'lua',
	'.ml': 'ml', '.pas': 'pas', '.php': 'php', '.pl': 'pl',
	'.pro': 'pro', '.py': 'py', '.R': 'r', '.rb': 'rb',
	'.rkt': 'rkt', '.rs': 'rs', '.scala': 'scala', '.sh': 'sh',
	'.ts': 'ts'
};

function activate(context) {
	outputChannel = vscode.window.createOutputChannel('Run Code Online');
	outputChannel.appendLine('Run Code Online — activated');

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.command = 'codeonline.run';
	statusBarItem.text = '$(play) Run Code';
	statusBarItem.tooltip = 'Run current file with Code Online';
	context.subscriptions.push(statusBarItem);

	fetchLanguages();

	const runCommand = vscode.commands.registerCommand('codeonline.run', async () => {
		await runCode(null);
	});
	context.subscriptions.push(runCommand);

	const runWithInputCommand = vscode.commands.registerCommand('codeonline.runWithInput', async () => {
		await runCode('input');
	});
	context.subscriptions.push(runWithInputCommand);

	const runNoInputCommand = vscode.commands.registerCommand('codeonline.runNoInput', async () => {
		await runCode('none');
	});
	context.subscriptions.push(runNoInputCommand);

	updateStatusBar();

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(() => updateStatusBar())
	);
}

async function fetchLanguages() {
	const config = vscode.workspace.getConfiguration('codeOnline');
	const apiUrl = config.get('apiUrl', defaultApiUrl);

	try {
		const response = await axios.get(`${apiUrl}/languages?detail=true`, { timeout: 5000 });
		if (response.data) {
			languageNames = {};
			extensionMap = {};
			for (const [key, info] of Object.entries(response.data)) {
				languageNames[key] = info.name;
				if (info.extension) {
					extensionMap[info.extension] = key;
				}
			}
			outputChannel.appendLine(`Loaded ${Object.keys(languageNames).length} languages from server.`);
		}
	} catch (err) {
		outputChannel.appendLine(`Could not fetch languages: ${err.message} (using fallback map)`);
		extensionMap = Object.assign({}, fallbackExtensionMap);
		for (const key of Object.values(extensionMap)) {
			if (!languageNames[key]) languageNames[key] = key.toUpperCase();
		}
	}
}

function updateStatusBar() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const ext = path.extname(editor.document.fileName);
		const langKey = extensionMap[ext];
		if (langKey && languageNames[langKey]) {
			statusBarItem.text = `$(play) Run ${languageNames[langKey]}`;
			statusBarItem.tooltip = `Run this ${languageNames[langKey]} file with Code Online`;
		} else {
			statusBarItem.text = '$(play) Run Code';
			statusBarItem.tooltip = 'Run current file with Code Online';
		}
		statusBarItem.show();
	} else {
		statusBarItem.hide();
	}
}

function formatOutput(output, language, input) {
	const config = vscode.workspace.getConfiguration('codeOnline');
	const showHeader = config.get('showHeader', true);
	if (!showHeader) return output;

	const langName = languageNames[language] || language;
	const lines = [];
	lines.push(`Language: ${langName}`);
	if (input) lines.push(`Input:    ${input.replace(/\n/g, '\\n')}`);
	lines.push('');
	lines.push('─'.repeat(60));
	lines.push(output);
	lines.push('─'.repeat(60));
	return lines.join('\n');
}

function getStatusMessage(output) {
	if (output.startsWith('[COMPILE ERROR]')) return 'Compilation failed. Check output.';
	if (output.startsWith('[RUNTIME ERROR]')) return 'Runtime error. Check output.';
	if (output.startsWith('[TIME LIMIT EXCEEDED]')) return 'Time limit exceeded.';
	return 'Code executed successfully.';
}

async function runCode(inputMode) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showWarningMessage('No active editor. Open a code file first.');
		return;
	}

	const filePath = editor.document.uri.fsPath;
	const fileExt = path.extname(filePath);
	const language = extensionMap[fileExt];

	if (!language) {
		const supported = Object.keys(extensionMap).join(', ');
		vscode.window.showErrorMessage(
			`Unsupported file extension "${fileExt}".\nSupported: ${supported}`
		);
		return;
	}

	const config = vscode.workspace.getConfiguration('codeOnline');
	const apiUrl = config.get('apiUrl', defaultApiUrl);
	const analyze = config.get('analyze', false);

	if (editor.document.isDirty) {
		await editor.document.save();
	}

	const code = editor.document.getText();
	const langName = languageNames[language] || language;

	let input = '';
	if (inputMode === 'none') {
		// No input — skip
	} else if (inputMode === 'input') {
		// Direct input dialog
		input = await vscode.window.showInputBox({
			placeHolder: 'Enter input for your program (stdin)',
			prompt: 'Leave empty for no input, or type the input data'
		});
		if (input === undefined) return;
	} else {
		// Default: show quick pick
		const inputChoice = await vscode.window.showQuickPick(
			[
				{ label: '$(keyboard) Enter custom input', description: 'Type stdin input for your program' },
				{ label: '$(file) Read from input.txt', description: 'Use input.txt from the file directory' },
				{ label: '$(circle-slash) No input', description: 'Run without any input data' }
			],
			{ placeHolder: 'Provide input for the program?' }
		);

		if (!inputChoice) return;

		if (inputChoice.label.includes('Enter custom input')) {
			input = await vscode.window.showInputBox({
				placeHolder: 'Enter input for your program (stdin)',
				prompt: 'Leave empty for no input, or type the input data'
			});
			if (input === undefined) return;
		} else if (inputChoice.label.includes('Read from input.txt')) {
			const inputFile = path.join(path.dirname(filePath), 'input.txt');
			try {
				if (fs.existsSync(inputFile)) {
					input = fs.readFileSync(inputFile, { encoding: 'utf-8' });
				} else {
					vscode.window.showWarningMessage('input.txt not found. Running without input.');
				}
			} catch (err) {
				vscode.window.showWarningMessage(`Could not read input.txt: ${err.message}`);
			}
		}
	}

	outputChannel.clear();
	outputChannel.show(true);
	outputChannel.appendLine(`Running ${langName} code${analyze ? ' with AI analysis' : ''}...`);

	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: `Running ${langName} code${analyze ? ' (with AI analysis)' : ''}...`,
			cancellable: false
		},
		async () => {
			try {
				const response = await axios.post(
					`${apiUrl}/compile`,
					{
						code,
						language,
						input: input || '',
						analyze
					},
					{
						headers: { 'Content-Type': 'application/json' },
						timeout: 60000
					}
				);

				const rawOutput = response.data;
				const displayOutput = formatOutput(rawOutput, language, input);
				outputChannel.appendLine(displayOutput);

				const outputFile = filePath.substring(0, filePath.lastIndexOf('.')) + '-output.txt';
				fs.writeFileSync(outputFile, rawOutput);

				vscode.window.showInformationMessage(getStatusMessage(rawOutput));
			} catch (error) {
				let message = 'Failed to run code.';
				if (error.response) {
					const status = error.response.status;
					const data = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
					outputChannel.appendLine(`[Server Error ${status}] ${data}`);
					message = `Server error (${status}). Check output for details.`;
				} else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
					outputChannel.appendLine(`[Connection Error] Cannot reach ${apiUrl}`);
					message = 'Cannot reach the Code Online server. Check your connection.';
				} else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
					outputChannel.appendLine(`[Timeout] Request to ${apiUrl} timed out.`);
					message = 'Request timed out. The server may be busy.';
				} else {
					outputChannel.appendLine(`[Error] ${error.message}`);
					message = `Error: ${error.message}`;
				}
				vscode.window.showErrorMessage(message);
			}
		}
	);
}

function deactivate() {
	if (outputChannel) outputChannel.dispose();
	if (statusBarItem) statusBarItem.dispose();
}

module.exports = { activate, deactivate };
