import * as vscode from 'vscode';
import { OllamaService } from '../services/OllamaService';

export class ChatPanel {
  private static currentPanel: ChatPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly ollamaService: OllamaService;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, ollamaService: OllamaService) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.ollamaService = ollamaService;

    this.panel.webview.html = this.getHtml();
    this.panel.webview.onDidReceiveMessage(this.handleMessage, this, this.disposables);
    this.panel.onDidDispose(this.dispose, this, this.disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, ollamaService: OllamaService) {
    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'local-llm-pwa.chat',
      'Local LLM Chat',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    ChatPanel.currentPanel = new ChatPanel(panel, extensionUri, ollamaService);
  }

  public static resolveWebviewView(webviewView: vscode.WebviewView, extensionUri: vscode.Uri, ollamaService: OllamaService) {
    webviewView.webview.options = { enableScripts: true, localResourceRoots: [extensionUri] };
    webviewView.webview.html = new ChatPanel(null as any, extensionUri, ollamaService).getHtml();
    webviewView.webview.onDidReceiveMessage((msg) => {
      // Handle messages
    });
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'sendMessage':
        this.handleSendMessage(message.payload);
        break;
      case 'getModels':
        this.sendModels();
        break;
    }
  }

  private async handleSendMessage(payload: { message: string; model: string; systemPrompt?: string }) {
    try {
      const response = await this.ollamaService.chat(payload.model, [
        { role: 'user', content: payload.message }
      ]);
      this.panel.webview.postMessage({ type: 'messageResponse', payload: { response } });
    } catch (error) {
      this.panel.webview.postMessage({ type: 'error', payload: { error: (error as Error).message } });
    }
  }

  private async sendModels() {
    try {
      const models = await this.ollamaService.listModels();
      this.panel.webview.postMessage({ type: 'modelsList', payload: { models } });
    } catch (error) {
      this.panel.webview.postMessage({ type: 'error', payload: { error: (error as Error).message } });
    }
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Local LLM Chat</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); height: 100vh; display: flex; flex-direction: column; }
    .header { padding: 12px 16px; border-bottom: 1px solid var(--vscode-panel-border); display: flex; align-items: center; gap: 12px; }
    .header h1 { font-size: 14px; font-weight: 600; }
    .model-select { padding: 6px 10px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 4px; font-size: 12px; }
    .messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .message { max-width: 85%; padding: 10px 14px; border-radius: 16px; line-height: 1.5; font-size: 13px; }
    .message.user { align-self: flex-end; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border-bottom-right-radius: 4px; }
    .message.assistant { align-self: flex-start; background: var(--vscode-editor-inactiveSelectionBackground); border-bottom-left-radius: 4px; }
    .message.system { align-self: center; background: var(--vscode-textLink-foreground); color: var(--vscode-button-foreground); font-size: 11px; padding: 4px 10px; border-radius: 12px; max-width: 100%; }
    .input-area { padding: 12px 16px; border-top: 1px solid var(--vscode-panel-border); background: var(--vscode-editor-background); }
    .input-row { display: flex; gap: 8px; }
    .input-row textarea { flex: 1; min-height: 44px; max-height: 150px; padding: 10px 14px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); border-radius: 8px; resize: vertical; font-family: inherit; font-size: 13px; line-height: 1.5; }
    .input-row button { padding: 10px 20px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 13px; align-self: flex-end; }
    .input-row button:disabled { opacity: 0.5; cursor: not-allowed; }
    .input-row button:hover:not(:disabled) { background: var(--vscode-button-hoverBackground); }
    .loading { display: inline-block; width: 16px; height: 16px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 32px; color: var(--vscode-descriptionForeground); }
    .empty-state h2 { font-size: 16px; margin-bottom: 8px; color: var(--vscode-editor-foreground); }
    .empty-state p { font-size: 13px; max-width: 300px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Local LLM Chat</h1>
    <select class="model-select" id="modelSelect"></select>
  </div>
  <div class="messages" id="messages">
    <div class="empty-state">
      <h2>Start a Conversation</h2>
      <p>Select a model and type a message to begin chatting with your local LLM.</p>
    </div>
  </div>
  <div class="input-area">
    <div class="input-row">
      <textarea id="messageInput" placeholder="Message... (Shift+Enter for new line)" rows="1"></textarea>
      <button id="sendBtn" disabled>Send</button>
    </div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const messagesEl = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const modelSelect = document.getElementById('modelSelect');
    let isStreaming = false;

    function autoResize(textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }

    messageInput.addEventListener('input', () => autoResize(messageInput));
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    sendBtn.addEventListener('click', sendMessage);

    function sendMessage() {
      const text = messageInput.value.trim();
      const model = modelSelect.value;
      if (!text || !model || isStreaming) return;

      addMessage('user', text);
      messageInput.value = '';
      autoResize(messageInput);
      sendBtn.disabled = true;
      isStreaming = true;
      sendBtn.innerHTML = '<span class="loading"></span>Sending...';

      vscode.postMessage({ type: 'sendMessage', payload: { message: text, model } });
    }

    function addMessage(role, content) {
      const emptyState = messagesEl.querySelector('.empty-state');
      if (emptyState) emptyState.remove();

      const div = document.createElement('div');
      div.className = 'message ' + role;
      div.textContent = content;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    window.addEventListener('message', (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'modelsList':
          modelSelect.innerHTML = payload.models.map(m => \`<option value="\${m.name}">\${m.name}</option>\`).join('');
          sendBtn.disabled = !modelSelect.value;
          break;
        case 'messageResponse':
          addMessage('assistant', payload.response);
          isStreaming = false;
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send';
          break;
        case 'error':
          addMessage('system', 'Error: ' + payload.error);
          isStreaming = false;
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send';
          break;
      }
    });

    vscode.postMessage({ type: 'getModels' });
  </script>
</body>
</html>`;
  }

  private dispose() {
    ChatPanel.currentPanel = undefined;
    this.disposables.forEach(d => d.dispose());
  }
}