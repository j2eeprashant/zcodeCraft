import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertProjectSchema, insertFileSchema } from "@shared/schema";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function registerRoutes(app: Express): Promise<Server> {
  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const project = await storage.updateProject(id, updateData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // File routes
  app.get("/api/projects/:projectId/files", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const files = await storage.getFilesByProject(projectId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.post("/api/files", async (req, res) => {
    try {
      const fileData = insertFileSchema.parse(req.body);
      const file = await storage.createFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      console.error("File creation error:", error);
      console.error("Request body:", req.body);
      res.status(400).json({ message: "Invalid file data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const file = await storage.updateFile(id, updateData);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFile(id);
      if (!deleted) {
        return res.status(404).json({ message: "File not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Code execution route
  app.post("/api/execute", async (req, res) => {
    try {
      const { code, language, projectId } = req.body;

      if (!code || !language) {
        return res.status(400).json({ message: "Code and language are required" });
      }

      // Create temporary directory for execution
      const tempDir = path.join(__dirname, `../temp/${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      let output = "";
      let error = "";

      try {
        if (language === "javascript") {
          // Write code to temporary file
          const tempFile = path.join(tempDir, "temp.js");
          fs.writeFileSync(tempFile, code);

          // Execute with Node.js
          const child = spawn("node", [tempFile], { cwd: tempDir });

          child.stdout.on("data", (data) => {
            output += data.toString();
          });

          child.stderr.on("data", (data) => {
            error += data.toString();
          });

          await new Promise((resolve) => {
            child.on("close", resolve);
          });
        } else if (language === "python") {
          // Write code to temporary file
          const tempFile = path.join(tempDir, "temp.py");
          fs.writeFileSync(tempFile, code);

          // Execute with Python
          const child = spawn("python3", [tempFile], { cwd: tempDir });

          child.stdout.on("data", (data) => {
            output += data.toString();
          });

          child.stderr.on("data", (data) => {
            error += data.toString();
          });

          await new Promise((resolve) => {
            child.on("close", resolve);
          });
        } else {
          return res.status(400).json({ message: "Unsupported language" });
        }

        res.json({
          output: output || "Code executed successfully",
          error: error || null,
        });
      } finally {
        // Clean up temporary files
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      res.status(500).json({ message: "Code execution failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'execute') {
          const { code, language, projectId } = data;
          
          // Broadcast execution start
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'execution_start',
                timestamp: new Date().toISOString(),
              }));
            }
          });

          // Execute code and broadcast results
          try {
            const tempDir = path.join(__dirname, `../temp/${Date.now()}`);
            fs.mkdirSync(tempDir, { recursive: true });

            let output = "";
            let error = "";

            if (language === "javascript") {
              const tempFile = path.join(tempDir, "temp.js");
              fs.writeFileSync(tempFile, code);

              const child = spawn("node", [tempFile], { cwd: tempDir });

              child.stdout.on("data", (data) => {
                const outputChunk = data.toString();
                output += outputChunk;
                
                // Broadcast output in real-time
                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: 'output',
                      content: outputChunk,
                      timestamp: new Date().toISOString(),
                    }));
                  }
                });
              });

              child.stderr.on("data", (data) => {
                const errorChunk = data.toString();
                error += errorChunk;
                
                // Broadcast error in real-time
                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: 'error',
                      content: errorChunk,
                      timestamp: new Date().toISOString(),
                    }));
                  }
                });
              });

              child.on("close", (code) => {
                // Broadcast execution complete
                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      type: 'execution_complete',
                      exitCode: code,
                      timestamp: new Date().toISOString(),
                    }));
                  }
                });

                // Clean up
                fs.rmSync(tempDir, { recursive: true, force: true });
              });
            }
          } catch (execError) {
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'error',
                  content: `Execution failed: ${execError instanceof Error ? execError.message : "Unknown error"}`,
                  timestamp: new Date().toISOString(),
                }));
              }
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
