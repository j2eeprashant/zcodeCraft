import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  File, 
  Folder, 
  FolderOpen, 
  Plus, 
  FolderPlus, 
  Trash2,
  MoreHorizontal,
  FileCode,
  FileText,
  Image,
  Settings
} from "lucide-react";
import type { File as FileType } from "@shared/schema";

interface FileExplorerProps {
  files: FileType[];
  onFileSelect: (file: FileType) => void;
  activeFileId: number | null;
}

export default function FileExplorer({ files, onFileSelect, activeFileId }: FileExplorerProps) {
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set([1])); // Default expand root folder
  const queryClient = useQueryClient();

  const createFileMutation = useMutation({
    mutationFn: async (data: { name: string; path: string; projectId: number; parentId?: number }) => {
      return apiRequest("POST", "/api/files", {
        ...data,
        content: "",
        type: "file",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setNewFileName("");
      setIsNewFileDialogOpen(false);
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
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setNewFolderName("");
      setIsNewFolderDialogOpen(false);
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      return apiRequest("DELETE", `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const handleCreateFile = () => {
    if (!newFileName.trim() || files.length === 0) return;
    
    const projectId = files[0]?.projectId;
    if (!projectId) return;

    createFileMutation.mutate({
      name: newFileName,
      path: newFileName,
      projectId,
    });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim() || files.length === 0) return;
    
    const projectId = files[0]?.projectId;
    if (!projectId) return;

    createFolderMutation.mutate({
      name: newFolderName,
      path: newFolderName,
      projectId,
    });
  };

  const handleDeleteFile = (file: FileType) => {
    if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
      deleteFileMutation.mutate(file.id);
    }
  };

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (file: FileType) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.id) ? (
        <FolderOpen className="w-4 h-4 accent-blue" />
      ) : (
        <Folder className="w-4 h-4 accent-blue" />
      );
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileCode className="w-4 h-4 accent-yellow" />;
      case 'html':
      case 'htm':
        return <FileCode className="w-4 h-4 accent-orange" />;
      case 'css':
      case 'scss':
      case 'sass':
        return <FileCode className="w-4 h-4 text-pink-400" />;
      case 'py':
        return <FileCode className="w-4 h-4 accent-green" />;
      case 'json':
        return <Settings className="w-4 h-4 accent-yellow" />;
      case 'md':
      case 'markdown':
        return <FileText className="w-4 h-4 text-gray-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-purple-400" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  const buildFileTree = (files: FileType[], parentId: number | null = null): FileType[] => {
    return files
      .filter(file => file.parentId === parentId)
      .sort((a, b) => {
        // Folders first, then files
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
  };

  const renderFileTree = (files: FileType[], level: number = 0): JSX.Element[] => {
    return files.map(file => (
      <div key={file.id} style={{ marginLeft: `${level * 16}px` }}>
        <div
          className={`file-tree-item px-2 py-1 rounded text-sm cursor-pointer flex items-center justify-between group ${
            activeFileId === file.id ? 'active bg-gray-700' : ''
          }`}
          onClick={() => {
            if (file.type === 'folder') {
              toggleFolder(file.id);
            } else {
              onFileSelect(file);
            }
          }}
        >
          <div className="flex items-center space-x-2">
            {getFileIcon(file)}
            <span className="text-ide-primary">{file.name}</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFile(file);
              }}
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </Button>
          </div>
        </div>
        
        {file.type === 'folder' && expandedFolders.has(file.id) && (
          <div>
            {renderFileTree(buildFileTree(files, file.id), level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const rootFiles = buildFileTree(files);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-2">
        <div className="flex items-center justify-between text-xs text-ide-secondary mb-2 px-2">
          <span>FILES</span>
          <div className="flex space-x-1">
            <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-700">
                  <Plus className="w-3 h-3" />
                </Button>
              </DialogTrigger>
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
                    <Button variant="outline" onClick={() => setIsNewFileDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFile} disabled={!newFileName.trim()}>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-700">
                  <FolderPlus className="w-3 h-3" />
                </Button>
              </DialogTrigger>
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
                    <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="space-y-1">
          {renderFileTree(rootFiles)}
        </div>
      </div>
    </div>
  );
}
