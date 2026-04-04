import { useRef } from 'react';
import * as Y from 'yjs';
import { MousePointer2, Type, Image as ImageIcon, MessageSquare, ZoomIn, ZoomOut, Pencil } from 'lucide-react';
import type { IUser } from '@mesh/shared';
import { api } from '../../lib/api';
import { useToast } from '../../store/toast.store';

interface CanvasToolbarProps {
  taskId: string;
  ydoc: Y.Doc;
  currentUser: IUser;
  activeTool: string;
  onToolChange: (tool: string) => void;
  onToggleComments?: () => void;
  showComments?: boolean;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  taskId,
  ydoc,
  currentUser,
  activeTool,
  onToolChange,
  onToggleComments,
  showComments = true,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { success, error } = useToast();

  const handleToolClick = (tool: string) => {
    onToolChange(tool);
    if (tool === 'image') {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { onToolChange('select'); return; }

    const loadingId = crypto.randomUUID();

    try {
      // 1. Show processing placeholder
      const placeholderUrl = URL.createObjectURL(file);
      ydoc.transact(() => {
        const elements = ydoc.getArray<Y.Map<any>>('elements');
        const element = new Y.Map();
        element.set('id', loadingId);
        element.set('type', 'image');
        element.set('content', placeholderUrl);
        element.set('x', globalThis.innerWidth / 2 - 150);
        element.set('y', globalThis.innerHeight / 2 - 100);
        element.set('width', 300);
        element.set('height', 200);
        element.set('zIndex', elements.length);
        element.set('createdBy', currentUser.id);
        element.set('createdAt', new Date().toISOString());
        element.set('opacity', 0.5); // visually indicate loading state
        elements.push([element]);
      });
      onToolChange('select');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // 2. Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId);

      const response = await api.post('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url } = response.data;

      // 3. Update placeholder with successful url
      ydoc.transact(() => {
        const elements = ydoc.getArray<Y.Map<any>>('elements');
        const map = elements.toArray().find((m) => m.get('id') === loadingId);
        if (map) {
          map.set('content', url);
          map.set('opacity', 1.0);
        }
      });
      
      success('Image uploaded successfully');

    } catch (err: any) {
      console.error('Failed to handle file upload', err);
      // Remove placeholder on failure
      ydoc.transact(() => {
        const elements = ydoc.getArray<Y.Map<any>>('elements');
        const index = elements.toArray().findIndex((m) => m.get('id') === loadingId);
        if (index > -1) elements.delete(index, 1);
      });
      error('Image upload failed');
      onToolChange('select');
    }
  };

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select (V)' },
    { id: 'pencil', icon: Pencil,         label: 'Draw (P)' },
    { id: 'text',   icon: Type,          label: 'Text (T)' },
    { id: 'image',  icon: ImageIcon,     label: 'Image (I)' },
    { id: 'comment',icon: MessageSquare, label: 'Comment (C)' },
  ];

  return (
    /* Floating pill centred at bottom — matches the mockup exactly */
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 select-none">
      <div className="bg-white rounded-2xl shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.06)] border border-zinc-200/80 px-2 py-2 flex items-center gap-1">

        {/* Tool buttons */}
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-white shadow-[0_2px_6px_rgba(12,163,186,0.4)]'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
              }`}
              onClick={() => handleToolClick(tool.id)}
              title={tool.label}
            >
              <tool.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
            </button>
          );
        })}

        {/* Separator */}
        <div className="w-px h-5 bg-zinc-200 mx-0.5" />

        {/* Zoom controls */}
        <button
          onClick={onZoomOut}
          className="w-8 h-9 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-[16px] h-[16px]" strokeWidth={2} />
        </button>

        <button
          onClick={onZoomReset}
          className="h-9 px-2.5 flex items-center justify-center rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors tabular-nums min-w-[46px]"
          title="Reset zoom (100%)"
        >
          {Math.round(zoomLevel * 100)}%
        </button>

        <button
          onClick={onZoomIn}
          className="w-8 h-9 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-[16px] h-[16px]" strokeWidth={2} />
        </button>
      </div>

      {/* Hidden image file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
