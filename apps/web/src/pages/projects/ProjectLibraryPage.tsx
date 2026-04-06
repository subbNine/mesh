import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { closestCenter, DndContext, PointerSensor, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import type { IProjectDocument, IProjectFile } from '@mesh/shared';
import { FilePlus2, FolderPlus, Sparkles, Upload } from 'lucide-react';
import { LibraryItem } from '../../components/projects/LibraryItem';
import { FolderView } from '../../components/projects/FolderView';
import { FilePreviewLightbox } from '../../components/projects/FilePreviewLightbox';
import { UploadProgress } from '../../components/projects/UploadProgress';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useLibraryStore } from '../../store/library.store';
import { useProjectStore } from '../../store/project.store';

function RootDropzone({ isActive }: Readonly<{ isActive: boolean }>) {
  const { isOver, setNodeRef } = useDroppable({ id: 'root-dropzone' });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border border-dashed px-4 py-3 text-sm transition ${
        isOver
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border/60 bg-card/40 text-muted-foreground'
      }`}
    >
      {isActive ? 'Drop here to move this item back to the library root' : 'Drag items onto a folder to organise the library'}
    </div>
  );
}

function getWordCount(content: Record<string, unknown> | null | undefined) {
  const raw = JSON.stringify(content ?? {})
    .replaceAll(/<[^>]+>/g, ' ')
    .replaceAll(/[^\w\s]/g, ' ')
    .trim();

  if (!raw) {
    return 0;
  }

  return raw.split(/\s+/).filter(Boolean).length;
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectLibraryPage() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentProject = useProjectStore((state) => state.currentProject);
  const {
    currentFolder,
    folders,
    documents,
    files,
    uploadProgress,
    isLoading,
    fetchLibrary,
    createFolder,
    deleteFolder,
    createDocument,
    uploadFiles,
    renameFile,
    deleteDocument,
    deleteFile,
    moveItem,
  } = useLibraryStore();

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [previewFile, setPreviewFile] = useState<IProjectFile | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (projectId) {
      void fetchLibrary(projectId);
    }
  }, [projectId, fetchLibrary]);

  const handleCreateDocument = async () => {
    if (!projectId || !workspaceId) {
      return;
    }

    const created = await createDocument(projectId, { folderId: currentFolder?.id });
    navigate(`/w/${workspaceId}/p/${projectId}/docs/${created.id}`);
  };

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!projectId || !event.target.files?.length) {
      return;
    }

    await uploadFiles(projectId, Array.from(event.target.files), currentFolder?.id);
    event.target.value = '';
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!projectId || !event.over) {
      return;
    }

    const itemId = event.active.data.current?.itemId as string | undefined;
    const itemType = event.active.data.current?.itemType as 'document' | 'file' | 'folder' | undefined;

    if (!itemId || itemType === 'folder' || !itemType) {
      return;
    }

    const overId = String(event.over.id);
    let destinationFolderId: string | null | undefined;

    if (overId === 'root-dropzone') {
      destinationFolderId = null;
    } else if (overId.startsWith('folder-')) {
      destinationFolderId = overId.replace('folder-', '');
    }

    if (destinationFolderId === undefined) {
      return;
    }

    await moveItem(projectId, itemId, itemType, destinationFolderId);
  };

  const openFile = (file: IProjectFile) => {
    if (file.mimeType.startsWith('image/')) {
      setPreviewFile(file);
      return;
    }

    globalThis.open(file.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-border/60 bg-card/70 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
              <Sparkles size={12} />
              Docs & files
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-foreground">
                {currentProject?.name ?? 'Project'} library
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Keep briefs, specs, PDFs, brand assets, and lightweight docs close to the work.
              </p>
            </div>
            <FolderView currentFolder={currentFolder} onRootClick={() => projectId && void fetchLibrary(projectId)} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" icon={<FolderPlus size={14} />} onClick={() => setIsFolderModalOpen(true)}>
              New folder
            </Button>
            <Button size="sm" variant="secondary" icon={<FilePlus2 size={14} />} onClick={() => void handleCreateDocument()}>
              New document
            </Button>
            <Button size="sm" icon={<Upload size={14} />} onClick={() => fileInputRef.current?.click()}>
              Upload file
            </Button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesSelected} />
          </div>
        </div>
      </div>

      <UploadProgress progress={uploadProgress} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void handleDragEnd(event)}>
        <RootDropzone isActive={Boolean(currentFolder)} />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-3xl border border-border/50 bg-muted/30" />
            ))}
          </div>
        ) : folders.length === 0 && documents.length === 0 && files.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-border/70 bg-card/60 p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles size={20} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">This library is still empty</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Add a folder, upload files, or create a quick project doc to keep important context in one place.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {folders.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Folders</h3>
                  <span className="text-xs text-muted-foreground">{folders.length} item(s)</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {folders.map((folder) => (
                    <LibraryItem
                      key={folder.id}
                      type="folder"
                      item={folder}
                      title={folder.name}
                      meta={`${folder.itemCount ?? 0} item(s)`}
                      description="Drop documents or files here"
                      onOpen={() => projectId && void fetchLibrary(projectId, folder.id)}
                      onDelete={() => {
                        if (projectId && globalThis.confirm(`Delete “${folder.name}”? Items will be moved to the root.`)) {
                          void deleteFolder(projectId, folder.id);
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {documents.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Documents</h3>
                  <span className="text-xs text-muted-foreground">{documents.length} doc(s)</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {documents.map((document: IProjectDocument) => (
                    <LibraryItem
                      key={document.id}
                      type="document"
                      item={document}
                      title={document.title}
                      description={`${getWordCount(document.content)} words approx.`}
                      meta={`Updated ${formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}`}
                      onOpen={() => navigate(`/w/${workspaceId}/p/${projectId}/docs/${document.id}`)}
                      onDelete={() => {
                        if (projectId && globalThis.confirm(`Delete “${document.title}”?`)) {
                          void deleteDocument(projectId, document.id);
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {files.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Files</h3>
                  <span className="text-xs text-muted-foreground">{files.length} file(s)</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {files.map((file: IProjectFile) => (
                    <LibraryItem
                      key={file.id}
                      type="file"
                      item={file}
                      title={file.name}
                      description={file.mimeType}
                      meta={`${formatBytes(file.sizeBytes)} • added ${formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}`}
                      onOpen={() => openFile(file)}
                      onRename={(name) => projectId ? renameFile(projectId, file.id, name) : undefined}
                      onDelete={() => {
                        if (projectId && globalThis.confirm(`Delete “${file.name}”?`)) {
                          void deleteFile(projectId, file.id);
                        }
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </DndContext>

      <Modal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setFolderName('');
        }}
        title="Create folder"
        description="Organise docs and files with a lightweight one-level folder structure."
      >
        <div className="space-y-4">
          <Input
            label="Folder name"
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="e.g. Specs, Assets, Contracts"
          />

          <div className="flex justify-end gap-2">
            <Button variant="tertiary" size="sm" onClick={() => setIsFolderModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                if (!projectId || !folderName.trim()) {
                  return;
                }
                await createFolder(projectId, folderName.trim());
                setFolderName('');
                setIsFolderModalOpen(false);
              }}
            >
              Create folder
            </Button>
          </div>
        </div>
      </Modal>

      <FilePreviewLightbox file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
