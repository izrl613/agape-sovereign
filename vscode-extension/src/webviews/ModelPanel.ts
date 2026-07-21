import * as vscode from 'vscode';
import { OllamaService } from '../services/OllamaService';

export class ModelPanel {
  private static currentPanel: ModelPanel | undefined;
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
    if (ModelPanel.currentPanel) {
      ModelPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'local-llm-pwa.models',
      'Local LLM Models',
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [extensionUri] }
    );
    ModelPanel.currentPanel = new ModelPanel(panel, extensionUri, ollamaService);
  }

  private getHtml(): string {
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Models</title></head><body><h1>Models</h1></body></html>';
  }

  private dispose() {
    ModelPanel.currentPanel = undefined;
    this.disposables.forEach(d => d.dispose());
  }
}
