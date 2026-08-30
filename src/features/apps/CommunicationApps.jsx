import React, { useMemo, useState } from 'react';
import { Star, Reply, Archive, Search, Phone, Video, Send, Mail as MailIcon } from 'lucide-react';
import { AppFrame, Button, Card, Row, Input, Tag, Muted, Empty, SectionTitle } from './AppFrame.jsx';
import { MAIL, MESSAGES, CONTACTS, PEOPLE, personById } from './demoData.js';

/* ------------------------------------------------------------------ Mail */

export function EmailApp() {
  const [folder, setFolder] = useState('inbox');
  const [selectedId, setSelectedId] = useState('m1');
  const [query, setQuery] = useState('');
  const [starred, setStarred] = useState(() => new Set(MAIL.filter((m) => m.starred).map((m) => m.id)));
  const [read, setRead] = useState(() => new Set(MAIL.filter((m) => !m.unread).map((m) => m.id)));

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MAIL.filter((m) => m.folder === folder)
      .filter((m) => !q || m.subject.toLowerCase().includes(q) || m.preview.toLowerCase().includes(q));
  }, [folder, query]);

  const selected = MAIL.find((m) => m.id === selectedId);
  const unreadCount = MAIL.filter((m) => m.folder === 'inbox' && !read.has(m.id)).length;

  const open = (m) => {
    setSelectedId(m.id);
    setRead((prev) => new Set(prev).add(m.id));
  };

  const toggleStar = (id) => setStarred((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handler = async (text) => {
    const q = text.toLowerCase();
    if (q.includes('unread')) return `${unreadCount} unread in the inbox: ` +
      MAIL.filter((m) => m.folder === 'inbox' && !read.has(m.id)).map((m) => `"${m.subject}"`).join(', ');
    if (q.includes('summar')) {
      if (!selected) return 'Open a message first, then ask again.';
      return `"${selected.subject}" from ${personById(selected.from).name}:\n\n` +
        selected.body.split('\n').filter(Boolean).slice(0, 3).join('\n');
    }
    if (q.startsWith('/read') || q.includes('mark all')) {
      setRead(new Set(MAIL.map((m) => m.id)));
      return 'Marked everything read.';
    }
    if (q.includes('star')) return `Starred: ${[...starred].map((id) => MAIL.find((m) => m.id === id)?.subject).join(', ') || 'nothing'}`;
    return null;
  };

  return (
    <AppFrame
      appId="email"
      title="Mail"
      subtitle={`${unreadCount} unread · ${MAIL.filter((m) => m.folder === folder).length} in ${folder}`}
      toolbar={<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="w-32 app-hide-sm" />}
      sidebar={
        <div className="py-2">
          {['inbox', 'sent'].map((f) => (
            <Row key={f} selected={folder === f} onClick={() => setFolder(f)} className="capitalize flex justify-between">
              <span>{f}</span>
              {f === 'inbox' && unreadCount > 0 && <Tag tone="accent">{unreadCount}</Tag>}
            </Row>
          ))}
          <div className="px-3 pt-4">
            <SectionTitle>People</SectionTitle>
            {PEOPLE.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-2 py-1">
                <span className="w-5 h-5 grid place-items-center text-[9px] font-semibold text-white shrink-0"
                  style={{ backgroundColor: p.color, borderRadius: 'var(--theme-radius-sm)' }}>{p.initials}</span>
                <span className="truncate text-[12px]">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      }
      console={{
        intro: 'Mail console. I can summarise what is open, list unread, or mark everything read.',
        suggestions: ['what is unread?', 'summarise this message', 'mark all read'],
        handler,
      }}
    >
      <div className="grid app-cols h-full" style={{ gridTemplateColumns: 'minmax(200px, 1fr) 1.4fr' }}>
        <div className="overflow-y-auto border-r" style={{ borderColor: 'var(--theme-border)' }}>
          {list.length === 0 && <Empty title="Nothing here" hint="Try a different search or folder." />}
          {list.map((m) => {
            const person = personById(m.from);
            const isUnread = !read.has(m.id);
            return (
              <Row key={m.id} selected={m.id === selectedId} onClick={() => open(m)} className="border-b"
                style={{ borderBottomColor: 'var(--theme-border)' }}>
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 grid place-items-center text-[10px] font-semibold text-white shrink-0"
                    style={{ backgroundColor: person.color, borderRadius: 'var(--theme-radius-sm)' }}>{person.initials}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`truncate ${isUnread ? 'font-semibold' : ''}`}>{person.name}</span>
                      <Muted className="text-[10px] ml-auto shrink-0">{m.time}</Muted>
                    </div>
                    <div className={`truncate text-[12px] ${isUnread ? 'font-medium' : ''}`}>{m.subject}</div>
                    <Muted className="text-[11px] line-clamp-1 block truncate">{m.preview}</Muted>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleStar(m.id); }} aria-label="Star" className="shrink-0 pt-0.5">
                    <Star size={12} fill={starred.has(m.id) ? 'currentColor' : 'none'}
                      style={{ color: starred.has(m.id) ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }} />
                  </button>
                </div>
              </Row>
            );
          })}
        </div>

        <div className="overflow-y-auto p-4">
          {!selected ? (
            <Empty title="No message selected" hint="Pick something from the list." />
          ) : (
            <>
              <h2 className="text-base font-semibold mb-1">{selected.subject}</h2>
              <div className="flex items-center gap-2 mb-3">
                <Muted className="text-[12px]">{personById(selected.from).name} · {selected.time}</Muted>
                <div className="ml-auto flex gap-1.5">
                  <Button variant="ghost" title="Reply"><Reply size={13} /></Button>
                  <Button variant="ghost" title="Archive"><Archive size={13} /></Button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">{selected.body}</pre>
            </>
          )}
        </div>
      </div>
    </AppFrame>
  );
}

