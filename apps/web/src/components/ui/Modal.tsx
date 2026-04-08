import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (!dialogRef.current?.open) {
        dialogRef.current?.showModal();
      }
      document.body.style.overflow = 'hidden';
    } else {
      dialogRef.current?.close();
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-lg rounded-2xl border border-border/80 bg-card p-0 text-foreground shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] backdrop:bg-slate-950/45 backdrop:backdrop-blur-sm"
      onCancel={handleClose}
    >
      <div className="relative p-6 sm:p-7">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close modal"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="pr-10">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}
