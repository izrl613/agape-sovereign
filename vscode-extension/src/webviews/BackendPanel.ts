import * as vscode from 'vscode';
import { OllamaService } from '../services/OllamaService';

export class BackendPanel {
  private static currentPanel: BackendPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly ollamaService: OllamaService;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, ollamaService: OllamaService) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.ollamaService = ollamaService;
    this.panel.webview.html = this.getHtml();
    this.panel.onDidDispose(this.dispose, this, this.disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, ollamaService: OllamaService) {
    if (BackendPanel.currentPanel) {
      BackendPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'local-llm-pwa.backend',
      'Local LLM Backend',
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [extensionUri] }
    );
    BackendPanel.currentPanel = new BackendPanel(panel, extensionUri, ollamaService);
  }

  private getHtml(): string {
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Backend</title></head><body><h1>Backend Status</h1></body></html>';
  }

  private dispose() {
    BackendPanel.currentPanel = undefined;
    this.disposables.forEach(d => d.dispose());
  }
}
