const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const defaultApiUrl = 'https://load-balancer-1l8h.onrender.com';
const tailwindCdn = 'https://cdn.tailwindcss.com';

const fallbackMap = {
	'.asm': 'asm', '.c': 'c', '.cpp': 'cpp', '.cs': 'cs',
	'.d': 'd', '.erl': 'erl', '.exs': 'ex', '.f90': 'f90',
	'.go': 'go', '.groovy': 'groovy', '.hs': 'hs',
	'.java': 'java', '.js': 'js', '.kts': 'kt', '.lua': 'lua',
	'.ml': 'ml', '.pas': 'pas', '.php': 'php', '.pl': 'pl',
	'.pro': 'pro', '.py': 'py', '.R': 'r', '.rb': 'rb',
	'.rkt': 'rkt', '.rs': 'rs', '.scala': 'scala', '.sh': 'sh',
	'.ts': 'ts'
};

let extMap = Object.assign({}, fallbackMap);
let langNames = {};
let statusBar;
let outputChannel;
let currentView;
let savedInput = '';
let lastState = {};

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function buildHtml(state) {
	const s = state || lastState || {};
	lastState = s;
	const status = s.status || 'idle';
	const lang = s.lang || '';
	const out = s.output || '';
	const err = s.error || '';
	const elapsed = s.time || '';
	const inputVal = esc(savedInput);

	let main = out, ai = '';
	const idx = out.indexOf('\n\n[AI ANALYSIS]');
	if (idx >= 0) { main = out.slice(0, idx); ai = out.slice(idx + 2).replace('[AI ANALYSIS]\n', ''); }

	const pills = {
		running: ['bg-blue-500/10 text-blue-300 border-blue-500/30', '◌ Running'],
		ok: ['bg-emerald-500/10 text-emerald-300 border-emerald-500/30', '✓ Success'],
		error: ['bg-red-500/10 text-red-300 border-red-500/30', '✗ Error'],
		warn: ['bg-amber-500/10 text-amber-300 border-amber-500/30', '! Timeout'],
		idle: ['bg-zinc-500/10 text-zinc-400 border-zinc-500/30', 'Ready']
	};
	const pill = pills[status] || pills.idle;
	const inputsEmpty = !savedInput;

	return `<!DOCTYPE html>
<html lang="en" style="background:#1e1e1e">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${tailwindCdn}; script-src ${tailwindCdn} 'unsafe-inline';">
<script src="${tailwindCdn}"></script>
<style>
  * { box-sizing:border-box; }
  .mono { font-family:'JetBrains Mono','Fira Code','Cascadia Code','SF Mono',Consolas,monospace; font-size:12px; line-height:1.55; }
  @keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}
  .dot{animation:blink 1.2s ease-in-out infinite}
  ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#555;border-radius:3px}
  textarea:focus{outline:none;}
</style>
</head>
<body class="bg-[#1e1e1e] text-[#d4d4d4] font-sans text-[13px] flex flex-col h-screen overflow-hidden">

<!-- Header -->
<div class="flex items-center justify-between px-3 py-2.5 border-b border-[#3e3e3e] shrink-0">
  <div class="flex items-center gap-2">
    <span class="text-[13px] font-semibold">⚡ Code Online</span>
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${pill[0]}">${pill[1]}</span>
  </div>
  <span class="text-[10px] text-[#666]">${lang}${elapsed ? ' · ' + elapsed : ''}</span>
</div>

<!-- Toolbar -->
<div class="flex gap-1.5 px-3 py-2 border-b border-[#3e3e3e] shrink-0">
  <button id="runBtn" onclick="post('run')" class="px-3 py-1.5 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded text-[11px] font-medium transition-colors">▶ Run</button>
  <button onclick="post('copy',{text:(document.getElementById('out')?.textContent||'')})" class="px-2.5 py-1.5 bg-[#3e3e3e] hover:bg-[#505050] rounded text-[11px] transition-colors">📋 Copy</button>
  <button onclick="post('clear')" class="px-2.5 py-1.5 bg-[#3e3e3e] hover:bg-[#505050] rounded text-[11px] transition-colors">✕ Clear</button>
  <button onclick="post('loadInput')" class="px-2.5 py-1.5 bg-[#3e3e3e] hover:bg-[#505050] rounded text-[11px] transition-colors">📄 Load input.txt</button>
</div>

<!-- Input area -->
<details class="shrink-0" ${inputsEmpty ? '' : 'open'}>
  <summary class="px-3 py-1.5 bg-[#252526] border-b border-[#3e3e3e] text-[11px] uppercase tracking-wider text-[#777] cursor-pointer hover:text-[#aaa] select-none">
    ${inputsEmpty ? '▸ Input' : '▾ Input'} <span class="text-[10px] normal-case tracking-normal text-[#555] ml-1">— stdin data (optional)</span>
  </summary>
  <textarea id="inputArea" placeholder="Enter stdin input for your program..."
    oninput="savedInput=this.value"
    class="w-full px-3 py-2 bg-[#1a1a1a] text-[#d4d4d4] text-[12px] mono border-0 resize-none h-[60px] placeholder-[#555]"
  >${inputVal}</textarea>
</details>

<!-- Output -->
<div class="flex-1 overflow-auto">
  ${err ? `<div class="mx-3 mt-3 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-[12px] mono whitespace-pre-wrap">${esc(err)}</div>` : ''}

  ${main ? `<div class="mx-3 mt-3 rounded-lg border border-[#3e3e3e] overflow-hidden">
    <div class="flex items-center justify-between px-2.5 py-1.5 bg-[#2d2d2d] border-b border-[#3e3e3e] text-[10px] uppercase tracking-wider text-[#777]">
      <span>${status === 'error' ? 'Error' : 'Output'}</span>
      <button onclick="navigator.clipboard.writeText(document.getElementById('out').textContent)" class="text-[#777] hover:text-[#bbb] transition-colors">Copy</button>
    </div>
    <div id="out" class="px-3 py-2.5 mono whitespace-pre-wrap break-words max-h-[50vh] overflow-y-auto">${esc(main)}</div>
  </div>` : ''}

  ${ai ? `<div class="mx-3 mt-2 rounded-lg border border-amber-500/20 overflow-hidden">
    <div class="flex items-center px-2.5 py-1.5 bg-amber-500/5 border-b border-amber-500/10 text-[10px] uppercase tracking-wider text-amber-400">✦ AI Analysis</div>
    <div class="px-3 py-2.5 mono whitespace-pre-wrap break-words">${esc(ai)}</div>
  </div>` : ''}

  ${!main && !err ? `<div class="flex items-center justify-center h-full">
    <div class="text-center py-12 px-4">
      <div class="text-2xl mb-3 opacity-25">${status === 'running' ? '<span class="text-blue-400 dot">◌</span>' : '▶'}</div>
      <p class="text-[#777] text-[12px] leading-relaxed">
        ${status === 'running' ? 'Running your code...' : `Press <kbd class="px-1.5 py-0.5 rounded bg-[#3e3e3e] text-[#bbb] text-[11px]">Cmd+Alt+R</kbd> or click <span class="text-[#4a9eff] font-medium">Run</span>`}
      </p>
      ${!lang && status !== 'running' ? `<p class="text-[#555] text-[11px] mt-2">Open a code file to get started</p>` : ''}
    </div>
  </div>` : ''}
</div>

<script>
let savedInput = ${JSON.stringify(savedInput || '')};
const vsc = acquireVsCodeApi();
function post(cmd,data) { vsc.postMessage({command:cmd,input:document.getElementById('inputArea')?.value||'',...(data||{})}); }
document.getElementById('inputArea')?.addEventListener('input', function() { savedInput = this.value; });
</script>
</body>
</html>`;
}

