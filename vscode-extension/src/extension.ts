import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { ChatPanel } from './webviews/ChatPanel';
import { ModelPanel } from './webviews/ModelPanel';
import { BackendPanel } from './webviews/BackendPanel';
import { OllamaService } from './services/OllamaService';

let backendProcess: ChildProcess | null = null;
let ollamaService: OllamaService | null = null;
const outputChannel = vscode.window.createOutputChannel('Local LLM PWA');

export function activate(context: vscode.ExtensionContext) {
  console.log('Local LLM PWA extension activated');

  const config = vscode.workspace.getConfiguration('local-llm-pwa');
  const ollamaUrl = config.get('ollamaUrl', 'http://localhost:11434');
  ollamaService = new OllamaService(ollamaUrl);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('local-llm-pwa.startBackend', startBackend),
    vscode.commands.registerCommand('local-llm-pwa.stopBackend', stopBackend),
    vscode.commands.registerCommand('local-llm-pwa.openChat', () => ChatPanel.createOrShow(context.extensionUri, ollamaService!)),
    vscode.commands.registerCommand('local-llm-pwa.openModels', () => ModelPanel.createOrShow(context.extensionUri, ollamaService!)),
    vscode.commands.registerCommand('local-llm-pwa.openBackend', () => BackendPanel.createOrShow(context.extensionUri, ollamaService!)),
    vscode.commands.registerCommand('local-llm-pwa.pullModel', pullModel),
    vscode.commands.registerCommand('local-llm-pwa.deleteModel', deleteModel),
    vscode.commands.registerCommand('local-llm-pwa.refreshModels', refreshModels)
  );

  // Auto-start backend if configured
  if (config.get('autoStartBackend', true)) {
    startBackend();
  }

  // Register tree views
  const modelProvider = new ModelTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('local-llm-pwa.models', modelProvider),
    vscode.commands.registerCommand('local-llm-pwa.models.refresh', () => modelProvider.refresh())
  );
}

export function deactivate() {
  stopBackend();
}

async function startBackend() {
  if (backendProcess) {
    vscode.window.showInformationMessage('Backend already running');
    return;
  }

  const config = vscode.workspace.getConfiguration('local-llm-pwa');
  const backendPath = path.join(__dirname, '..', '..', 'backend');
  const port = config.get('backendPort', 3000);

  try {
    outputChannel.appendLine('Starting backend...');
    outputChannel.show(true);

    // Check if backend is built
    const distPath = path.join(backendPath, 'dist', 'index.js');
    if (!fs.existsSync(distPath)) {
      outputChannel.appendLine('Building backend...');
      await runCommand('npm', ['run', 'build'], { cwd: backendPath });
    }

    // Start backend process
    backendProcess = spawn('node', [distPath], {
      cwd: backendPath,
      env: {
        ...process.env,
        PORT: port.toString(),
        OLLAMA_HOST: config.get('ollamaUrl', 'http://localhost:11434')
      }
    });

    backendProcess.stdout?.on('data', (data) => {
      outputChannel.appendLine(data.toString().trim());
    });

    backendProcess.stderr?.on('data', (data) => {
      outputChannel.appendLine('[ERROR] ' + data.toString().trim());
    });

    backendProcess.on('exit', (code) => {
      outputChannel.appendLine(`Backend exited with code ${code}`);
      backendProcess = null;
    });

    // Wait for backend to be ready
    await waitForBackend(port);
    vscode.window.showInformationMessage(`Backend started on port ${port}`);
  } catch (error) {
    outputChannel.appendLine(`Failed to start backend: ${error}`);
    vscode.window.showErrorMessage(`Failed to start backend: ${error}`);
  }
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
    vscode.window.showInformationMessage('Backend stopped');
  }
}

async function pullModel() {
  const model = await vscode.window.showInputBox({
    prompt: 'Enter model name to pull (e.g., llama3.2:3b)',
    placeHolder: 'llama3.2:3b'
  });

  if (!model) return;

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `Pulling ${model}...`
  }, async (progress) => {
    try {
      const config = vscode.workspace.getConfiguration('local-llm-pwa');
      const ollamaUrl = config.get('ollamaUrl', 'http://localhost:11434');

      const response = await fetch(`${ollamaUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model, stream: true })
      });

      if (!response.ok) throw new Error(`Failed to pull model: ${response.statusText}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status === 'downloading' && data.total && data.completed) {
              progress.report({ increment: (data.completed / data.total) * 100 });
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      vscode.window.showInformationMessage(`Model ${model} pulled successfully`);
      vscode.commands.executeCommand('local-llm-pwa.models.refresh');
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to pull model: ${error}`);
    }
  });
}

async function deleteModel() {
  const model = await vscode.window.showInputBox({
    prompt: 'Enter model name to delete',
    placeHolder: 'llama3.2:3b'
  });

  if (!model) return;

  const confirm = await vscode.window.showWarningMessage(
    `Delete model ${model}? This cannot be undone.`,
    { modal: true },
    'Delete'
  );

  if (confirm !== 'Delete') return;

  try {
    const config = vscode.workspace.getConfiguration('local-llm-pwa');
    const ollamaUrl = config.get('ollamaUrl', 'http://localhost:11434');

    const response = await fetch(`${ollamaUrl}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model })
    });

    if (!response.ok) throw new Error(`Failed to delete model: ${response.statusText}`);

    vscode.window.showInformationMessage(`Model ${model} deleted`);
    vscode.commands.executeCommand('local-llm-pwa.models.refresh');
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to delete model: ${error}`);
  }
}

async function refreshModels() {
  vscode.commands.executeCommand('local-llm-pwa.models.refresh');
}

async function waitForBackend(port: number, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`);
      if (response.ok) return;
    } catch {
      // Not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Backend failed to start in time');
}

function runCommand(command: string, args: string[], options: { cwd: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd: options.cwd, shell: true });
    proc.stdout?.on('data', (data) => outputChannel.appendLine(data.toString().trim()));
    proc.stderr?.on('data', (data) => outputChannel.appendLine(data.toString().trim()));
    proc.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Command failed with code ${code}`)));
  });
}

class ModelTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh() { this._onDidChangeTreeData.fire(); }

  getTreeItem(element: vscode.TreeItem) { return element; }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (!element) {
      return [
        new vscode.TreeItem('Local Models', vscode.TreeItemCollapsibleState.Expanded),
        new vscode.TreeItem('Available Models', vscode.TreeItemCollapsibleState.Collapsed)
      ];
    }
    return [];
  }
}