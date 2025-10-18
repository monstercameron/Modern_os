import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export function AboutDialog({ appTitle, appIcon, onClose }) {
  const aboutMessages = {
    browser: {
      icon: '🌐',
      title: 'Browser',
      description: 'A modern web browser for Modern OS',
      version: '1.0.0'
    },
    terminal: {
      icon: '⌨️',
      title: 'Terminal',
      description: 'A powerful terminal emulator for Modern OS',
      version: '1.0.0'
    }
  };

  const appInfo = aboutMessages[appTitle?.toLowerCase()] || {
    icon: appIcon || '❓',
    title: appTitle || 'Application',
    description: 'A Modern OS application',
    version: '1.0.0'
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl w-96"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">About {appTitle}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="text-6xl mb-4">{appInfo.icon}</div>
          <h1 className="text-3xl font-bold mb-2">{appInfo.title}</h1>
          <p className="text-lg text-slate-600 mb-4">{appInfo.description}</p>
          <p className="text-sm text-slate-500">Version {appInfo.version}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