function activate(context) {
	outputChannel = vscode.window.createOutputChannel('Run Code Online');

	statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBar.command = 'codeonline.run';
	statusBar.text = '$(code) Run Code';
	statusBar.tooltip = 'Run current file with Code Online';
	context.subscriptions.push(statusBar);

	fetchLanguages();

	context.subscriptions.push(vscode.window.registerWebviewViewProvider('codeonline.outputView', {
		resolveWebviewView(view) {
			currentView = view;
			view.webview.options = { enableScripts: true };
			view.webview.html = buildHtml(lastState);
			view.webview.onDidReceiveMessage(m => {
				if (m.input !== undefined) savedInput = m.input;
				if (m.command === 'run') runCode(m.input || savedInput);
				if (m.command === 'copy') vscode.env.clipboard.writeText(m.text || '');
				if (m.command === 'clear') { lastState = {}; savedInput = ''; view.webview.html = buildHtml({}); }
				if (m.command === 'loadInput') loadInputFromFile();
			});
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('codeonline.run', () => {
		const ed = vscode.window.activeTextEditor;
		if (!ed) { vscode.window.showWarningMessage('Open a code file first.'); return; }
		runCode(savedInput);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('codeonline.runWithInput', async () => {
		const ed = vscode.window.activeTextEditor;
		if (!ed) { vscode.window.showWarningMessage('Open a code file first.'); return; }
		const inp = await vscode.window.showInputBox({ placeHolder: 'Enter stdin input', prompt: 'Leave empty for no input' });
		if (inp !== undefined) { savedInput = inp; runCode(inp); }
	}));
	context.subscriptions.push(vscode.commands.registerCommand('codeonline.runNoInput', () => {
		const ed = vscode.window.activeTextEditor;
		if (!ed) { vscode.window.showWarningMessage('Open a code file first.'); return; }
		savedInput = '';
		runCode('');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('codeonline.focus', () => {
		vscode.commands.executeCommand('codeonline.outputView.focus');
	}));
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => updateStatusBar()));

	updateStatusBar();
}

async function loadInputFromFile() {
	const ed = vscode.window.activeTextEditor;
	if (!ed) return;
	const f = path.join(path.dirname(ed.document.uri.fsPath), 'input.txt');
	try {
		if (fs.existsSync(f)) {
			savedInput = fs.readFileSync(f, 'utf-8');
			if (currentView) currentView.webview.html = buildHtml(lastState);
		}
	} catch (_) { /* ignore */ }
}

async function fetchLanguages() {
	const api = vscode.workspace.getConfiguration('codeOnline').get('apiUrl', defaultApiUrl);
	try {
		const r = await axios.get(`${api}/languages?detail=true`, { timeout: 5000 });
		if (r.data) {
			langNames = {}; extMap = {};
			for (const [k, v] of Object.entries(r.data)) {
				langNames[k] = v.name;
				if (v.extension) extMap[v.extension] = k;
			}
		}
	} catch (e) {
		extMap = Object.assign({}, fallbackMap);
		for (const k of Object.values(extMap)) { if (!langNames[k]) langNames[k] = k.toUpperCase(); }
	}
}

function updateStatusBar() {
	const ed = vscode.window.activeTextEditor;
	if (!ed) { statusBar.hide(); return; }
	const lk = extMap[path.extname(ed.document.fileName)];
	statusBar.text = lk && langNames[lk] ? `$(code) Run ${langNames[lk]}` : '$(code) Run Code';
	statusBar.tooltip = 'Run current file with Code Online';
	statusBar.show();
}

function detectStatus(out) {
	if (!out) return 'idle';
	if (out.startsWith('[COMPILE ERROR]') || out.startsWith('[RUNTIME ERROR]')) return 'error';
	if (out.startsWith('[TIME LIMIT EXCEEDED]')) return 'warn';
	return 'ok';
}

function updateView(s) {
	lastState = s;
	if (currentView) {
		currentView.webview.html = buildHtml(s);
		currentView.show(true);
	}
}

async function runCode(inputOverride) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) { vscode.window.showWarningMessage('Open a code file first.'); return; }

	const fp = editor.document.uri.fsPath;
	const lang = extMap[path.extname(fp)];
	if (!lang) { vscode.window.showErrorMessage('Unsupported file extension.'); return; }

	const conf = vscode.workspace.getConfiguration('codeOnline');
	const apiUrl = conf.get('apiUrl', defaultApiUrl);
	const analyze = conf.get('analyze', false);
	if (editor.document.isDirty) await editor.document.save();
	const code = editor.document.getText();
	const langName = langNames[lang] || lang;
	const input = inputOverride !== undefined ? inputOverride : savedInput;

	outputChannel.clear();
	outputChannel.appendLine(`Running ${langName}${analyze ? ' with AI' : ''}...`);
	savedInput = input;
	updateView({ status: 'running', lang: langName });
	const t0 = Date.now();

	await vscode.window.withProgress(
		{ location: vscode.ProgressLocation.Notification, title: `Running ${langName}...`, cancellable: false },
		async () => {
			try {
				const r = await axios.post(`${apiUrl}/compile`, { code, language: lang, input: input || '', analyze }, {
					headers: { 'Content-Type': 'application/json' }, timeout: 60000
				});
				const raw = r.data;
				const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
				const st = detectStatus(raw);
				fs.writeFileSync(fp.replace(/\.[^.]+$/, '-output.txt'), raw);
				outputChannel.appendLine(raw);
				updateView({ status: st, lang: langName, output: raw, time: `${elapsed}s` });
				statusBar.text = `$(pass) ${langName}`;
				setTimeout(updateStatusBar, 3000);
			} catch (e) {
				const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
				let msg = 'Failed', detail = '';
				if (e.response) {
					detail = `Server ${e.response.status}: ${typeof e.response.data === 'string' ? e.response.data : ''}`;
					msg = e.response.status === 429 ? 'Rate limited.' : `Server error (${e.response.status}).`;
				} else if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
					detail = `Cannot reach ${apiUrl}`; msg = 'Cannot reach server.';
				} else if (e.code === 'ETIMEDOUT' || e.code === 'ECONNABORTED') {
					detail = 'Timed out — infinite loop?'; msg = 'Request timed out.';
				} else if (e.code === 'ECONNRESET' || String(e.message).includes('socket hang up')) {
					detail = 'Connection lost — infinite loop?'; msg = 'Connection lost.';
				} else {
					detail = e.message; msg = e.message;
				}
				updateView({ status: 'error', lang: langName, error: `${msg}\n${detail}`, time: `${elapsed}s` });
				vscode.window.showErrorMessage(msg);
			}
		}
	);
}

function deactivate() {
	if (outputChannel) outputChannel.dispose();
	if (statusBar) statusBar.dispose();
}

module.exports = { activate, deactivate };
