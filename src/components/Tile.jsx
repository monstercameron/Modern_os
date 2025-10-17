import React, { useState, memo, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Plus, Mail, MessageCircle, Calendar, FileText, Image, Cloud } from "lucide-react";

export const Tile = memo(function Tile({ app, onOpen, onQuick, badge = 0 }) {
  const Icon = app.icon;
  const [hv, setHv] = useState(false);
  const [playing, setPlaying] = useState(false);
  
  const renderContent = useCallback(() => {
    // Email - show unread count and quick compose
    if (app.id === 'email') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold flex items-center gap-2">
                {app.title}
                {badge > 0 && <span className="text-xs bg-white/30 px-1.5 py-0.5 rounded">{badge}</span>}
              </div>
              {badge > 0 && (
                <div className="text-white/90 text-[10px] mt-1">
                  <div className="font-medium truncate">📧 Re: Project Update</div>
                  <div className="text-white/70">From: team@company.com</div>
                </div>
              )}
            </div>
            <Mail className="opacity-90" size={24} />
          </div>
          {hv && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({action:'compose'});}} className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                ✉️ Compose New
              </button>
            </motion.div>
          )}
        </div>
      );
    }
    
    // Messages - show unread and quick reply
    if (app.id === 'messages') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold flex items-center gap-2">
                {app.title}
                {badge > 0 && <span className="text-xs bg-white/30 px-1.5 py-0.5 rounded">{badge}</span>}
              </div>
              {badge > 0 && (
                <div className="text-white/90 text-[10px] mt-1">
                  <div className="font-medium">Sarah Johnson</div>
                  <div className="text-white/70 truncate">"See you at the meeting..."</div>
                </div>
              )}
            </div>
            <MessageCircle className="opacity-90" size={24} />
          </div>
          {hv && badge > 0 && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="space-y-1">
              <div className="text-[9px] text-white/80 bg-black/20 px-2 py-1">⏰ 2 min ago</div>
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({action:'reply', contact:'Sarah Johnson'});}} className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                💬 Reply to Sarah
              </button>
            </motion.div>
          )}
        </div>
      );
    }
    
    // Chat - show most active conversation
    if (app.id === 'chat') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/90 text-[10px] mt-1">
                <div className="font-medium">Team Standup</div>
                <div className="text-white/70 truncate">Alex: "Let's sync up at 3pm"</div>
              </div>
            </div>
            <MessageCircle className="opacity-90" size={24} />
          </div>
          {hv && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="space-y-1">
              <div className="text-[9px] text-white/80 bg-black/20 px-2 py-1">👥 12 members • 5 new</div>
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({action:'openChat', chat:'team-standup'});}} className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                💬 Open Chat
              </button>
            </motion.div>
          )}
        </div>
      );
    }
    
    // Calendar - show today's events
    if (app.id === 'calendar') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/70 text-[11px] mt-1">Today: 3 events</div>
            </div>
            <Calendar className="opacity-90" size={24} />
          </div>
          {hv && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="space-y-1">
              <div className="text-[9px] text-white/80 bg-black/20 px-2 py-1">9:00 Team Meeting</div>
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({action:'addEvent'});}} className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                ➕ Add Event
              </button>
            </motion.div>
          )}
        </div>
      );
    }
    
    // Tasks - show pending count
    if (app.id === 'tasks') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/70 text-[11px] mt-1">Pending: 7 tasks</div>
            </div>
            <Icon className="opacity-90" size={24} />
          </div>
          {hv && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="space-y-1">
              <div className="text-[9px] text-white/80 bg-black/20 px-2 py-1">✓ Finish presentation</div>
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({action:'addTask'});}} className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                ➕ Add Task
              </button>
            </motion.div>
          )}
        </div>
      );
    }
    
    // Notes - show recent notes
    if (app.id === 'notes') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/70 text-[11px] mt-1">12 notes</div>
            </div>
            <FileText className="opacity-90" size={24} />
          </div>
          {hv && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="space-y-1">
              <div className="text-[9px] text-white/80 bg-black/20 px-2 py-1 truncate">📝 Meeting notes...</div>
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({action:'newNote'});}} className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                ➕ New Note
              </button>
            </motion.div>
          )}
        </div>
      );
    }
    
    // Music - now playing with controls
    if (app.id === 'music') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-white/30 grid place-items-center text-white/80 text-[10px] font-semibold flex-shrink-0">🎵</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">Summer Vibes</div>
              <div className="text-white/70 text-[11px] truncate">Artist Name</div>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={(e)=>{e.stopPropagation(); setPlaying(p=>!p);}} className="flex-1 px-2 py-1.5 bg-black/30 border border-white/30 text-[11px] font-medium flex items-center justify-center gap-1">
              {playing ? <><Pause size={12}/> Pause</> : <><Play size={12}/> Play</>}
            </button>
            <button onClick={(e)=>{e.stopPropagation();}} className="px-2 py-1.5 bg-black/30 border border-white/30 text-[11px]">
              ⏭️
            </button>
          </div>
        </div>
      );
    }
    
    // Video - continue watching
    if (app.id === 'video') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/90 text-[10px] mt-1">
                <div className="font-medium truncate">Nature Documentary</div>
                <div className="text-white/70">⏱️ 23:45 / 45:00</div>
              </div>
            </div>
            <Icon className="opacity-90" size={24} />
          </div>
          <div className="space-y-1">
            <div className="h-1 bg-black/30 rounded-full overflow-hidden">
              <div className="h-full bg-white/80" style={{width: '52%'}}></div>
            </div>
            {hv && (
              <motion.button initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({action:'resume', video:'nature-doc'});}} className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                ▶️ Continue Watching
              </motion.button>
            )}
          </div>
        </div>
      );
    }
    
    // Photos - recent photos preview
    if (app.id === 'photos') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/70 text-[11px] mt-1">1,234 photos</div>
            </div>
            <Image className="opacity-90" size={24} />
          </div>
          {hv && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="grid grid-cols-3 gap-1">
              {[1,2,3].map(i=>(
                <div key={i} className="aspect-square bg-white/30 grid place-items-center text-[10px]">📷</div>
              ))}
            </motion.div>
          )}
        </div>
      );
    }
    
    // Maps - predict next destination
    if (app.id === 'maps') {
      const hour = new Date().getHours();
      const destination = hour >= 17 ? 'Home' : hour >= 8 ? 'Work' : 'Coffee Shop';
      const eta = hour >= 17 ? '15 min' : hour >= 8 ? '12 min' : '5 min';
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/90 text-[10px] mt-1">
                <div className="font-medium">📍 {destination}</div>
                <div className="text-white/70">🚗 {eta} via Market St</div>
              </div>
            </div>
            <Icon className="opacity-90" size={24} />
          </div>
          {hv && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="space-y-1">
              <div className="text-[9px] text-white/80 bg-black/20 px-2 py-1">Traffic: Light</div>
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({action:'navigate', destination});}} className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                🗺️ Start Navigation
              </button>
            </motion.div>
          )}
        </div>
      );
    }
    
    // Weather - current conditions
    if (app.id === 'weather') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/70 text-[11px] mt-1">San Francisco</div>
            </div>
            <Cloud className="opacity-90" size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold">72°</div>
            <div className="text-[11px] text-white/80">Partly Cloudy</div>
          </div>
        </div>
      );
    }
    
    // Files - recent files
    if (app.id === 'files') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/70 text-[11px] mt-1">Quick access</div>
            </div>
            <Icon className="opacity-90" size={24} />
          </div>
          {hv && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="space-y-1">
              <div className="text-[9px] text-white/80 bg-black/20 px-2 py-1 truncate">📄 Project.docx</div>
              <div className="text-[9px] text-white/80 bg-black/20 px-2 py-1 truncate">📊 Report.xlsx</div>
            </motion.div>
          )}
        </div>
      );
    }
    
    // Terminal - last command
    if (app.id === 'terminal') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/90 text-[9px] mt-1 font-mono bg-black/20 px-1 py-0.5 truncate">
                $ npm run dev
              </div>
            </div>
            <Icon className="opacity-90" size={24} />
          </div>
          {hv && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="space-y-1">
              <div className="text-[9px] text-white/80 bg-black/20 px-2 py-1 font-mono">✓ Exit code: 0</div>
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({action:'rerun', command:'npm run dev'});}} className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                🔄 Re-run Command
              </button>
            </motion.div>
          )}
        </div>
      );
    }
    
    // Browser - quick bookmarks
    if (app.id === 'browser') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/70 text-[11px] mt-1">Bookmarks</div>
            </div>
            <Icon className="opacity-90" size={24} />
          </div>
          {hv && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="flex gap-1">
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({url:'https://www.msn.com'});}} className="flex-1 px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                MSN
              </button>
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({url:'https://news.google.com'});}} className="flex-1 px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                News
              </button>
            </motion.div>
          )}
        </div>
      );
    }
    
    // Code editor - recent files
    if (app.id === 'code') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/90 text-[9px] mt-1 space-y-0.5">
                <div className="font-mono bg-black/20 px-1 py-0.5 truncate">📄 App.jsx:142</div>
                <div className="font-mono bg-black/20 px-1 py-0.5 truncate text-white/70">📄 utils.js:56</div>
              </div>
            </div>
            <Icon className="opacity-90" size={24} />
          </div>
          {hv && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({action:'openRecent', file:'App.jsx'});}} className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                📝 Open Recent
              </button>
            </motion.div>
          )}
        </div>
      );
    }
    
    // PDF - recent documents
    if (app.id === 'pdf') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/90 text-[10px] mt-1">
                <div className="font-medium truncate">Q3 Report.pdf</div>
                <div className="text-white/70">📄 Page 12 of 24</div>
              </div>
            </div>
            <Icon className="opacity-90" size={24} />
          </div>
          {hv && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="space-y-1">
              <div className="h-1 bg-black/30 rounded-full overflow-hidden">
                <div className="h-full bg-white/80" style={{width: '50%'}}></div>
              </div>
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({action:'continue', file:'Q3-report.pdf', page:12});}} className="w-full px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                📖 Continue Reading
              </button>
            </motion.div>
          )}
        </div>
      );
    }
    
    // Contacts - frequent contacts
    if (app.id === 'contacts') {
      return (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold">{app.title}</div>
              <div className="text-white/90 text-[10px] mt-1 space-y-0.5">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-white/30 rounded-full grid place-items-center text-[8px]">SJ</div>
                  <span className="text-white/90">Sarah Johnson</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-white/30 rounded-full grid place-items-center text-[8px]">MC</div>
                  <span className="text-white/70">Mike Chen</span>
                </div>
              </div>
            </div>
            <Icon className="opacity-90" size={24} />
          </div>
          {hv && (
            <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="flex gap-1">
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({action:'call', contact:'Sarah Johnson'});}} className="flex-1 px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                📞 Call
              </button>
              <button onClick={(e)=>{e.stopPropagation(); onQuick && onQuick({action:'message', contact:'Sarah Johnson'});}} className="flex-1 px-2 py-1 bg-black/30 border border-white/30 text-[10px] font-medium">
                💬 Text
              </button>
            </motion.div>
          )}
        </div>
      );
    }
    
    // Text - recent document
    if (app.id === 'text') {
      return (
        <div className="h-full flex flex-col justify-between">
          <Icon className="opacity-90" size={28} />
          <motion.div animate={hv ? { x: 6, scale: 1.02 } : { x: 0, scale: 1 }} transition={{ duration: 0.12, ease: "easeOut" }}>
            <div className="font-semibold">{app.title}</div>
            <div className="mt-2 p-2 bg-black/15 text-white/80 text-[10px] font-mono leading-snug">project.md — "Metro OS design..."</div>
          </motion.div>
        </div>
      );
    }
    
    // Default - standard tile
    return (
      <>
        <Icon className="opacity-90" size={28} />
        <motion.div animate={hv ? { x: 6, scale: 1.02 } : { x: 0, scale: 1 }} transition={{ duration: 0.12, ease: "easeOut" }}>
          <div className="font-semibold">{app.title}</div>
          <div className="text-white/70 text-[11px]">Tile</div>
        </motion.div>
      </>
    );
  }, [app, badge, hv, playing, onQuick]);

  const handleOpen = useCallback(() => {
    onOpen(app);
  }, [onOpen, app]);

  const handleHoverStart = useCallback(() => setHv(true), []);
  const handleHoverEnd = useCallback(() => setHv(false), []);
  
  return (
    <motion.div
      onClick={handleOpen}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={`relative ${app.size} ${app.color} overflow-hidden shadow-md border border-black/20 p-3 flex flex-col text-left text-white cursor-pointer`}
    >
      <motion.span
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-white/0 via-white/40 to-white/0"
        initial={{ x: "-120%" }}
        animate={{ x: hv ? "220%" : "-120%" }}
        transition={{ duration: 0.12, ease: "easeOut" }}
      />

      {renderContent()}
    </motion.div>
  );
});