/* -------------------------------------------------------------- Messages */

export function MessagesApp() {
  const [who, setWho] = useState('sarah');
  const [draft, setDraft] = useState('');
  const [threads, setThreads] = useState(MESSAGES);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setThreads((prev) => ({
      ...prev,
      [who]: [...(prev[who] || []), { id: Date.now(), from: 'me', text, time: 'now' }],
    }));
    setDraft('');
  };

  const handler = async (text) => {
    if (text.toLowerCase().includes('send ')) {
      const body = text.replace(/^.*?send /i, '');
      setThreads((prev) => ({ ...prev, [who]: [...(prev[who] || []), { id: Date.now(), from: 'me', text: body, time: 'now' }] }));
      return `Sent to ${personById(who).name}: "${body}"`;
    }
    if (text.toLowerCase().includes('unread') || text.toLowerCase().includes('who')) {
      return `Open threads: ${Object.keys(threads).map((k) => personById(k).name).join(', ')}`;
    }
    return null;
  };

  const thread = threads[who] || [];

  return (
    <AppFrame
      appId="messages"
      title="Messages"
      subtitle={personById(who).name}
      console={{
        intro: 'Messages console. Try "send on my way" to post into the open thread.',
        suggestions: ['send running 5 late', 'who am I talking to?'],
        handler,
      }}
      sidebar={
        <div className="py-2">
          {Object.keys(threads).map((id) => {
            const p = personById(id);
            const last = threads[id][threads[id].length - 1];
            return (
              <Row key={id} selected={who === id} onClick={() => setWho(id)}>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 grid place-items-center text-[10px] font-semibold text-white shrink-0"
                    style={{ backgroundColor: p.color, borderRadius: 'var(--theme-radius-sm)' }}>{p.initials}</span>
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
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
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

export function ChatApp() {
  const [channel, setChannel] = useState('standup');
  const channels = {
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

  return (
    <AppFrame
      appId="chat"
      title="Chat"
      subtitle={`#${channel} · ${channels[channel].length} messages`}
      console={{
        intro: 'Chat console. Ask which channels are busy.',
        suggestions: ['which channels are active?'],
        handler: async (t) => t.toLowerCase().includes('channel')
          ? Object.entries(channels).map(([k, v]) => `#${k}: ${v.length} messages`).join('\n')
          : null,
      }}
      sidebar={
        <div className="py-2">
          {Object.keys(channels).map((c) => (
            <Row key={c} selected={channel === c} onClick={() => setChannel(c)}>
              <span className="text-[12px]"># {c}</span>
            </Row>
          ))}
        </div>
      }
    >
      <div className="p-3 space-y-3">
        {channels[channel].map((m) => {
          const p = personById(m.who);
          return (
            <div key={m.id} className="flex gap-2">
              <span className="w-6 h-6 grid place-items-center text-[10px] font-semibold text-white shrink-0"
                style={{ backgroundColor: p.color, borderRadius: 'var(--theme-radius-sm)' }}>{p.initials}</span>
              <div className="min-w-0">
                <div className="text-[12px] font-medium">{p.name} <Muted className="text-[10px] font-normal">{p.role}</Muted></div>
                <div className="text-[13px]">{m.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AppFrame>
  );
}

/* -------------------------------------------------------------- Contacts */

export function ContactsApp() {
  const [selected, setSelected] = useState(CONTACTS[0].id);
  const person = CONTACTS.find((c) => c.id === selected);
  const [query, setQuery] = useState('');
  const list = CONTACTS.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppFrame
      appId="contacts"
      title="Contacts"
      subtitle={`${CONTACTS.length} people`}
      toolbar={<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="w-28 app-hide-sm" />}
      console={{
        intro: 'Contacts console. Ask for someone by name or role.',
        suggestions: ["who works on data?", "sarah's email"],
        handler: async (t) => {
          const q = t.toLowerCase();
          const byRole = CONTACTS.filter((c) => q.includes(c.role.toLowerCase()));
          if (byRole.length) return byRole.map((c) => `${c.name} — ${c.role}, ${c.email}`).join('\n');
          const byName = CONTACTS.find((c) => q.includes(c.name.split(' ')[0].toLowerCase()));
          if (byName) { setSelected(byName.id); return `${byName.name}\n${byName.role}\n${byName.email}\n${byName.phone}`; }
          return null;
        },
      }}
      sidebar={
        <div className="py-2">
          {list.map((c) => (
            <Row key={c.id} selected={c.id === selected} onClick={() => setSelected(c.id)}>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 grid place-items-center text-[10px] font-semibold text-white shrink-0"
                  style={{ backgroundColor: c.color, borderRadius: 'var(--theme-radius-sm)' }}>{c.initials}</span>
                <span className="truncate text-[12px]">{c.name}</span>
              </div>
            </Row>
          ))}
        </div>
      }
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-12 h-12 grid place-items-center text-base font-semibold text-white shrink-0"
            style={{ backgroundColor: person.color, borderRadius: 'var(--theme-radius)' }}>{person.initials}</span>
          <div>
            <div className="text-base font-semibold">{person.name}</div>
            <Muted>{person.role}</Muted>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <Button><Phone size={13} /> Call</Button>
          <Button><Video size={13} /> Video</Button>
          <Button><MailIcon size={13} /> Mail</Button>
        </div>
        <Card className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
          {[['Email', person.email], ['Phone', person.phone], ['Team', person.role]].map(([k, v]) => (
            <div key={k} className="flex justify-between px-3 py-2 text-[12px]" style={{ borderColor: 'var(--theme-border)' }}>
              <Muted>{k}</Muted><span>{v}</span>
            </div>
          ))}
        </Card>
      </div>
    </AppFrame>
  );
}

/* ------------------------------------------------------------ Video call */

export function VideoCallApp() {
  const [inCall, setInCall] = useState(false);
  const participants = PEOPLE.slice(0, 4);

  return (
    <AppFrame
      appId="videocall"
      title="Video Call"
      subtitle={inCall ? `Connected · ${participants.length} people` : 'Not in a call'}
      console={{
        intro: 'Video console. Say "join" or "leave".',
        suggestions: ['join', 'who is here?'],
        handler: async (t) => {
          const q = t.toLowerCase();
          if (q.includes('join') || q.includes('start')) { setInCall(true); return 'Joined the call.'; }
          if (q.includes('leave') || q.includes('hang')) { setInCall(false); return 'Left the call.'; }
          if (q.includes('who')) return participants.map((p) => `${p.name} (${p.role})`).join('\n');
          return null;
        },
      }}
    >
      {!inCall ? (
        <Empty
          title="Ready to join"
          hint="Camera and microphone are simulated in this demo."
          action={<Button variant="accent" onClick={() => setInCall(true)}>Join call</Button>}
        />
      ) : (
        <div className="p-3 h-full flex flex-col gap-3">
          <div className="grid gap-2 flex-1 app-cols" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            {participants.map((p) => (
              <div key={p.id} className="relative grid place-items-center min-h-[90px]"
                style={{ backgroundColor: 'var(--theme-surface-alt)', borderRadius: 'var(--theme-radius-sm)' }}>
                <span className="w-10 h-10 grid place-items-center text-sm font-semibold text-white"
                  style={{ backgroundColor: p.color, borderRadius: '50%' }}>{p.initials}</span>
                <span className="absolute bottom-1 left-2 text-[10px]">{p.name}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-center shrink-0">
            <Button>Mute</Button>
            <Button>Camera off</Button>
            <Button variant="danger" onClick={() => setInCall(false)}>Leave</Button>
          </div>
        </div>
      )}
    </AppFrame>
  );
}
