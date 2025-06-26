import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { File } from "@shared/schema";

// Monaco Editor types (we'll use CDN version)
declare global {
  interface Window {
    monaco: any;
    require: any;
  }
}

interface MonacoEditorProps {
  file: File;
  language: string;
  onChange: (content: string) => void;
}

export default function MonacoEditor({ file, language, onChange }: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const queryClient = useQueryClient();

  const saveFileMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("PUT", `/api/files/${file.id}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", file.projectId, "files"] });
    },
  });

  useEffect(() => {
    // Dynamically load Monaco Editor from CDN
    const loadMonaco = () => {
      if (window.monaco) {
        initializeEditor();
        return;
      }

      // Load Monaco Editor
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
      script.onload = () => {
        window.require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
        window.require(['vs/editor/editor.main'], () => {
          initializeEditor();
        });
      };
      document.head.appendChild(script);
    };

    const initializeEditor = () => {
      if (!editorRef.current || !window.monaco) return;

      // Dispose existing editor
      if (monacoRef.current) {
        monacoRef.current.dispose();
      }

      // Set dark theme
      window.monaco.editor.defineTheme('codespace-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955' },
          { token: 'keyword', foreground: 'C586C0' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'regexp', foreground: 'D16969' },
          { token: 'type', foreground: '4EC9B0' },
          { token: 'class', foreground: '4EC9B0' },
          { token: 'function', foreground: 'DCDCAA' },
          { token: 'variable', foreground: '9CDCFE' },
        ],
        colors: {
          'editor.background': '#1E1E1E',
          'editor.foreground': '#D4D4D4',
          'editorLineNumber.foreground': '#858585',
          'editorLineNumber.activeForeground': '#C6C6C6',
          'editor.selectionBackground': '#264F78',
          'editor.lineHighlightBackground': '#2A2D2E',
        }
      });

      // Create editor
      const editor = window.monaco.editor.create(editorRef.current, {
        value: file.content,
        language: getMonacoLanguage(language),
        theme: 'codespace-dark',
        fontSize: 14,
        fontFamily: 'Fira Code, Monaco, Consolas, monospace',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        folding: true,
        bracketPairColorization: { enabled: true },
      });

      monacoRef.current = editor;

      // Handle content changes
      editor.onDidChangeModelContent(() => {
        const content = editor.getValue();
        onChange(content);
      });

      // Auto-save on Ctrl+S
      editor.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KeyS, () => {
        const content = editor.getValue();
        saveFileMutation.mutate(content);
      });
    };

    loadMonaco();

    return () => {
      if (monacoRef.current) {
        monacoRef.current.dispose();
      }
    };
  }, []);

  // Update editor content when file changes
  useEffect(() => {
    if (monacoRef.current && file.content !== monacoRef.current.getValue()) {
      monacoRef.current.setValue(file.content);
    }
  }, [file.content]);

  // Update editor language when language changes
  useEffect(() => {
    if (monacoRef.current && window.monaco) {
      const model = monacoRef.current.getModel();
      if (model) {
        window.monaco.editor.setModelLanguage(model, getMonacoLanguage(language));
      }
    }
  }, [language]);

  const getMonacoLanguage = (lang: string): string => {
    switch (lang) {
      case 'javascript':
      case 'js':
        return 'javascript';
      case 'python':
      case 'py':
        return 'python';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'typescript':
      case 'ts':
        return 'typescript';
      case 'jsx':
        return 'javascript';
      case 'tsx':
        return 'typescript';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="h-full w-full relative">
      <div
        ref={editorRef}
        className="h-full w-full"
        style={{ minHeight: '300px' }}
      />
      {saveFileMutation.isPending && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
          Saving...
        </div>
      )}
    </div>
  );
}
