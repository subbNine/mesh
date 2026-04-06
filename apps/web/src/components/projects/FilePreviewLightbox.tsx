import type { IProjectFile } from '@mesh/shared';
import { ExternalLink, X } from 'lucide-react';

interface FilePreviewLightboxProps {
  file: IProjectFile | null;
  onClose: () => void;
}

export function FilePreviewLightbox({ file, onClose }: FilePreviewLightboxProps) {
  if (!file) {
    return null;
  }

  const isImage = file.mimeType.startsWith('image/');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-zinc-400">{file.mimeType}</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
            >
              <ExternalLink size={14} />
              Open in new tab
            </a>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-auto p-4">
          {isImage ? (
            <img src={file.url} alt={file.name} className="mx-auto max-h-[68vh] rounded-2xl object-contain" />
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
              <p className="text-lg font-semibold">Preview is limited for this file type</p>
              <p className="max-w-md text-sm text-zinc-400">
                Open the file in a new tab or download it using the link above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
