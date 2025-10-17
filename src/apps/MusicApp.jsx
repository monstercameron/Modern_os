import React, { useState, useEffect } from "react";
import { AppShell } from "./AppShell.jsx";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from "lucide-react";
import eventBus, { TOPICS } from '../utils/eventBus';

// Mock music library
const mockTracks = [
  { id: 1, title: "Electric Dreams", artist: "Neon Lights", album: "Synthwave City", duration: 245, albumArt: null },
  { id: 2, title: "Midnight Drive", artist: "Retro Wave", album: "Highway 84", duration: 198, albumArt: null },
  { id: 3, title: "Starlight", artist: "Cosmic Ray", album: "Galaxy Tour", duration: 312, albumArt: null },
  { id: 4, title: "Ocean Breeze", artist: "Chill Beats", album: "Summer Vibes", duration: 267, albumArt: null },
  { id: 5, title: "Tokyo Nights", artist: "City Pop", album: "Urban Dreams", duration: 223, albumArt: null },
  { id: 6, title: "Neon Paradise", artist: "Retro Wave", album: "Highway 84", duration: 189, albumArt: null },
];

export function MusicApp() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  // Subscribe to media control events from MediaControls widget
  useEffect(() => {
    const unsubscribePlay = eventBus.subscribe(TOPICS.MEDIA_PLAY, (data) => {
      // If data includes a track, load it; otherwise just resume
      if (data && data.track) {
        setCurrentTrack(data.track);
      }
      setIsPlaying(true);
    });

    const unsubscribePause = eventBus.subscribe(TOPICS.MEDIA_PAUSE, () => {
      setIsPlaying(false);
    });

    const unsubscribeStop = eventBus.subscribe(TOPICS.MEDIA_STOP, () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    const unsubscribeNext = eventBus.subscribe(TOPICS.MEDIA_NEXT, () => {
      handleNext();
    });

    const unsubscribePrev = eventBus.subscribe(TOPICS.MEDIA_PREV, () => {
      handlePrevious();
    });

    const unsubscribeSeek = eventBus.subscribe(TOPICS.MEDIA_SEEK, (data) => {
      setCurrentTime(data.time);
    });

    return () => {
      unsubscribePlay();
      unsubscribePause();
      unsubscribeStop();
      unsubscribeNext();
      unsubscribePrev();
      unsubscribeSeek();
    };
  }, [currentTrack]);

  // Publish current time updates while playing
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 1;
        eventBus.publish(TOPICS.MEDIA_SEEK, { time: newTime });
        
        // Auto-advance to next track when current ends
        if (newTime >= currentTrack.duration) {
          handleNext();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setIsPlaying(true);
    
    // Publish play event so MediaControls updates
    eventBus.publish(TOPICS.MEDIA_PLAY, { track });
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      eventBus.publish(TOPICS.MEDIA_PAUSE);
    } else {
      if (!currentTrack && mockTracks.length > 0) {
        handlePlayTrack(mockTracks[0]);
      } else {
        setIsPlaying(true);
        eventBus.publish(TOPICS.MEDIA_PLAY, { track: currentTrack });
      }
    }
  };

  const handleNext = () => {
    if (!currentTrack) return;
    const currentIndex = mockTracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % mockTracks.length;
    handlePlayTrack(mockTracks[nextIndex]);
  };

  const handlePrevious = () => {
    if (!currentTrack) return;
    if (currentTime > 3) {
      // If more than 3 seconds into track, restart it
      setCurrentTime(0);
      eventBus.publish(TOPICS.MEDIA_SEEK, { time: 0 });
    } else {
      // Go to previous track
      const currentIndex = mockTracks.findIndex(t => t.id === currentTrack.id);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : mockTracks.length - 1;
      handlePlayTrack(mockTracks[prevIndex]);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AppShell 
      title="Music" 
      subtitle={currentTrack ? `${currentTrack.artist} - ${currentTrack.title}` : "Playlists & albums"}
      actions={
        <button 
          className="px-3 py-1 bg-slate-900 text-white flex items-center gap-2"
          onClick={handlePlayPause}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      }
    >
      <div className="space-y-4">
        {/* Now Playing Section */}
        {currentTrack && (
          <div className="p-4 border rounded-lg bg-slate-50">
            <div className="text-sm font-medium text-slate-600 mb-2">Now Playing</div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center text-3xl">
                🎵
              </div>
              <div className="flex-1">
                <div className="font-medium">{currentTrack.title}</div>
                <div className="text-sm text-slate-500">{currentTrack.artist}</div>
                <div className="text-xs text-slate-400">{currentTrack.album}</div>
              </div>
              <div className="text-sm text-slate-500">
                {formatTime(currentTime)} / {formatTime(currentTrack.duration)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 bg-slate-200 rounded-full h-1">
              <div 
                className="bg-slate-900 rounded-full h-1 transition-all"
                style={{ width: `${(currentTime / currentTrack.duration) * 100}%` }}
              />
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <button 
                className={`p-2 rounded ${shuffle ? 'bg-slate-900 text-white' : 'hover:bg-slate-200'}`}
                onClick={() => setShuffle(!shuffle)}
              >
                <Shuffle className="w-4 h-4" />
              </button>
              <button 
                className="p-2 hover:bg-slate-200 rounded"
                onClick={handlePrevious}
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button 
                className="p-3 bg-slate-900 text-white rounded-full hover:bg-slate-800"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" fill="currentColor" />
                ) : (
                  <Play className="w-5 h-5" fill="currentColor" />
                )}
              </button>
              <button 
                className="p-2 hover:bg-slate-200 rounded"
                onClick={handleNext}
              >
                <SkipForward className="w-5 h-5" />
              </button>
              <button 
                className={`p-2 rounded ${repeat ? 'bg-slate-900 text-white' : 'hover:bg-slate-200'}`}
                onClick={() => setRepeat(!repeat)}
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Track List */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-600">All Tracks</div>
          {mockTracks.map((track) => (
            <div 
              key={track.id} 
              className={`p-3 border flex items-center justify-between rounded hover:bg-slate-50 cursor-pointer ${
                currentTrack?.id === track.id ? 'bg-slate-100 border-slate-900' : ''
              }`}
              onClick={() => handlePlayTrack(track)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center text-xl">
                  {currentTrack?.id === track.id && isPlaying ? '▶️' : '🎵'}
                </div>
                <div>
                  <div className="font-medium">{track.title}</div>
                  <div className="text-xs text-slate-500">{track.artist} • {track.album}</div>
                </div>
              </div>
              <div className="text-sm text-slate-500">{formatTime(track.duration)}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}