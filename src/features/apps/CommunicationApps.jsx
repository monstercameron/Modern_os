import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Star, Reply, Archive, Trash2, Send, Phone, Video, Mail as MailIcon,
  Mic, MicOff, VideoOff, PenSquare, Search, Hash, Users, Smile,
} from 'lucide-react';
import {
  AppFrame, Button, Card, Row, Input, Tag, Muted, Empty, SectionTitle,
  Avatar, Segmented, Toggle, Field, Modal, Kbd,
} from './AppFrame.jsx';
import { MAIL, MESSAGES, CONTACTS, PEOPLE, personById } from './demoData.js';

/* ------------------------------------------------------------------ Mail */

export function EmailApp() {
  const [folder, setFolder] = useState('inbox');
  const [selectedId, setSelectedId] = useState('m1');
  const [query, setQuery] = useState('');
  const [mail, setMail] = useState(MAIL);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ to: 'sarah', subject: '', body: '' });

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mail
      .filter((m) => m.folder === folder)
      .filter((m) => !q || (m.subject + m.preview + m.body).toLowerCase().includes(q));
  }, [mail, folder, query]);

  const selected = mail.find((m) => m.id === selectedId);
  const unread = mail.filter((m) => m.folder === 'inbox' && m.unread).length;

  const patch = (id, changes) => setMail((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m)));
  const open = (m) => { setSelectedId(m.id); if (m.unread) patch(m.id, { unread: false }); };

  const send = () => {
    const id = `m${Date.now()}`;
    setMail((prev) => [{
      id, from: 'me', to: draft.to, folder: 'sent', unread: false, time: 'now',
      subject: draft.subject || '(no subject)',
      preview: draft.body.slice(0, 80),
      body: draft.body,
    }, ...prev]);
    setComposing(false);
    setDraft({ to: 'sarah', subject: '', body: '' });
    setFolder('sent');
    setSelectedId(id);
  };

  const handler = async (text) => {
    const q = text.toLowerCase();
    if (q.includes('unread')) {
      const u = mail.filter((m) => m.folder === 'inbox' && m.unread);
      return u.length ? `${u.length} unread:\n${u.map((m) => `- ${m.subject} (${personById(m.from)?.name})`).join('\n')}` : 'Inbox is clear.';
    }
    if (q.includes('summar')) {
      if (!selected) return 'Open a message first.';
      return `"${selected.subject}"\n\n${selected.body.split('\n').filter(Boolean).slice(0, 3).join('\n')}`;
    }
    if (q.includes('mark all')) { setMail((prev) => prev.map((m) => ({ ...m, unread: false }))); return 'Marked everything read.'; }
    if (q.startsWith('compose') || q.includes('new message')) { setComposing(true); return 'Opened a new message.'; }
    if (q.startsWith('search ')) { setQuery(q.slice(7)); return `Filtering by "${q.slice(7)}".`; }
    if (q.includes('star')) {
      const s = mail.filter((m) => m.starred);
      return s.length ? s.map((m) => `- ${m.subject}`).join('\n') : 'Nothing starred.';
    }
    return null;
  };

  return (
    <AppFrame
      appId="email"
      title="Mail"
      subtitle={`${unread} unread · ${mail.filter((m) => m.folder === folder).length} in ${folder}`}
      toolbar={
        <>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="w-28 app-hide-sm" />
          <Button variant="accent" onClick={() => setComposing(true)}><PenSquare size={12} /> New</Button>
        </>
      }
      sidebar={
        <div className="py-2">
          {[['inbox', 'Inbox'], ['sent', 'Sent']].map(([id, label]) => (
            <Row key={id} selected={folder === id} onClick={() => setFolder(id)} className="flex items-center justify-between">
              <span>{label}</span>
              {id === 'inbox' && unread > 0 && <Tag tone="accent">{unread}</Tag>}
            </Row>
          ))}
          <div className="px-3 pt-4">
            <SectionTitle>People</SectionTitle>
            {PEOPLE.slice(0, 4).map((p) => (
              <button key={p.id} onClick={() => setQuery(p.name.split(' ')[0])}
                className="flex items-center gap-2 py-1 w-full text-left">
                <Avatar person={p} size={20} />
                <span className="truncate text-[12px]">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      }
      console={{
        intro: 'Mail console. Summarise what is open, list unread, compose, or search.',
        suggestions: ['what is unread?', 'summarise this message', 'compose'],
        handler,
      }}
    >
      <div className="grid app-cols h-full relative" style={{ gridTemplateColumns: 'minmax(190px, 1fr) 1.5fr' }}>
        <div className="overflow-y-auto border-r" style={{ borderColor: 'var(--theme-border)' }}>
          {list.length === 0 && <Empty title="Nothing here" hint="Try a different search or folder." />}
          {list.map((m) => {
            const person = personById(m.from) || { name: 'You', initials: 'ME', color: 'var(--theme-accent)' };
            return (
              <Row key={m.id} selected={m.id === selectedId} onClick={() => open(m)}
                className="border-b" style={{ borderBottomColor: 'var(--theme-border)' }}>
                <div className="flex items-start gap-2">
                  <Avatar person={person} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`truncate ${m.unread ? 'font-semibold' : ''}`}>{person.name}</span>
                      <Muted className="text-[10px] ml-auto shrink-0">{m.time}</Muted>
                    </div>
                    <div className={`truncate text-[12px] ${m.unread ? 'font-medium' : ''}`}>{m.subject}</div>
                    <Muted className="text-[11px] block truncate">{m.preview}</Muted>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); patch(m.id, { starred: !m.starred }); }}
                    aria-label={m.starred ? 'Unstar' : 'Star'} className="shrink-0 pt-0.5">
                    <Star size={12} fill={m.starred ? 'currentColor' : 'none'}
                      style={{ color: m.starred ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }} />
                  </button>
                </div>
              </Row>
            );
          })}
        </div>

        <div className="overflow-y-auto p-4">
          {!selected ? <Empty title="No message selected" hint="Pick something from the list." /> : (
            <>
              <h2 className="text-base font-semibold mb-1">{selected.subject}</h2>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Muted className="text-[12px]">
                  {(personById(selected.from) || { name: 'You' }).name} · {selected.time}
                </Muted>
                <div className="ml-auto flex gap-1.5">
                  <Button onClick={() => { setDraft({ to: selected.from, subject: `Re: ${selected.subject}`, body: '' }); setComposing(true); }}>
                    <Reply size={12} /> Reply
                  </Button>
                  <Button onClick={() => patch(selected.id, { folder: 'archive' })} aria-label="Archive message"><Archive size={12} /></Button>
                  <Button variant="danger" onClick={() => setMail((prev) => prev.filter((m) => m.id !== selected.id))}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">{selected.body}</pre>
            </>
          )}
        </div>

        <Modal
          open={composing}
          title="New message"
          onClose={() => setComposing(false)}
          footer={<><Button onClick={() => setComposing(false)}>Discard</Button><Button variant="accent" onClick={send}><Send size={12} /> Send</Button></>}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Muted className="text-[11px] w-12">To</Muted>
              <select value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                className="flex-1 px-2 py-1.5 text-[12px] border outline-none"
                style={{ backgroundColor: 'var(--theme-surface-alt)', color: 'var(--theme-text)', borderColor: 'var(--theme-border)' }}>
                {PEOPLE.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="Subject" />
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder="Write your message"
              rows={6}
              className="w-full px-2 py-1.5 text-[12px] border outline-none resize-none"
              style={{ backgroundColor: 'var(--theme-surface-alt)', color: 'var(--theme-text)', borderColor: 'var(--theme-border)' }}
            />
          </div>
        </Modal>
      </div>
    </AppFrame>
  );
}

