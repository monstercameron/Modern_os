import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Globe, MessageSquare, Mail, Folder, Music, Video, Mic, Terminal, Settings as SettingsIcon } from "lucide-react";

export function Tile({ app, onOpen, onQuick, badge = 0 }) {
  const Icon = app.icon;
  const [hv, setHv] = useState(false);
  const [playing, setPlaying] = useState(false);
  return (
    <motion.button
      onClick={onOpen}
      onHoverStart={() => setHv(true)}
      onHoverEnd={() => setHv(false)}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={`relative ${app.size} ${app.color} overflow-hidden shadow-md border border-black/20 p-3 flex flex-col justify-between text-left text-white`}
    >
      {badge > 0 && (
        <div className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-black text-white text-[10px] leading-[18px] text-center font-semibold">
          {badge}
        </div>
      )}

      <motion.span
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-white/0 via-white/40 to-white/0"
        initial={{ x: "-120%" }}
        animate={{ x: hv ? "220%" : "-120%" }}
        transition={{ duration: 0.12, ease: "easeOut" }}
      />

      {app.id === 'music' ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/30 grid place-items-center text-white/80 text-[10px] font-semibold">ART</div>
          <div className="flex-1">
            <div className="font-semibold">Now Playing</div>
            <div className="text-white/70 text-[11px] truncate">Unknown Artist — Track</div>
          </div>
          <div className="flex items-center gap-2">
            <div onClick={(e)=>{e.stopPropagation(); setPlaying(p=>!p);}} className="px-2 py-1 bg-black/20 border border-white/20 text-[11px] cursor-pointer select-none">
              {playing ? 'Pause' : 'Play'}
            </div>
          </div>
        </div>
      ) : app.id === 'browser' ? (
        <>
          <Icon className="opacity-90" size={28} />
          <motion.div animate={hv ? { x: 6, scale: 1.02 } : { x: 0, scale: 1 }} transition={{ duration: 0.12, ease: "easeOut" }}>
            <div className="font-semibold flex items-center justify-between">
              <span>{app.title}</span>
              <div
                onClick={(e)=>{ e.stopPropagation(); onQuick && onQuick({ url: 'https://www.msn.com' }); }}
                className="ml-2 px-2 py-1 bg-black/20 border border-white/20 text-[11px] cursor-pointer select-none"
                title="Quick launch MSN"
              >MSN</div>
            </div>
            <div className="text-white/70 text-[11px]">Tile</div>
          </motion.div>
        </>
      ) : app.id === 'text' ? (
        <>
          <Icon className="opacity-90" size={28} />
          <motion.div animate={hv ? { x: 6, scale: 1.02 } : { x: 0, scale: 1 }} transition={{ duration: 0.12, ease: "easeOut" }}>
            <div className="font-semibold">{app.title}</div>
            <div className="mt-2 p-2 bg-black/15 text-white/80 text-[10px] font-mono leading-snug">last.md — "Notes about the DE mock..."</div>
          </motion.div>
        </>
      ) : (
        <>
          <Icon className="opacity-90" size={28} />
          <motion.div animate={hv ? { x: 6, scale: 1.02 } : { x: 0, scale: 1 }} transition={{ duration: 0.12, ease: "easeOut" }}>
            <div className="font-semibold">{app.title}</div>
            <div className="text-white/70 text-[11px]">Tile</div>
          </motion.div>
        </>
      )}
    </motion.button>
  );
}