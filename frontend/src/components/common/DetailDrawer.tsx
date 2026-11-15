import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Backdrop with fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Panel with smooth slide-and-fade entrance (x: 100% to 0%) */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full max-w-2xl bg-white dark:bg-[#07172B] border-l border-slate-200 dark:border-slate-700/80 shadow-2xl flex flex-col h-full"
          >
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#10243D]">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-[#F4F7FC]">{title}</h2>
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-[#9FB1C7] mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close detail drawer"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-[#9FB1C7] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
