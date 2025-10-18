import React from "react";

export function AboutApp({ init = {} }) {
  const { appTitle, appIcon } = init;

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
    <div className="h-full w-full bg-white flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="text-6xl mb-4">{appInfo.icon}</div>
        <h1 className="text-3xl font-bold mb-2">{appInfo.title}</h1>
        <p className="text-lg text-slate-600 mb-4">{appInfo.description}</p>
        <p className="text-sm text-slate-500">Version {appInfo.version}</p>
      </div>
    </div>
  );
}
