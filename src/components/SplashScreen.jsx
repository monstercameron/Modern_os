import React, { memo } from 'react';
import { motion } from 'framer-motion';

/**
 * Splash Screen Component
 * Shows a loading screen while an app initializes
 * Minimum display time: 100ms
 * 
 * @param {Object} props
 * @param {string} props.title - App title
 * @param {React.Component} props.icon - App icon component
 * @param {string} props.color - Background color class
 * @param {string} props.type - Splash type: 'logo', 'spinner', 'loader', 'terminal', 'minimal'
 */
export const SplashScreen = memo(function SplashScreen({ 
  title, 
  icon: Icon, 
  color = 'bg-slate-700',
  type = 'logo'
}) {
  
  const renderSplashContent = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full"
            />
            <div className="text-white/90 font-semibold">{title}</div>
            <div className="text-white/60 text-sm">Loading...</div>
          </div>
        );
      
      case 'loader':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Icon size={48} className="text-white/90" />
            <div className="text-white/90 font-semibold">{title}</div>
            <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white/80"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              />
            </div>
          </div>
        );
      
      case 'terminal':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-2 font-mono">
            <Icon size={48} className="text-green-400/90" />
            <div className="text-green-400/90 font-semibold text-lg">{title}</div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-green-400/70 text-sm"
            >
              $ Initializing...
            </motion.div>
          </div>
        );
      
      case 'minimal':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Icon size={40} className="text-white/90" />
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/70 text-sm"
            >
              Loading {title}...
            </motion.div>
          </div>
        );
      
      case 'logo':
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Icon size={64} className="text-white/90" />
            </motion.div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white/90 font-semibold text-xl"
            >
              {title}
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className={`absolute inset-0 ${color} flex items-center justify-center`}>
      {renderSplashContent()}
    </div>
  );
});
