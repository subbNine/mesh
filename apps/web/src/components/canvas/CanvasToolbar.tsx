import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import * as Y from 'yjs';
import { 
  MousePointer2, 
  Type, 
  Image as ImageIcon, 
  MessageSquare, 
  ZoomIn, 
  ZoomOut, 
  Pencil, 
  Maximize,
  ChevronUp
} from 'lucide-react';
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
  onFitToView: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  taskId,
  ydoc,
  currentUser,
  activeTool,
  onToolChange,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToView,
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
    const placeholderUrl = URL.createObjectURL(file);

    try {
      const img = new globalThis.Image();
      const dimensions = await new Promise<{ w: number; h: number }>((resolve, reject) => {
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = reject;
        img.src = placeholderUrl;
      });

      const MAX_SIZE = 400;
      let { w, h } = dimensions;
      if (w > MAX_SIZE || h > MAX_SIZE) {
        const ratio = w / h;
        if (w > h) { w = MAX_SIZE; h = MAX_SIZE / ratio; }
        else { h = MAX_SIZE; w = MAX_SIZE * ratio; }
      }

      ydoc.transact(() => {
        const elements = ydoc.getArray<Y.Map<any>>('elements');
        const element = new Y.Map();
        element.set('id', loadingId);
        element.set('type', 'image');
        element.set('content', placeholderUrl);
        element.set('x', globalThis.innerWidth / 2 - w / 2);
        element.set('y', globalThis.innerHeight / 2 - h / 2);
        element.set('width', w);
        element.set('height', h);
        element.set('zIndex', elements.length);
        element.set('createdBy', currentUser.id);
        element.set('createdAt', new Date().toISOString());
        element.set('opacity', 0.5); 
        elements.push([element]);
      });

      onToolChange('select');
      if (fileInputRef.current) fileInputRef.current.value = '';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId);

      const response = await api.post('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url } = response.data;

      ydoc.transact(() => {
        const elements = ydoc.getArray<Y.Map<any>>('elements');
        const map = elements.toArray().find((m) => m.get('id') === loadingId);
        if (map) {
          map.set('content', url);
          map.set('opacity', 1.0);
        }
      });
      
      success('Blueprint element added');
    } catch (err: any) {
      console.error('Failed upload', err);
      ydoc.transact(() => {
        const elements = ydoc.getArray<Y.Map<any>>('elements');
        const index = elements.toArray().findIndex((m) => m.get('id') === loadingId);
        if (index > -1) elements.delete(index, 1);
      });
      error('Reference upload failed');
      onToolChange('select');
    } finally {
       URL.revokeObjectURL(placeholderUrl);
    }
  };

  const tools = [
    { id: 'select',  icon: MousePointer2, label: 'Select' },
    { id: 'pencil',  icon: Pencil,         label: 'Draw' },
    { id: 'text',    icon: Type,           label: 'Text' },
    { id: 'image',   icon: ImageIcon,     label: 'Asset' },
    { id: 'comment', icon: MessageSquare, label: 'Comment' },
  ];

  return (
    <div className="select-none flex flex-col items-center">
      {/* Unified Tool and Zoom Dock */}
      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass rounded-[32px] p-2 flex items-center gap-2 backdrop-blur-3xl border border-border/60 shadow-2xl shadow-primary/5"
      >
        {/* Tools Section */}
        <div className="flex items-center gap-1.5 pr-2">
          {tools.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <div key={tool.id} className="relative group">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-12 h-12 flex items-center justify-center rounded-[22px] transition-all relative z-10 ${
                      isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : 'text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground'
                  }`}
                  onClick={() => handleToolClick(tool.id)}
                  >
                  <tool.icon size={20} className={isActive ? 'animate-in zoom-in-75 duration-300' : ''} />
                  
                  {isActive && (
                      <motion.div 
                          layoutId="activeTool"
                          className="absolute inset-0 bg-primary rounded-[22px] -z-10"
                      />
                  )}
                </motion.button>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-y-2 group-hover:translate-y-0 whitespace-nowrap shadow-2xl border border-white/10 z-50">
                    {tool.label}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1"><ChevronUp size={12} className="rotate-180 text-foreground" /></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Separator */}
        <div className="w-[1px] h-8 bg-border/40 mx-1" />

        {/* Zoom Section */}
        <div className="flex items-center gap-1 pl-2">
          <button 
            onClick={onZoomOut} 
            className="w-10 h-10 flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          
          <button 
            onClick={onZoomReset} 
            className="px-3 h-10 flex items-center justify-center text-[11px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl transition-all"
            title="Reset Zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          
          <button 
            onClick={onZoomIn} 
            className="w-10 h-10 flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 rounded-xl transition-all"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>

          <div className="w-[1px] h-4 bg-border/20 mx-1" />

          <button 
            onClick={onFitToView} 
            className="w-10 h-10 flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 rounded-xl transition-all" 
            title="Fit to Workspace"
          >
            <Maximize size={16} />
          </button>
        </div>
      </motion.div>

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
