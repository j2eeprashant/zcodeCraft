import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import FileExplorer from "@/components/file-explorer";
import MonacoEditor from "@/components/monaco-editor";
import ConsolePanel from "@/components/console-panel";
import { useWebSocket } from "@/hooks/use-websocket";
import { Play, Share, User, Code, GitBranch, Wifi } from "lucide-react";
import type { Project, File } from "@shared/schema";

export default function IDE() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [openFiles, setOpenFiles] = useState<File[]>([]);
  const [activeFileId, setActiveFileId] = useState<number | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<Array<{
    type: 'log' | 'error' | 'warn' | 'info' | 'success';
    content: string;
    timestamp: string;
  }>>([]);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: files } = useQuery<File[]>({
    queryKey: ["/api/projects", currentProject?.id, "files"],
    enabled: !!currentProject?.id,
  });

  const { sendMessage, lastMessage, connectionStatus } = useWebSocket();

  // Set default project
  useEffect(() => {
    if (projects && projects.length > 0 && !currentProject) {
      setCurrentProject(projects[0]);
    }
  }, [projects, currentProject]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        
        switch (data.type) {
          case 'execution_start':
            setConsoleOutput(prev => [...prev, {
              type: 'info',
              content: 'Starting code execution...',
              timestamp: data.timestamp,
            }]);
            break;
          case 'output':
            setConsoleOutput(prev => [...prev, {
              type: 'log',
              content: data.content,
              timestamp: data.timestamp,
            }]);
            break;
          case 'error':
            setConsoleOutput(prev => [...prev, {
              type: 'error',
              content: data.content,
              timestamp: data.timestamp,
            }]);
            break;
          case 'execution_complete':
            setConsoleOutput(prev => [...prev, {
              type: 'success',
              content: `Execution completed with exit code: ${data.exitCode}`,
              timestamp: data.timestamp,
            }]);
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  const handleFileSelect = (file: File) => {
    if (file.type === 'file') {
      setActiveFileId(file.id);
      if (!openFiles.find(f => f.id === file.id)) {
        setOpenFiles(prev => [...prev, file]);
      }
    }
  };

  const handleFileClose = (fileId: number) => {
    setOpenFiles(prev => prev.filter(f => f.id !== fileId));
    if (activeFileId === fileId) {
      const remainingFiles = openFiles.filter(f => f.id !== fileId);
      setActiveFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
    }
  };

  const handleRunCode = () => {
    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (!activeFile || !currentProject) return;

    const language = getLanguageFromFile(activeFile);
    
    // Clear console
    setConsoleOutput([]);
    
    // Send execution request via WebSocket
    sendMessage(JSON.stringify({
      type: 'execute',
      code: activeFile.content,
      language,
      projectId: currentProject.id,
    }));
  };

  const getLanguageFromFile = (file: File): string => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'py':
        return 'python';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      default:
        return 'javascript';
    }
  };

  const activeFile = openFiles.find(f => f.id === activeFileId);

  return (
    <div className="ide-container h-screen overflow-hidden flex flex-col">
      {/* Header */}
      <header className="panel-bg border-b border-ide h-12 flex items-center justify-between px-4 relative z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Code className="accent-blue h-5 w-5" />
            <span className="font-semibold text-lg text-ide-primary">CodeSpace</span>
          </div>
          <nav className="hidden md:flex items-center space-x-4 text-sm">
            <button className="text-ide-secondary hover:text-[var(--accent-blue)] transition-colors">File</button>
            <button className="text-ide-secondary hover:text-[var(--accent-blue)] transition-colors">Edit</button>
            <button className="text-ide-secondary hover:text-[var(--accent-blue)] transition-colors">View</button>
            <button className="text-ide-secondary hover:text-[var(--accent-blue)] transition-colors">Terminal</button>
            <button className="text-ide-secondary hover:text-[var(--accent-blue)] transition-colors">Help</button>
          </nav>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleRunCode}
            disabled={!activeFile}
            className="bg-accent-blue hover:bg-blue-600 px-3 py-1.5 text-sm font-medium"
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 px-3 py-1.5 text-sm font-medium">
            <Share className="w-4 h-4 mr-1" />
            Share
          </Button>
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </header>

      <div className="flex h-full">
        {/* Sidebar */}
        <aside className="w-64 sidebar-bg border-r border-ide flex flex-col">
          {/* Project Info */}
          <div className="p-4 border-b border-ide">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-ide-primary">
                {currentProject?.name || "No Project"}
              </h3>
            </div>
            {currentProject && (
              <div className="text-xs text-ide-secondary">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="capitalize">{currentProject.language}</span>
                </div>
                <div>Last modified: {new Date(currentProject.updatedAt).toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* File Explorer */}
          <FileExplorer
            files={files || []}
            onFileSelect={handleFileSelect}
            activeFileId={activeFileId}
          />

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-ide mt-auto">
            <div className="flex items-center justify-between text-xs text-ide-secondary">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-3 h-3" />
                <span>main</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Editor Tabs */}
          <div className="panel-bg border-b border-ide flex items-center overflow-x-auto">
            <div className="flex">
              {openFiles.map((file) => (
                <div
                  key={file.id}
                  className={`px-4 py-2 text-sm flex items-center space-x-2 border-r border-ide cursor-pointer ${
                    activeFileId === file.id ? 'tab-active' : 'tab-inactive'
                  }`}
                  onClick={() => setActiveFileId(file.id)}
                >
                  <span className="text-ide-primary">{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileClose(file.id);
                    }}
                    className="hover:bg-gray-600 p-0.5 rounded ml-2 text-ide-secondary hover:text-ide-primary"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex-1"></div>
            <div className="px-4 py-2 text-xs text-ide-secondary">
              {activeFile && (
                <span>
                  UTF-8 • {getLanguageFromFile(activeFile)} • {activeFile.name}
                </span>
              )}
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1">
            {activeFile ? (
              <MonacoEditor
                file={activeFile}
                language={getLanguageFromFile(activeFile)}
                onChange={(content) => {
                  // Update file content in openFiles
                  setOpenFiles(prev =>
                    prev.map(f =>
                      f.id === activeFile.id ? { ...f, content } : f
                    )
                  );
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-ide-secondary">
                <div className="text-center">
                  <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a file to start editing</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel */}
          <ConsolePanel output={consoleOutput} />
        </div>
      </div>

      {/* Status Bar */}
      <footer className="bg-accent-blue text-white h-6 flex items-center justify-between px-4 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-3 h-3" />
            <span>main</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span>No issues</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {activeFile && <span className="capitalize">{getLanguageFromFile(activeFile)}</span>}
          <span>UTF-8</span>
          <span>CRLF</span>
          <div className="flex items-center space-x-1">
            <Wifi className="w-3 h-3" />
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
