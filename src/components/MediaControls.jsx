import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import eventBus, { TOPICS } from '../utils/eventBus';

/**
 * MediaControls - Media player widget for NotificationCenter
 * 
 * Displays current media playback state and controls.
 * Communicates with media apps (MusicApp, VideoApp, etc.) via event bus.
 * 
 * Event Bus Integration:
 * - Subscribes to: TOPICS.MEDIA_PLAY, MEDIA_PAUSE, MEDIA_STOP, MEDIA_SEEK, MEDIA_VOLUME
 * - Publishes: Control events back to media apps
 * 
 * Features:
 * - Album art thumbnail
 * - Track title and artist
 * - Play/Pause/Skip controls
 * - Progress bar with seek
 * - Volume control
 * - Spring animations
 */
const MediaControls = () => {
  const [mediaState, setMediaState] = useState({
    isPlaying: false,
    track: null, // { title, artist, album, albumArt, duration }
    currentTime: 0,
    volume: 0.7,
    isMuted: false
  });

  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  // Subscribe to media events
  useEffect(() => {
    const unsubscribePlay = eventBus.subscribe(TOPICS.MEDIA_PLAY, (data) => {
      setMediaState(prev => ({
        ...prev,
        isPlaying: true,
        track: data.track || prev.track
      }));
    });

    const unsubscribePause = eventBus.subscribe(TOPICS.MEDIA_PAUSE, () => {
      setMediaState(prev => ({ ...prev, isPlaying: false }));
    });

    const unsubscribeStop = eventBus.subscribe(TOPICS.MEDIA_STOP, () => {
      setMediaState(prev => ({
        ...prev,
        isPlaying: false,
        currentTime: 0
      }));
    });

    const unsubscribeSeek = eventBus.subscribe(TOPICS.MEDIA_SEEK, (data) => {
      if (!isDraggingProgress) {
        setMediaState(prev => ({ ...prev, currentTime: data.time }));
      }
    });

    const unsubscribeVolume = eventBus.subscribe(TOPICS.MEDIA_VOLUME, (data) => {
      if (!isDraggingVolume) {
        setMediaState(prev => ({
          ...prev,
          volume: data.level,
          isMuted: data.muted !== undefined ? data.muted : prev.isMuted
        }));
      }
    });

    return () => {
      unsubscribePlay();
      unsubscribePause();
      unsubscribeStop();
      unsubscribeSeek();
      unsubscribeVolume();
    };
  }, [isDraggingProgress, isDraggingVolume]);

  // Auto-increment current time when playing
  useEffect(() => {
    if (!mediaState.isPlaying || !mediaState.track) return;

    const interval = setInterval(() => {
      setMediaState(prev => {
        const newTime = prev.currentTime + 1;
        if (newTime >= prev.track.duration) {
          // Track ended
          eventBus.publish(TOPICS.MEDIA_NEXT);
          return prev;
        }
        return { ...prev, currentTime: newTime };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mediaState.isPlaying, mediaState.track]);

  // Control handlers - publish events to media apps
  const handlePlayPause = () => {
    if (mediaState.isPlaying) {
      eventBus.publish(TOPICS.MEDIA_PAUSE);
    } else {
      eventBus.publish(TOPICS.MEDIA_PLAY);
    }
  };

  const handlePrevious = () => {
    eventBus.publish(TOPICS.MEDIA_PREV);
  };

  const handleNext = () => {
    eventBus.publish(TOPICS.MEDIA_NEXT);
  };

  const handleProgressChange = (e) => {
    if (!mediaState.track) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = Math.max(0, Math.min(mediaState.track.duration, percentage * mediaState.track.duration));
    
    setMediaState(prev => ({ ...prev, currentTime: newTime }));
    eventBus.publish(TOPICS.MEDIA_SEEK, { time: newTime });
  };

  const handleVolumeChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    
    setMediaState(prev => ({ ...prev, volume: percentage, isMuted: false }));
    eventBus.publish(TOPICS.MEDIA_VOLUME, { level: percentage, muted: false });
  };

  const handleMuteToggle = () => {
    const newMuted = !mediaState.isMuted;
    setMediaState(prev => ({ ...prev, isMuted: newMuted }));
    eventBus.publish(TOPICS.MEDIA_VOLUME, { level: mediaState.volume, muted: newMuted });
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /*
   * Nothing playing means nothing to show. This used to render a bordered box
   * with 'No media playing' and eight units of padding, which cost the
   * notification panel roughly 150px of height for the news that there is no
   * news. The section collapses instead.
   */
  if (!mediaState.track) return null;

  const { track, isPlaying, currentTime, volume, isMuted } = mediaState;
  const progress = track.duration > 0 ? (currentTime / track.duration) * 100 : 0;
  const displayVolume = isMuted ? 0 : volume;

  return (
    <motion.div
      className="p-4 border-b"
      style={{ borderColor: 'var(--theme-border)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
    >
      {/* Album Art and Info */}
      <div className="flex gap-3 mb-3">
        {/* Album Art */}
        <div className="w-14 h-14 overflow-hidden flex-shrink-0 bg-[var(--theme-surface-alt)]">
          {track.albumArt ? (
            <img src={track.albumArt} alt={track.album} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--theme-text-muted)] text-xl">
              🎵
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-[12px] text-[var(--theme-text)]">
            {track.title}
          </div>
          <div className="text-[11px] truncate text-[var(--theme-text-muted)]">
            {track.artist}
          </div>
          <div className="text-[11px] truncate text-[var(--theme-text-muted)] opacity-70">
            {track.album}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div
          className="h-1 bg-[var(--theme-border)] cursor-pointer relative group"
          onClick={handleProgressChange}
          onMouseDown={() => setIsDraggingProgress(true)}
          onMouseUp={() => setIsDraggingProgress(false)}
          onMouseLeave={() => setIsDraggingProgress(false)}
        >
          <motion.div
            className="h-full relative bg-[var(--theme-accent)]"
            style={{ width: `${progress}%` }}
            initial={false}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
          >
            {/* Progress thumb */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[var(--theme-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </div>
        <div className="flex justify-between text-[10px] tabular-nums mt-1 text-[var(--theme-text-muted)]">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(track.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <motion.button
            className="p-1.5 transition-colors text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
            onClick={handlePrevious}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
          >
            <SkipBack className="w-5 h-5" />
          </motion.button>

          <motion.button
            className="p-2 rounded-full transition-colors bg-[var(--theme-accent)] text-[var(--theme-accent-text)]"
            onClick={handlePlayPause}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5" fill="currentColor" />
            )}
          </motion.button>

          <motion.button
            className="p-1.5 transition-colors text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
            onClick={handleNext}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
          >
            <SkipForward className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <motion.button
            className="p-1.5 transition-colors text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
            onClick={handleMuteToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </motion.button>

          <div className="w-20 h-1 bg-[var(--theme-border)] cursor-pointer relative group">
            <div
              className="h-full"
              onClick={handleVolumeChange}
              onMouseDown={() => setIsDraggingVolume(true)}
              onMouseUp={() => setIsDraggingVolume(false)}
              onMouseLeave={() => setIsDraggingVolume(false)}
            >
              <motion.div
                className="h-full relative bg-[var(--theme-accent)]"
                style={{ width: `${displayVolume * 100}%` }}
                initial={false}
                transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--theme-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MediaControls;
