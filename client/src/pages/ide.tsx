import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import FileExplorer from "@/components/file-explorer";
import MonacoEditor from "@/components/monaco-editor";
import ConsolePanel from "@/components/console-panel";
import { useWebSocket } from "@/hooks/use-websocket";
import { Play, Share, User, Code, GitBranch, Wifi, ChevronDown, Keyboard, Plus } from "lucide-react";
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
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [consoleVisible, setConsoleVisible] = useState(true);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("vanilla");

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: files, refetch: refetchFiles } = useQuery<File[]>({
    queryKey: ["/api/projects", currentProject?.id, "files"],
    enabled: !!currentProject?.id,
  });

  const { sendMessage, lastMessage, connectionStatus } = useWebSocket();
  const queryClient = useQueryClient();

  // Framework templates
  const frameworks = {
    vanilla: {
      name: "Vanilla JavaScript",
      language: "javascript",
      files: [
        { name: "index.html", content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vanilla JS Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <h1>Hello World!</h1>
        <p>Welcome to your new project</p>
    </div>
    <script src="script.js"></script>
</body>
</html>` },
        { name: "style.css", content: `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

#app {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
    color: #333;
    text-align: center;
}` },
        { name: "script.js", content: `console.log('Hello from Vanilla JavaScript!');

document.addEventListener('DOMContentLoaded', function() {
    const app = document.getElementById('app');
    
    // Add some interactivity
    const button = document.createElement('button');
    button.textContent = 'Click me!';
    button.addEventListener('click', () => {
        alert('Button clicked!');
    });
    
    app.appendChild(button);
});` }
      ]
    },
    react: {
      name: "React",
      language: "javascript",
      files: [
        { name: "package.json", content: `{
  "name": "react-project",
  "version": "1.0.0",
  "description": "A React project",
  "main": "index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}` },
        { name: "public/index.html", content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App</title>
</head>
<body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
</body>
</html>` },
        { name: "src/index.js", content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);` },
        { name: "src/App.js", content: `import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to React</h1>
        <p>You clicked {count} times</p>
        <button onClick={() => setCount(count + 1)}>
          Click me
        </button>
      </header>
    </div>
  );
}

export default App;` },
        { name: "src/App.css", content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}

button {
  background-color: #61dafb;
  border: none;
  padding: 10px 20px;
  margin: 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}` },
        { name: "src/index.css", content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}` }
      ]
    },
    nextjs: {
      name: "Next.js",
      language: "javascript",
      files: [
        { name: "package.json", content: `{
  "name": "nextjs-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "eslint": "^8.55.0",
    "eslint-config-next": "14.0.4",
    "typescript": "^5.3.3"
  }
}` },
        { name: "next.config.js", content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig` },
        { name: "app/layout.tsx", content: `import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Next.js App',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}` },
        { name: "app/page.tsx", content: `'use client'

import { useState } from 'react'

export default function Home() {
  const [count, setCount] = useState(0)

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Next.js!
        </h1>
        <div className="text-center">
          <p className="mb-4">Count: {count}</p>
          <button 
            onClick={() => setCount(count + 1)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Click me
          </button>
        </div>
      </div>
    </main>
  )
}` },
        { name: "app/globals.css", content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}` }
      ]
    },
    nodejs: {
      name: "Node.js",
      language: "javascript",
      files: [
        { name: "package.json", content: `{
  "name": "nodejs-project",
  "version": "1.0.0",
  "description": "A Node.js project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  },
  "keywords": ["nodejs", "express", "api"],
  "author": "",
  "license": "ISC"
}` },
        { name: "index.js", content: `const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Node.js API!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});` },
        { name: ".env", content: `PORT=3000
NODE_ENV=development
# Add your environment variables here` },
        { name: "README.md", content: `# Node.js Project

A basic Node.js Express server.

## Getting Started

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

### Production

\`\`\`bash
npm start
\`\`\`

## API Endpoints

- \`GET /\` - Welcome message
- \`GET /api/health\` - Health check

## Environment Variables

Copy \`.env\` and configure your environment variables.
` }
      ]
    },
    "react-native": {
      name: "React Native",
      language: "javascript",
      files: [
        { name: "package.json", content: `{
  "name": "ReactNativeProject",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "lint": "eslint .",
    "start": "react-native start",
    "test": "jest"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.6"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@babel/preset-env": "^7.20.0",
    "@babel/runtime": "^7.20.0",
    "@react-native/eslint-config": "^0.72.2",
    "@react-native/metro-config": "^0.72.11",
    "@tsconfig/react-native": "^3.0.0",
    "@types/react": "^18.0.24",
    "@types/react-test-renderer": "^18.0.0",
    "babel-jest": "^29.2.1",
    "eslint": "^8.19.0",
    "jest": "^29.2.1",
    "metro-react-native-babel-preset": "0.76.8",
    "prettier": "^2.4.1",
    "react-test-renderer": "18.2.0",
    "typescript": "4.8.4"
  },
  "engines": {
    "node": ">=16"
  }
}` },
        { name: "App.tsx", content: `import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function App(): JSX.Element {
  const [count, setCount] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
        <View style={styles.body}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Welcome to React Native!</Text>
            <Text style={styles.sectionDescription}>
              Edit App.tsx to change this screen and then come back to see your edits.
            </Text>
          </View>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Count: {count}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setCount(count + 1)}>
              <Text style={styles.buttonText}>Press me!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    backgroundColor: '#f8f8f8',
  },
  body: {
    backgroundColor: '#fff',
    padding: 20,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;` },
        { name: "index.js", content: `import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);` },
        { name: "app.json", content: `{
  "name": "ReactNativeProject",
  "displayName": "ReactNativeProject"
}` },
        { name: "babel.config.js", content: `module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
};` },
        { name: "metro.config.js", content: `const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);` }
      ]
    }
  };

  const createProjectFiles = async (projectId: number, framework: string) => {
    console.log(`createProjectFiles called with projectId: ${projectId} (type: ${typeof projectId}), framework: ${framework}`);
    
    // Validate projectId
    if (!projectId || typeof projectId !== 'number' || projectId <= 0) {
      console.error(`Invalid projectId: ${projectId}`);
      return;
    }
    
    const template = frameworks[framework as keyof typeof frameworks];
    if (!template) {
      console.error(`Template not found for framework: ${framework}`);
      return;
    }

    console.log(`Creating files for project ${projectId} with framework ${framework}`);

    for (const file of template.files) {
      const pathParts = file.name.split('/');
      let parentId: number | null = null;
      let currentPath = '';

      // Create folders if needed
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];
        currentPath += (currentPath ? '/' : '') + folderName;
        
        try {
          console.log(`Creating folder: ${folderName} at path: ${currentPath}`);
          const folderData = {
            name: folderName,
            path: currentPath,
            projectId: Number(projectId),
            parentId: parentId,
            content: "",
            type: "folder",
          };
          console.log('Folder data:', folderData);

          const folderResponse = await apiRequest("POST", "/api/files", folderData) as unknown as File;
          parentId = folderResponse.id;
          console.log(`Folder created with ID: ${parentId}`);
        } catch (error) {
          console.error(`Error creating folder ${folderName}:`, error);
          console.error('Folder creation failed, continuing...');
        }
      }

      // Create the file
      const fileName = pathParts[pathParts.length - 1];
      const filePath = file.name; // Use the original file name as path

      try {
        console.log(`Creating file: ${fileName} at path: ${filePath}`);
        const fileData = {
          name: fileName,
          path: filePath,
          projectId: Number(projectId),
          parentId: parentId,
          content: file.content || "",
          type: "file",
        };
        console.log('File data:', fileData);

        await apiRequest("POST", "/api/files", fileData);
        console.log(`File created successfully: ${fileName}`);
      } catch (error) {
        console.error(`Error creating file ${fileName}:`, error);
      }
    }

    // Refresh the file list and projects list
    await queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    console.log('Project files creation completed');
  };

  // Mutations for file operations
  const createFileMutation = useMutation({
    mutationFn: async (data: { name: string; path: string; projectId: number; parentId?: number }) => {
      return apiRequest("POST", "/api/files", {
        ...data,
        content: "",
        type: "file",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProject?.id, "files"] });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; path: string; projectId: number; parentId?: number }) => {
      return apiRequest("POST", "/api/files", {
        ...data,
        content: "",
        type: "folder",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProject?.id, "files"] });
    },
  });

  const saveFileMutation = useMutation({
    mutationFn: async ({ fileId, content }: { fileId: number; content: string }) => {
      return apiRequest("PUT", `/api/files/${fileId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProject?.id, "files"] });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; language: string }) => {
      const response = await apiRequest("POST", "/api/projects", data);
      const json = await response.json();
      console.log('Project creation response:', json);
      return json as Project;
    },
    onSuccess: async (newProject: Project) => {
      console.log('New project created:', newProject);
      console.log('Project ID:', newProject.id, 'Type:', typeof newProject.id);
      
      // Update projects list first
      await queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // Set the new project as current
      setCurrentProject(newProject);
      
      // Create initial files based on framework
      if (newProject.id && selectedFramework) {
        await createProjectFiles(newProject.id, selectedFramework);
        // Force refresh files for the new project
        await queryClient.invalidateQueries({ queryKey: ["/api/projects", newProject.id, "files"] });
        // Also manually refetch files to ensure they show up immediately
        setTimeout(() => {
          if (currentProject?.id === newProject.id) {
            refetchFiles();
          }
        }, 200);
      } else {
        console.error('Missing project ID or framework:', { projectId: newProject.id, framework: selectedFramework });
      }
    },
  });

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

  // Menu handlers
  const handleNewProject = () => {
    setShowNewProjectDialog(true);
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    
    const framework = frameworks[selectedFramework as keyof typeof frameworks];
    createProjectMutation.mutate({
      name: newProjectName,
      description: newProjectDescription,
      language: framework.language,
    });
    
    setNewProjectName("");
    setNewProjectDescription("");
    setSelectedFramework("vanilla");
    setShowNewProjectDialog(false);
  };

  const handleNewFile = () => {
    setShowNewFileDialog(true);
  };

  const handleNewFolder = () => {
    setShowNewFolderDialog(true);
  };

  const handleCreateFile = () => {
    if (!newFileName.trim() || !currentProject) return;
    
    createFileMutation.mutate({
      name: newFileName,
      path: newFileName,
      projectId: currentProject.id,
    });
    
    setNewFileName("");
    setShowNewFileDialog(false);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim() || !currentProject) return;
    
    createFolderMutation.mutate({
      name: newFolderName,
      path: newFolderName,
      projectId: currentProject.id,
    });
    
    setNewFolderName("");
    setShowNewFolderDialog(false);
  };

  const handleSaveFile = () => {
    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (activeFile) {
      saveFileMutation.mutate({
        fileId: activeFile.id,
        content: activeFile.content,
      });
    }
  };

  const handleSaveAllFiles = () => {
    openFiles.forEach(file => {
      saveFileMutation.mutate({
        fileId: file.id,
        content: file.content,
      });
    });
  };

  const handleOpenFile = () => {
    // Create a hidden file input element to trigger file selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && currentProject) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          // Use apiRequest directly for file upload with content
          apiRequest("POST", "/api/files", {
            name: file.name,
            path: file.name,
            projectId: currentProject.id,
            content,
            type: "file",
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/projects", currentProject.id, "files"] });
          });
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleCloseFile = () => {
    if (activeFileId) {
      handleFileClose(activeFileId);
    }
  };

  const handleCloseAllFiles = () => {
    setOpenFiles([]);
    setActiveFileId(null);
  };

  const handleToggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleToggleConsole = () => {
    setConsoleVisible(!consoleVisible);
  };

  const handleClearConsole = () => {
    setConsoleOutput([]);
  };

  const handleNewTerminal = () => {
    // Add a new terminal tab to console
    setConsoleOutput(prev => [...prev, {
      type: 'info',
      content: 'New terminal session started',
      timestamp: new Date().toISOString(),
    }]);
  };

  const handleSplitTerminal = () => {
    // Simulate split terminal
    setConsoleOutput(prev => [...prev, {
      type: 'info',
      content: 'Terminal split - feature coming soon',
      timestamp: new Date().toISOString(),
    }]);
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
          <nav className="hidden md:flex items-center space-x-1 text-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-ide-secondary hover:text-[var(--accent-blue)] transition-colors h-8 px-3">
                  File
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleNewProject}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleNewFile}>
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNewFolder}>
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenFile}>
                  Open File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSaveFile}>
                  Save
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSaveAllFiles}>
                  Save All
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCloseFile}>
                  Close File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCloseAllFiles}>
                  Close All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-ide-secondary hover:text-[var(--accent-blue)] transition-colors h-8 px-3">
                  Edit
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  Undo
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Redo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Cut
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Paste
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Find
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Replace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-ide-secondary hover:text-[var(--accent-blue)] transition-colors h-8 px-3">
                  View
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleToggleSidebar}>
                  Toggle Sidebar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleConsole}>
                  Toggle Console
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Zoom In
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Zoom Out
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Reset Zoom
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Full Screen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-ide-secondary hover:text-[var(--accent-blue)] transition-colors h-8 px-3">
                  Terminal
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleNewTerminal}>
                  New Terminal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSplitTerminal}>
                  Split Terminal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClearConsole}>
                  Clear Terminal
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Kill Terminal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-ide-secondary hover:text-[var(--accent-blue)] transition-colors h-8 px-3">
                  Help
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowKeyboardShortcuts(true)}>
                  Keyboard Shortcuts
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Documentation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Report Issue
                </DropdownMenuItem>
                <DropdownMenuItem>
                  About CodeSpace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        {sidebarVisible && (
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
                <div>Last modified: {currentProject.updatedAt ? new Date(currentProject.updatedAt).toLocaleString() : 'Never'}</div>
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
        )}

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
          {consoleVisible && <ConsolePanel output={consoleOutput} />}
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

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create New Project</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Project Name</label>
                <Input
                  placeholder="my-awesome-project"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Textarea
                  placeholder="Describe your project..."
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Framework</label>
                <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vanilla">
                      <div className="flex items-center space-x-2">
                        <span>🌟</span>
                        <span>Vanilla JavaScript</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="react">
                      <div className="flex items-center space-x-2">
                        <span>⚛️</span>
                        <span>React</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="nextjs">
                      <div className="flex items-center space-x-2">
                        <span>🔺</span>
                        <span>Next.js</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="nodejs">
                      <div className="flex items-center space-x-2">
                        <span>🟢</span>
                        <span>Node.js</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="react-native">
                      <div className="flex items-center space-x-2">
                        <span>📱</span>
                        <span>React Native</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {frameworks[selectedFramework as keyof typeof frameworks]?.name} - Includes starter files and configuration
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateProject} 
                disabled={!newProjectName.trim() || createProjectMutation.isPending}
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New File Dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile();
                }
              }}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFile} disabled={!newFileName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                }
              }}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Modal */}
      <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Keyboard className="w-5 h-5" />
              <span>Keyboard Shortcuts</span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div>
              <h3 className="font-semibold mb-3">File Operations</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Save File</span>
                  <span className="text-muted-foreground">Ctrl+S</span>
                </div>
                <div className="flex justify-between">
                  <span>New File</span>
                  <span className="text-muted-foreground">Ctrl+N</span>
                </div>
                <div className="flex justify-between">
                  <span>Close File</span>
                  <span className="text-muted-foreground">Ctrl+W</span>
                </div>
                <div className="flex justify-between">
                  <span>Open File</span>
                  <span className="text-muted-foreground">Ctrl+O</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Editor</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Find</span>
                  <span className="text-muted-foreground">Ctrl+F</span>
                </div>
                <div className="flex justify-between">
                  <span>Replace</span>
                  <span className="text-muted-foreground">Ctrl+H</span>
                </div>
                <div className="flex justify-between">
                  <span>Go to Line</span>
                  <span className="text-muted-foreground">Ctrl+G</span>
                </div>
                <div className="flex justify-between">
                  <span>Comment Line</span>
                  <span className="text-muted-foreground">Ctrl+/</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Code Execution</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Run Code</span>
                  <span className="text-muted-foreground">F5</span>
                </div>
                <div className="flex justify-between">
                  <span>Stop Execution</span>
                  <span className="text-muted-foreground">Shift+F5</span>
                </div>
                <div className="flex justify-between">
                  <span>Clear Console</span>
                  <span className="text-muted-foreground">Ctrl+K</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">View</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Toggle Sidebar</span>
                  <span className="text-muted-foreground">Ctrl+B</span>
                </div>
                <div className="flex justify-between">
                  <span>Toggle Console</span>
                  <span className="text-muted-foreground">Ctrl+`</span>
                </div>
                <div className="flex justify-between">
                  <span>Zoom In</span>
                  <span className="text-muted-foreground">Ctrl++</span>
                </div>
                <div className="flex justify-between">
                  <span>Zoom Out</span>
                  <span className="text-muted-foreground">Ctrl+-</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
