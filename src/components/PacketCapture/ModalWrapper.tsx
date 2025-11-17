import React from 'react';
import { IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  title,
  onClose,
  children,
  maxWidth = '2xl'
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div
        className={cn(
          "apple-card rounded-3xl shadow-2xl flex flex-col overflow-hidden w-full",
          maxWidth === 'sm' && 'max-w-sm',
          maxWidth === 'md' && 'max-w-md',
          maxWidth === 'lg' && 'max-w-lg',
          maxWidth === 'xl' && 'max-w-xl',
          maxWidth === '2xl' && 'max-w-2xl',
          maxWidth === 'full' && 'max-w-6xl',
          "max-h-[90vh]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-black uppercase tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="apple-button rounded-lg p-2 text-black hover:shadow-sm transition-all"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
