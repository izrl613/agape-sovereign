
import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'bash' }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mt-4">
      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={copyToClipboard}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-2"
        >
          {copied ? <i className="fas fa-check"></i> : <i className="fas fa-copy"></i>}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-slate-900 p-6 rounded-xl border border-slate-700 overflow-x-auto text-sm leading-relaxed text-blue-100 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};