/* -------------------------------------------------------------- Messages */

export function MessagesApp() {
  const [who, setWho] = useState('sarah');
  const [draft, setDraft] = useState('');
  const [threads, setThreads] = useState(MESSAGES);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  const thread = threads[who] || [];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.length, typing]);

  const post = (text, from = 'me') => {
    setThreads((prev) => ({ ...prev, [who]: [...(prev[who] || []), { id: Date.now() + Math.random(), from, text, time: 'now' }] }));
  };

  /** Send, then let the other person "reply" so the thread feels alive. */
  const send = (text) => {
    const value = (text ?? draft).trim();
    if (!value) return;
    post(value);
    setDraft('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const replies = ['Got it.', 'Makes sense.', 'I will take a look.', 'Nice — thanks.'];
      post(replies[Math.floor(value.length) % replies.length], who);
    }, 1400);
  };

  return (
    <AppFrame
      appId="messages"
      title="Messages"
      subtitle={`${personById(who).name}${typing ? ' · typing…' : ''}`}
      console={{
        intro: 'Messages console. Try "send on my way".',
        suggestions: ['send running 5 late', 'who am I talking to?'],
        handler: async (t) => {
          if (/^send /i.test(t)) { send(t.slice(5)); return `Sent to ${personById(who).name}.`; }
          if (/who|thread/i.test(t)) return Object.keys(threads).map((k) => `${personById(k).name}: ${threads[k].length} messages`).join('\n');
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {Object.keys(threads).map((id) => {
            const p = personById(id);
            const last = threads[id][threads[id].length - 1];
            return (
              <Row key={id} selected={who === id} onClick={() => setWho(id)}>
                <div className="flex items-center gap-2">
                  <Avatar person={p} />
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-medium">{p.name}</div>
                    <Muted className="text-[11px] truncate block">{last?.text}</Muted>
                  </div>
                </div>
              </Row>
            );
          })}
        </div>
      }
    >
      <div className="h-full flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {thread.map((m) => (
            <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] px-2.5 py-1.5 text-[12px]"
                style={{
                  backgroundColor: m.from === 'me' ? 'var(--theme-accent)' : 'var(--theme-surface-alt)',
                  color: m.from === 'me' ? 'var(--theme-accent-text)' : 'var(--theme-text)',
                  borderRadius: 'var(--theme-radius-sm)',
                }}>
                {m.text}
                <div className="text-[9px] opacity-70 mt-0.5">{m.time}</div>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="px-2.5 py-2 flex gap-1" style={{ backgroundColor: 'var(--theme-surface-alt)', borderRadius: 'var(--theme-radius-sm)' }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--theme-text-muted)', animation: `pulse 1s ${i * 0.15}s infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-3 pb-1 flex gap-1.5 flex-wrap shrink-0">
          {['On my way', 'Sounds good', 'Give me 10'].map((q) => (
            <button key={q} onClick={() => send(q)} className="px-2 py-0.5 text-[11px] border"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', borderRadius: 'var(--theme-radius-sm)' }}>
              {q}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex gap-2 p-2 border-t shrink-0" style={{ borderColor: 'var(--theme-border)' }}>
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${personById(who).name}`} />
          <Button variant="accent" type="submit" disabled={!draft.trim()}><Send size={13} /></Button>
        </form>
      </div>
    </AppFrame>
  );
}

/* ------------------------------------------------------------------ Chat */

const CHANNEL_SEED = {
  standup: [
    { id: 1, who: 'alex', text: "Let's sync up at 3pm about the roadmap" },
    { id: 2, who: 'sarah', text: 'Works. I want ten minutes on the tiling review.' },
    { id: 3, who: 'mike', text: 'I will bring the subscriber audit.' },
  ],
  design: [
    { id: 1, who: 'sarah', text: 'The gloss reads better at 8 degrees than 12.' },
    { id: 2, who: 'tom', text: 'Agreed, 12 looked like a novelty.' },
  ],
  incidents: [{ id: 1, who: 'tom', text: 'No open incidents. Quiet week.' }],
};

export function ChatApp() {
  const [channel, setChannel] = useState('standup');
  const [channels, setChannels] = useState(CHANNEL_SEED);
  const [draft, setDraft] = useState('');
  const [reactions, setReactions] = useState({});

  const post = () => {
    const text = draft.trim();
    if (!text) return;
    setChannels((prev) => ({ ...prev, [channel]: [...prev[channel], { id: Date.now(), who: 'me', text }] }));
    setDraft('');
  };

  const react = (msgId, emoji) => setReactions((prev) => {
    const key = `${channel}:${msgId}:${emoji}`;
    return { ...prev, [key]: (prev[key] || 0) + 1 };
  });

  return (
    <AppFrame
      appId="chat"
      title="Chat"
      subtitle={`#${channel} · ${channels[channel].length} messages`}
      console={{
        intro: 'Chat console. Post a message or check channel activity.',
        suggestions: ['post shipping the tiling engine', 'which channels are active?'],
        handler: async (t) => {
          if (/^post /i.test(t)) {
            setChannels((prev) => ({ ...prev, [channel]: [...prev[channel], { id: Date.now(), who: 'me', text: t.slice(5) }] }));
            return `Posted to #${channel}.`;
          }
          if (/channel|active/i.test(t)) return Object.entries(channels).map(([k, v]) => `#${k}: ${v.length} messages`).join('\n');
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          <div className="px-3"><SectionTitle>Channels</SectionTitle></div>
          {Object.keys(channels).map((c) => (
            <Row key={c} selected={channel === c} onClick={() => setChannel(c)} className="flex items-center gap-1.5">
              <Hash size={11} style={{ color: 'var(--theme-text-muted)' }} />
              <span className="text-[12px] flex-1">{c}</span>
              <Muted className="text-[10px]">{channels[c].length}</Muted>
            </Row>
          ))}
          <div className="px-3 pt-4">
            <SectionTitle>In this channel</SectionTitle>
            <div className="flex flex-wrap gap-1">
              {PEOPLE.slice(0, 4).map((p) => <Avatar key={p.id} person={p} size={20} />)}
            </div>
          </div>
        </div>
      }
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {channels[channel].map((m) => {
            const p = personById(m.who) || { name: 'You', initials: 'ME', color: 'var(--theme-accent)', role: '' };
            return (
              <div key={m.id} className="flex gap-2 group">
                <Avatar person={p} />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium">
                    {p.name} {p.role && <Muted className="text-[10px] font-normal">{p.role}</Muted>}
                  </div>
                  <div className="text-[13px]">{m.text}</div>
                  <div className="flex gap-1 mt-1">
                    {['👍', '🎉', '👀'].map((e) => {
                      const count = reactions[`${channel}:${m.id}:${e}`] || 0;
                      return (
                        <button key={e} onClick={() => react(m.id, e)}
                          className="px-1.5 py-0.5 text-[10px] border transition-opacity"
                          style={{
                            borderColor: count ? 'var(--theme-accent)' : 'var(--theme-border)',
                            color: 'var(--theme-text-muted)',
                            opacity: count ? 1 : 0.45,
                            borderRadius: 'var(--theme-radius-sm)',
                          }}>
                          {e}{count ? ` ${count}` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); post(); }}
          className="flex gap-2 p-2 border-t shrink-0" style={{ borderColor: 'var(--theme-border)' }}>
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message #${channel}`} />
          <Button variant="accent" type="submit" disabled={!draft.trim()}><Send size={13} /></Button>
        </form>
      </div>
    </AppFrame>
  );
}

/* -------------------------------------------------------------- Contacts */

export function ContactsApp() {
  const [contacts, setContacts] = useState(CONTACTS);
  const [selected, setSelected] = useState(CONTACTS[0].id);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');

  const list = contacts
    .filter((c) => (tab === 'starred' ? c.starred : true))
    .filter((c) => (c.name + c.role).toLowerCase().includes(query.toLowerCase()));
  const person = contacts.find((c) => c.id === selected) || list[0];

  const toggleStar = (id) => setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c)));

  return (
    <AppFrame
      appId="contacts"
      title="Contacts"
      subtitle={`${contacts.length} people · ${contacts.filter((c) => c.starred).length} starred`}
      toolbar={<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="w-28 app-hide-sm" />}
      console={{
        intro: 'Contacts console. Find someone by name or role.',
        suggestions: ['who works on data?', "sarah's email", 'star mike'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/^star /i.test(q)) {
            const hit = contacts.find((c) => q.includes(c.name.split(' ')[0].toLowerCase()));
            if (hit) { toggleStar(hit.id); return `${hit.starred ? 'Unstarred' : 'Starred'} ${hit.name}.`; }
          }
          const byRole = contacts.filter((c) => q.includes(c.role.toLowerCase()));
          if (byRole.length) return byRole.map((c) => `${c.name} — ${c.role}, ${c.email}`).join('\n');
          const byName = contacts.find((c) => q.includes(c.name.split(' ')[0].toLowerCase()));
          if (byName) { setSelected(byName.id); return `${byName.name}\n${byName.role}\n${byName.email}\n${byName.phone}`; }
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          <div className="px-3 pb-2">
            <Segmented options={[{ value: 'all', label: 'All' }, { value: 'starred', label: 'Starred' }]} value={tab} onChange={setTab} />
          </div>
          {list.map((c) => (
            <Row key={c.id} selected={c.id === selected} onClick={() => setSelected(c.id)}>
              <div className="flex items-center gap-2">
                <Avatar person={c} />
                <span className="truncate text-[12px] flex-1">{c.name}</span>
                {c.starred && <Star size={10} fill="currentColor" style={{ color: 'var(--theme-accent)' }} />}
              </div>
            </Row>
          ))}
        </div>
      }
    >
      {!person ? <Empty title="No matches" hint="Try a different search." /> : (
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar person={person} size={48} />
            <div className="min-w-0">
              <div className="text-base font-semibold truncate">{person.name}</div>
              <Muted>{person.role}</Muted>
            </div>
            <Button className="ml-auto" onClick={() => toggleStar(person.id)}>
              <Star size={12} fill={person.starred ? 'currentColor' : 'none'} />
              {person.starred ? 'Starred' : 'Star'}
            </Button>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button><Phone size={12} /> Call</Button>
            <Button><Video size={12} /> Video</Button>
            <Button><MailIcon size={12} /> Mail</Button>
          </div>
          <Card className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
            <Field label="Email">{person.email}</Field>
            <Field label="Phone">{person.phone}</Field>
            <Field label="Team">{person.role}</Field>
          </Card>
        </div>
      )}
    </AppFrame>
  );
}

/* ------------------------------------------------------------ Video call */

export function VideoCallApp() {
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [speaking, setSpeaking] = useState('sarah');
  const participants = PEOPLE.slice(0, 4);

  useEffect(() => {
    if (!inCall) return undefined;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    // Rotate who is speaking, so the active-speaker ring has something to do.
    const s = setInterval(() => {
      setSpeaking(participants[Math.floor(Math.random() * participants.length)].id);
    }, 2600);
    return () => { clearInterval(t); clearInterval(s); };
  }, [inCall]);

  const leave = () => { setInCall(false); setSeconds(0); };
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <AppFrame
      appId="videocall"
      title="Video Call"
      subtitle={inCall ? `Connected · ${clock} · ${participants.length} people` : 'Not in a call'}
      console={{
        intro: 'Video console. Join, leave, mute, or check who is here.',
        suggestions: ['join', 'mute', 'who is here?'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (/join|start/.test(q)) { setInCall(true); return 'Joined the call.'; }
          if (/leave|hang/.test(q)) { leave(); return 'Left the call.'; }
          if (/unmute/.test(q)) { setMuted(false); return 'Microphone on.'; }
          if (/mute/.test(q)) { setMuted(true); return 'Microphone muted.'; }
          if (/camera/.test(q)) { setCamera((c) => !c); return `Camera ${camera ? 'off' : 'on'}.`; }
          if (/who/.test(q)) return participants.map((p) => `${p.name} (${p.role})`).join('\n');
          return null;
        },
      }}
    >
      {!inCall ? (
        <div className="h-full grid place-items-center p-6">
          <div className="text-center">
            <div className="flex justify-center -space-x-2 mb-3">
              {participants.map((p) => <Avatar key={p.id} person={p} size={34} />)}
            </div>
            <div className="font-medium mb-1">Roadmap sync</div>
            <Muted className="text-[12px] block mb-4">{participants.length} people waiting · camera and mic are simulated</Muted>
            <div className="flex items-center justify-center gap-3 mb-4">
              <label className="flex items-center gap-2 text-[12px]"><Toggle checked={!muted} onChange={(v) => setMuted(!v)} label="Microphone" /> Mic</label>
              <label className="flex items-center gap-2 text-[12px]"><Toggle checked={camera} onChange={setCamera} label="Camera" /> Camera</label>
            </div>
            <Button variant="accent" onClick={() => setInCall(true)}>Join call</Button>
          </div>
        </div>
      ) : (
        <div className="p-3 h-full flex flex-col gap-3">
          <div className="grid gap-2 flex-1 min-h-0" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
            {participants.map((p) => {
              const active = speaking === p.id;
              return (
                <div key={p.id} className="relative grid place-items-center min-h-[86px] transition-shadow"
                  style={{
                    backgroundColor: 'var(--theme-surface-alt)',
                    borderRadius: 'var(--theme-radius-sm)',
                    boxShadow: active ? '0 0 0 2px var(--theme-accent)' : 'none',
                    transitionDuration: 'var(--motion-fast)',
                  }}>
                  <span className="grid place-items-center text-sm font-semibold text-white"
                    style={{ width: 40, height: 40, backgroundColor: p.color, borderRadius: '50%' }}>{p.initials}</span>
                  <span className="absolute bottom-1 left-2 text-[10px] flex items-center gap-1">
                    {p.name.split(' ')[0]}
                    {active && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-success)' }} />}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 justify-center shrink-0 flex-wrap">
            <Button active={muted} onClick={() => setMuted((m) => !m)}>
              {muted ? <MicOff size={13} /> : <Mic size={13} />} {muted ? 'Unmute' : 'Mute'}
            </Button>
            <Button active={!camera} onClick={() => setCamera((c) => !c)}>
              {camera ? <Video size={13} /> : <VideoOff size={13} />} Camera
            </Button>
            <Button variant="danger" onClick={leave}>Leave</Button>
          </div>
        </div>
      )}
    </AppFrame>
  );
}
