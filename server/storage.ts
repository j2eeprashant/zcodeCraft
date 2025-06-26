import { projects, files, users, type Project, type File, type User, type InsertProject, type InsertFile, type InsertUser } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // File methods
  getFile(id: number): Promise<File | undefined>;
  getFilesByProject(projectId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, file: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private files: Map<number, File>;
  private currentUserId: number;
  private currentProjectId: number;
  private currentFileId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.files = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentFileId = 1;

    // Create default project with sample files
    this.initializeDefaultProject();
  }

  private initializeDefaultProject() {
    const defaultProject: Project = {
      id: this.currentProjectId++,
      name: "My Project",
      description: "A sample JavaScript project",
      language: "javascript",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(defaultProject.id, defaultProject);

    // Create sample files
    const sampleFiles: File[] = [
      {
        id: this.currentFileId++,
        projectId: defaultProject.id,
        name: "src",
        path: "src",
        content: "",
        type: "folder",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentFileId++,
        projectId: defaultProject.id,
        name: "index.js",
        path: "src/index.js",
        content: `const express = require('express');
const app = express();
const port = 3000;

// Middleware for parsing JSON
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'Hello, World!',
        timestamp: new Date().toISOString()
    });
});

app.listen(port, () => {
    console.log(\`Server running on port \${port}\`);
});

// TODO: Add error handling and additional routes`,
        type: "file",
        parentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentFileId++,
        projectId: defaultProject.id,
        name: "utils.js",
        path: "src/utils.js",
        content: `// Utility functions
export const formatDate = (date) => {
    return date.toLocaleDateString();
};

export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};`,
        type: "file",
        parentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentFileId++,
        projectId: defaultProject.id,
        name: "package.json",
        path: "package.json",
        content: `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "A sample Node.js project",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0"
  }
}`,
        type: "file",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentFileId++,
        projectId: defaultProject.id,
        name: "README.md",
        path: "README.md",
        content: `# My Project

A sample Node.js project with Express.js

## Getting Started

1. Install dependencies: \`npm install\`
2. Start the server: \`npm start\`
3. Visit http://localhost:3000

## Features

- Express.js server
- JSON API endpoints
- Utility functions`,
        type: "file",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentFileId++,
        projectId: defaultProject.id,
        name: "index.html",
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to My Project</h1>
        <p>This is a sample HTML file.</p>
    </div>
</body>
</html>`,
        type: "file",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentFileId++,
        projectId: defaultProject.id,
        name: "styles.css",
        path: "styles.css",
        content: `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
    color: #333;
    text-align: center;
}`,
        type: "file",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleFiles.forEach(file => {
      this.files.set(file.id, file);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = {
      ...insertProject,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, updateData: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject: Project = {
      ...project,
      ...updateData,
      updatedAt: new Date(),
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    const deleted = this.projects.delete(id);
    if (deleted) {
      // Also delete all files in the project
      const projectFiles = Array.from(this.files.values()).filter(
        file => file.projectId === id
      );
      projectFiles.forEach(file => this.files.delete(file.id));
    }
    return deleted;
  }

  // File methods
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByProject(projectId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      file => file.projectId === projectId
    );
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const file: File = {
      ...insertFile,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: number, updateData: Partial<InsertFile>): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;

    const updatedFile: File = {
      ...file,
      ...updateData,
      updatedAt: new Date(),
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }
}

export const storage = new MemStorage();
