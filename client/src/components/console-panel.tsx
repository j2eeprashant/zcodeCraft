import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Terminal, 
  Bug, 
  AlertTriangle, 
  Upload, 
  X,
  Trash2
} from "lucide-react";

interface ConsoleOutput {
  type: 'log' | 'error' | 'warn' | 'info' | 'success';
  content: string;
  timestamp: string;
}

interface ConsolePanelProps {
  output: ConsoleOutput[];
}

export default function ConsolePanel({ output }: ConsolePanelProps) {
  const [activeTab, setActiveTab] = useState<'console' | 'debug' | 'problems' | 'output'>('console');
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [output]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getOutputIcon = (type: ConsoleOutput['type']) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return '';
    }
  };

  const getOutputClassName = (type: ConsoleOutput['type']) => {
    switch (type) {
      case 'error':
        return 'console-error';
      case 'warn':
        return 'console-warn';
      case 'success':
        return 'console-success';
      case 'info':
        return 'console-info';
      default:
        return 'console-log';
    }
  };

  if (!isExpanded) {
    return (
      <div className="panel-bg border-t border-ide h-8 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 accent-blue" />
          <span className="text-sm text-ide-primary">Console</span>
          {output.length > 0 && (
            <span className="text-xs text-ide-secondary">({output.length} messages)</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="h-6 px-2 text-ide-secondary hover:text-ide-primary"
        >
          Expand
        </Button>
      </div>
    );
  }

  return (
    <div className="h-48 panel-bg border-t border-ide flex flex-col">
      {/* Panel Tabs */}
      <div className="flex items-center border-b border-ide">
        <Button
          variant="ghost"
          size="sm"
          className={`px-4 py-2 text-sm rounded-none border-b-2 ${
            activeTab === 'console'
              ? 'border-[var(--accent-blue)] text-[var(--accent-blue)]'
              : 'border-transparent text-ide-secondary hover:text-ide-primary'
          }`}
          onClick={() => setActiveTab('console')}
        >
          <Terminal className="w-4 h-4 mr-2" />
          Console
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`px-4 py-2 text-sm rounded-none border-b-2 ${
            activeTab === 'debug'
              ? 'border-[var(--accent-blue)] text-[var(--accent-blue)]'
              : 'border-transparent text-ide-secondary hover:text-ide-primary'
          }`}
          onClick={() => setActiveTab('debug')}
        >
          <Bug className="w-4 h-4 mr-2" />
          Debug
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`px-4 py-2 text-sm rounded-none border-b-2 ${
            activeTab === 'problems'
              ? 'border-[var(--accent-blue)] text-[var(--accent-blue)]'
              : 'border-transparent text-ide-secondary hover:text-ide-primary'
          }`}
          onClick={() => setActiveTab('problems')}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Problems
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`px-4 py-2 text-sm rounded-none border-b-2 ${
            activeTab === 'output'
              ? 'border-[var(--accent-blue)] text-[var(--accent-blue)]'
              : 'border-transparent text-ide-secondary hover:text-ide-primary'
          }`}
          onClick={() => setActiveTab('output')}
        >
          <Upload className="w-4 h-4 mr-2" />
          Output
        </Button>
        <div className="flex-1"></div>
        <div className="flex items-center space-x-2 pr-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-700 text-ide-secondary hover:text-ide-primary"
            title="Clear console"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-6 w-6 p-0 hover:bg-gray-700 text-ide-secondary hover:text-ide-primary"
            title="Minimize panel"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* Console Content */}
      <div className="flex-1 relative">
        {activeTab === 'console' && (
          <ScrollArea ref={scrollAreaRef} className="h-full">
            <div className="p-4 console-output space-y-1">
              {output.length === 0 ? (
                <div className="text-ide-secondary text-sm">
                  Console output will appear here when you run your code.
                </div>
              ) : (
                output.map((item, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-ide-secondary text-xs min-w-[60px]">
                      [{formatTimestamp(item.timestamp)}]
                    </span>
                    <span className="text-xs">{getOutputIcon(item.type)}</span>
                    <pre className={`text-sm whitespace-pre-wrap ${getOutputClassName(item.type)}`}>
                      {item.content}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        {activeTab === 'debug' && (
          <div className="h-full flex items-center justify-center text-ide-secondary">
            <div className="text-center">
              <Bug className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Debug panel - Coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="h-full flex items-center justify-center text-ide-secondary">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No problems detected</p>
            </div>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="h-full flex items-center justify-center text-ide-secondary">
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Build output will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
