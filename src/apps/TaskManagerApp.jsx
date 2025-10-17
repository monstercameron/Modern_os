import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "./AppShell.jsx";
import { motion } from "framer-motion";
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Maximize2, 
  Minimize2, 
  X, 
  Focus,
  AlertCircle
} from "lucide-react";
import eventBus, { TOPICS } from '../utils/eventBus';

/**
 * Task Manager App
 * Shows all running windows with mock resource usage
 * Allows focus, minimize, and close actions on windows
 * Subscribes to window events for live updates
 * 
 * Keyboard shortcut: Ctrl+Shift+Esc (handled in App.jsx)
 */
export function TaskManagerApp() {
  const [processes, setProcesses] = useState([]);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'memory', 'cpu'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  // Mock resource usage generator
  const generateResourceUsage = useCallback(() => {
    return {
      memory: Math.floor(Math.random() * 300) + 50, // 50-350 MB
      cpu: Math.floor(Math.random() * 60) + 5, // 5-65%
    };
  }, []);

  // Subscribe to window events
  useEffect(() => {
    // Subscribe to window state changes
    const unsubscribeOpen = eventBus.subscribe(TOPICS.WINDOW_OPEN, (data) => {
      setProcesses(prev => {
        // Check if already exists
        if (prev.find(p => p.windowId === data.windowId)) return prev;
        
        return [...prev, {
          windowId: data.windowId,
          appName: data.appName || 'Unknown App',
          appId: data.appId,
          status: data.minimized ? 'Minimized' : 'Running',
          ...generateResourceUsage(),
          startTime: Date.now()
        }];
      });
    });

    const unsubscribeClose = eventBus.subscribe(TOPICS.WINDOW_CLOSE, (data) => {
      setProcesses(prev => prev.filter(p => p.windowId !== data.windowId));
    });

    const unsubscribeMinimize = eventBus.subscribe(TOPICS.WINDOW_MINIMIZE, (data) => {
      setProcesses(prev => prev.map(p => 
        p.windowId === data.windowId 
          ? { ...p, status: 'Minimized' }
          : p
      ));
    });

    const unsubscribeRestore = eventBus.subscribe(TOPICS.WINDOW_RESTORE, (data) => {
      setProcesses(prev => prev.map(p => 
        p.windowId === data.windowId 
          ? { ...p, status: 'Running' }
          : p
      ));
    });

    const unsubscribeFocus = eventBus.subscribe(TOPICS.WINDOW_FOCUS, (data) => {
      setProcesses(prev => prev.map(p => 
        p.windowId === data.windowId 
          ? { ...p, status: 'Active' }
          : p.status === 'Active' 
            ? { ...p, status: 'Running' }
            : p
      ));
    });

    // Update resource usage every 2 seconds
    const resourceInterval = setInterval(() => {
      setProcesses(prev => prev.map(p => ({
        ...p,
        ...generateResourceUsage()
      })));
    }, 2000);

    return () => {
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeMinimize();
      unsubscribeRestore();
      unsubscribeFocus();
      clearInterval(resourceInterval);
    };
  }, [generateResourceUsage]);

  // Action handlers
  const handleFocus = useCallback((windowId) => {
    eventBus.publish(TOPICS.WINDOW_FOCUS, { windowId });
  }, []);

  const handleMinimize = useCallback((windowId) => {
    eventBus.publish(TOPICS.WINDOW_MINIMIZE, { windowId });
  }, []);

  const handleClose = useCallback((windowId) => {
    eventBus.publish(TOPICS.WINDOW_CLOSE, { windowId });
  }, []);

  // Sort processes
  const sortedProcesses = [...processes].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'name':
        compareValue = a.appName.localeCompare(b.appName);
        break;
      case 'memory':
        compareValue = a.memory - b.memory;
        break;
      case 'cpu':
        compareValue = a.cpu - b.cpu;
        break;
      default:
        compareValue = 0;
    }
    
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Calculate totals
  const totalMemory = processes.reduce((sum, p) => sum + p.memory, 0);
  const avgCpu = processes.length > 0 
    ? Math.round(processes.reduce((sum, p) => sum + p.cpu, 0) / processes.length)
    : 0;

  return (
    <AppShell 
      title="Task Manager" 
      subtitle={`${processes.length} process${processes.length !== 1 ? 'es' : ''} running`}
      actions={
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            <span>{totalMemory} MB</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            <span>{avgCpu}%</span>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* System Overview */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border-b">
          <motion.div 
            className="p-3 bg-white rounded-lg border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <div className="text-xs font-medium text-slate-600">Processes</div>
            </div>
            <div className="text-2xl font-bold">{processes.length}</div>
          </motion.div>

          <motion.div 
            className="p-3 bg-white rounded-lg border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8, delay: 0.05 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-green-500" />
              <div className="text-xs font-medium text-slate-600">Memory</div>
            </div>
            <div className="text-2xl font-bold">{totalMemory} MB</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <motion.div 
                className="bg-green-500 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalMemory / 2048) * 100, 100)}%` }}
                transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
              />
            </div>
          </motion.div>

          <motion.div 
            className="p-3 bg-white rounded-lg border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-purple-500" />
              <div className="text-xs font-medium text-slate-600">CPU</div>
            </div>
            <div className="text-2xl font-bold">{avgCpu}%</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <motion.div 
                className="bg-purple-500 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${avgCpu}%` }}
                transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
              />
            </div>
          </motion.div>
        </div>

        {/* Process List */}
        <div className="flex-1 overflow-auto">
          {processes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <AlertCircle className="w-12 h-12 mb-3" />
              <div className="text-sm">No processes running</div>
              <div className="text-xs">Open some apps to see them here</div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-100 sticky top-0">
                <tr className="text-xs text-slate-600">
                  <th 
                    className="text-left px-4 py-3 font-medium cursor-pointer hover:bg-slate-200 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      App Name
                      {sortBy === 'name' && (
                        <span className="text-slate-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Window ID</th>
                  <th 
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:bg-slate-200 transition-colors"
                    onClick={() => handleSort('memory')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Memory
                      {sortBy === 'memory' && (
                        <span className="text-slate-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:bg-slate-200 transition-colors"
                    onClick={() => handleSort('cpu')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      CPU
                      {sortBy === 'cpu' && (
                        <span className="text-slate-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProcesses.map((process, index) => (
                  <motion.tr
                    key={process.windowId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 400, 
                      damping: 30, 
                      mass: 0.8,
                      delay: index * 0.02
                    }}
                    className="border-b hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{process.appName}</div>
                      <div className="text-xs text-slate-500">{process.appId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                      {process.windowId}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium">{process.memory} MB</div>
                      <div className="w-20 bg-slate-200 rounded-full h-1 mt-1 ml-auto">
                        <motion.div 
                          className="bg-green-500 h-1 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((process.memory / 350) * 100, 100)}%` }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-medium">{process.cpu}%</div>
                      <div className="w-20 bg-slate-200 rounded-full h-1 mt-1 ml-auto">
                        <motion.div 
                          className="bg-purple-500 h-1 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${process.cpu}%` }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        process.status === 'Active' 
                          ? 'bg-blue-100 text-blue-700'
                          : process.status === 'Minimized'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-green-100 text-green-700'
                      }`}>
                        {process.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <motion.button
                          onClick={() => handleFocus(process.windowId)}
                          className="p-1.5 hover:bg-slate-200 rounded transition-colors"
                          title="Focus window"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
                        >
                          <Maximize2 className="w-4 h-4 text-slate-600" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleMinimize(process.windowId)}
                          className="p-1.5 hover:bg-slate-200 rounded transition-colors"
                          title="Minimize window"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
                        >
                          <Minimize2 className="w-4 h-4 text-slate-600" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleClose(process.windowId)}
                          className="p-1.5 hover:bg-red-100 rounded transition-colors"
                          title="Close window"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
