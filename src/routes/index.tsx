import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuickMusic — Minimal macOS FLAC/WAV Player" },
      { name: "description", content: "UI prototype of QuickMusic, a minimal native macOS lossless player with Monkeytype themes." },
      { property: "og:title", content: "QuickMusic — Minimal macOS Player" },
      { property: "og:description", content: "Songs, albums, artists, folders, queue, mini player and themes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

type Theme = { name: string; bg: string; main: string; caption: string; text: string; sub: string; subalt: string; error: string };
const THEMES: Theme[] = [
  { name: "serika dark", bg: "#323437", main: "#e2b714", caption: "#e2b714", text: "#d1d0c5", sub: "#646669", subalt: "#2c2e31", error: "#ca4754" },
  { name: "serika", bg: "#e1e1e3", main: "#e2b714", caption: "#e2b714", text: "#323437", sub: "#aaaeb3", subalt: "#d1d3d8", error: "#da3333" },
  { name: "dracula", bg: "#282a36", main: "#bd93f9", caption: "#6272a4", text: "#f8f8f2", sub: "#6272a4", subalt: "#20222c", error: "#ff5555" },
  { name: "nord", bg: "#242933", main: "#88c0d0", caption: "#5e81ac", text: "#e5e9f0", sub: "#929aaa", subalt: "#1d2128", error: "#bf616a" },
  { name: "botanical", bg: "#7b9c98", main: "#eaf1f3", caption: "#495755", text: "#eaf1f3", sub: "#495755", subalt: "#6f8f8b", error: "#f6c9b4" },
  { name: "carbon", bg: "#313131", main: "#f66e0d", caption: "#f66e0d", text: "#f5e6c8", sub: "#616161", subalt: "#2b2b2b", error: "#e72d2d" },
  { name: "8008", bg: "#333a45", main: "#f44c7f", caption: "#f44c7f", text: "#e9ecf0", sub: "#939eae", subalt: "#2e343d", error: "#da3333" },
  { name: "olivia", bg: "#1c1b1d", main: "#deaf9d", caption: "#deaf9d", text: "#f2efed", sub: "#4e3e3e", subalt: "#232124", error: "#bf616a" },
  { name: "matrix", bg: "#000000", main: "#15ff00", caption: "#15ff00", text: "#d1ffcd", sub: "#006500", subalt: "#032000", error: "#da3333" },
  { name: "lavender", bg: "#ada6c2", main: "#e4e3e9", caption: "#e4e3e9", text: "#2f2a41", sub: "#e4e3e9", subalt: "#a19ab7", error: "#da3333" },
];

type Song = { id: number; title: string; artist: string; album: string; folder: string; dur: number; fmt: string; plays: number };
const RAW: [string, string, string, number, string][] = [
  ["So What", "Miles Davis", "Kind of Blue", 562, "FLAC 24/96"],
  ["Freddie Freeloader", "Miles Davis", "Kind of Blue", 586, "FLAC 24/96"],
  ["Blue in Green", "Miles Davis", "Kind of Blue", 337, "FLAC 24/96"],
  ["Teardrop", "Massive Attack", "Mezzanine", 330, "FLAC 16/44"],
  ["Angel", "Massive Attack", "Mezzanine", 379, "FLAC 16/44"],
  ["Windowlicker", "Aphex Twin", "Windowlicker", 367, "WAV 16/44"],
  ["Xtal", "Aphex Twin", "Selected Ambient Works", 291, "FLAC 16/44"],
  ["Avril 14th", "Aphex Twin", "Drukqs", 125, "FLAC 16/44"],
  ["Pyramid Song", "Radiohead", "Amnesiac", 289, "FLAC 24/48"],
  ["Weird Fishes", "Radiohead", "In Rainbows", 318, "FLAC 24/48"],
  ["Reckoner", "Radiohead", "In Rainbows", 290, "FLAC 24/48"],
  ["Hyperballad", "Björk", "Post", 321, "WAV 24/96"],
];
const SONGS: Song[] = RAW.map(([title, artist, album, dur, fmt], i) => ({
  id: i, title, artist, album, dur, fmt, folder: `~/Music/${artist}/${album}`, plays: (i * 37) % 90 + 3,
}));
const hue = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

type View = "Songs" | "Albums" | "Artists" | "Folders" | "Most Played";

function Art({ album, size = 40 }: { album: string; size?: number }) {
  const h = hue(album);
  return (
    <div className="shrink-0 rounded-md shadow-md" style={{ width: size, height: size,
      background: `linear-gradient(135deg, hsl(${h} 60% 55%), hsl(${(h + 60) % 360} 50% 25%))` }} />
  );
}

function App() {
  const [theme, setTheme] = useState(0);
  const [hoverTheme, setHoverTheme] = useState<number | null>(null);
  const [view, setView] = useState<View>("Songs");
  const [q, setQ] = useState("");
  const [cur, setCur] = useState<Song>(SONGS[3]);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(64);
  const [vol, setVol] = useState(70);
  const [queue, setQueue] = useState<Song[]>(SONGS.slice(4, 8));
  const [showQueue, setShowQueue] = useState(true);
  const [mode, setMode] = useState<"window" | "mini" | "full">("window");
  const [themeOpen, setThemeOpen] = useState(false);
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const t = localStorage.getItem("qm-theme"); if (t) setTheme(+t); }, []);
  useEffect(() => { localStorage.setItem("qm-theme", String(theme)); }, [theme]);

  const t = THEMES[hoverTheme ?? theme];
  const vars = { "--bg": t.bg, "--main": t.main, "--caption": t.caption, "--text": t.text, "--sub": t.sub, "--subalt": t.subalt, "--error": t.error } as React.CSSProperties;

  useEffect(() => {
    if (!playing) return;
    const i = setInterval(() => setPos((p) => (p + 1 >= cur.dur ? 0 : p + 1)), 1000);
    return () => clearInterval(i);
  }, [playing, cur]);

  const play = (s: Song) => { setCur(s); setPos(0); setPlaying(true); };
  const next = () => { if (queue[0]) { play(queue[0]); setQueue(queue.slice(1)); } };
  const prev = () => { const i = SONGS.findIndex((s) => s.id === cur.id); play(SONGS[(i - 1 + SONGS.length) % SONGS.length]); };
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1400); };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).tagName === "INPUT";
      if (e.key === "/" && !typing) { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === "Escape") { searchRef.current?.blur(); if (mode === "full") setMode("window"); setThemeOpen(false); }
      else if (e.key === "F8" || (e.key === " " && !typing)) { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key === "F9") next();
      else if (e.key === "F7") prev();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    const list = SONGS.filter((x) => !s || [x.title, x.artist, x.folder].some((f) => f.toLowerCase().includes(s)));
    return view === "Most Played" ? [...list].sort((a, b) => b.plays - a.plays) : list;
  }, [q, view]);

  const groups = (key: "album" | "artist" | "folder") => {
    const m = new Map<string, Song[]>();
    filtered.forEach((s) => m.set(s[key], [...(m.get(s[key]) ?? []), s]));
    return [...m.entries()];
  };

  const Controls = ({ big = false }: { big?: boolean }) => (
    <div className={`flex items-center ${big ? "gap-10 text-3xl" : "gap-5 text-lg"}`}>
      <button onClick={prev} className="text-sub hover:text-foreground" title="Previous (F7)">⏮</button>
      <button onClick={() => setPlaying(!playing)} title="Play/Pause (F8)"
        className={`grid place-items-center rounded-full bg-main text-background ${big ? "h-16 w-16" : "h-9 w-9"}`}>
        {playing ? "❚❚" : "▶"}
      </button>
      <button onClick={next} className="text-sub hover:text-foreground" title="Next (F9)">⏭</button>
    </div>
  );
  const Seek = () => (
    <div className="flex w-full items-center gap-3 font-mono text-xs text-sub">
      <span>{fmt(pos)}</span>
      <input type="range" min={0} max={cur.dur} value={pos} onChange={(e) => setPos(+e.target.value)} className="flex-1 accent-[var(--main)]" />
      <span>-{fmt(cur.dur - pos)}</span>
    </div>
  );
  const Lights = ({ onGreen }: { onGreen?: () => void }) => (
    <div className="flex gap-2">
      <span className="h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
      <span onClick={() => setMode("mini")} className="h-3 w-3 cursor-pointer rounded-full" title="Mini player" style={{ background: "#febc2e" }} />
      <span onClick={onGreen} className="h-3 w-3 cursor-pointer rounded-full" title="Full screen" style={{ background: "#28c840" }} />
    </div>
  );

  const Row = ({ s, i }: { s: Song; i: number }) => {
    const active = s.id === cur.id;
    return (
      <div onDoubleClick={() => play(s)}
        className={`group grid grid-cols-[2rem_1fr_1fr_6rem_4rem_3rem] items-center gap-3 rounded-md px-3 py-1.5 text-sm ${active ? "bg-main/15 text-main" : "hover:bg-subalt"}`}>
        <span className="font-mono text-xs text-sub">{active && playing ? "♪" : i + 1}</span>
        <span className="truncate">{s.title}</span>
        <span className="truncate text-sub">{s.artist}</span>
        <span className="font-mono text-[10px] text-sub">{view === "Most Played" ? `${s.plays} plays` : s.fmt}</span>
        <span className="flex gap-2 opacity-0 group-hover:opacity-100">
          <button title="Play next" onClick={() => { setQueue([s, ...queue]); flash(`Playing next: ${s.title}`); }} className="text-sub hover:text-main">↱</button>
          <button title="Add to queue" onClick={() => { setQueue([...queue, s]); flash(`Queued: ${s.title}`); }} className="text-sub hover:text-main">＋</button>
        </span>
        <span className="text-right font-mono text-xs text-sub">{fmt(s.dur)}</span>
      </div>
    );
  };

  const Content = () => {
    if (view === "Songs" || view === "Most Played") return <div>{filtered.map((s, i) => <Row key={s.id} s={s} i={i} />)}</div>;
    if (view === "Albums")
      return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-5">
          {groups("album").map(([a, ss]) => (
            <button key={a} onClick={() => { play(ss[0]); setQueue(ss.slice(1)); flash(`Playing album ${a}`); }} className="text-left">
              <Art album={a} size={150} />
              <div className="mt-2 truncate text-sm">{a}</div>
              <div className="truncate text-xs text-sub">{ss[0].artist} · {ss.length} songs</div>
            </button>
          ))}
        </div>
      );
    const key = view === "Artists" ? "artist" : "folder";
    return (
      <div className="space-y-6">
        {groups(key).map(([g, ss]) => (
          <div key={g}>
            <div className={`mb-1 px-3 text-xs uppercase tracking-wider text-caption ${key === "folder" ? "font-mono normal-case" : ""}`}>{key === "folder" ? "📁 " : ""}{g}</div>
            {ss.map((s, i) => <Row key={s.id} s={s} i={i} />)}
          </div>
        ))}
      </div>
    );
  };

  if (mode === "mini")
    return (
      <div style={vars} className="grid min-h-screen place-items-center">
        <div className="glass window-shadow w-80 overflow-hidden rounded-xl">
          <div className="flex items-center justify-between px-3 py-2"><Lights onGreen={() => setMode("full")} />
            <button onClick={() => setMode("window")} className="text-xs text-sub hover:text-foreground">Expand ⤢</button></div>
          <div className="flex items-center gap-3 px-4 pb-3"><Art album={cur.album} size={56} />
            <div className="min-w-0"><div className="truncate text-sm font-medium">{cur.title}</div><div className="truncate text-xs text-sub">{cur.artist} — {cur.album}</div></div></div>
          <div className="space-y-3 px-4 pb-4"><Seek /><div className="flex justify-center"><Controls /></div></div>
        </div>
      </div>
    );

  if (mode === "full")
    return (
      <div style={{ ...vars, background: `radial-gradient(circle at 30% 30%, hsl(${hue(cur.album)} 50% 30%), var(--bg) 70%)` }}
        className="flex min-h-screen items-center justify-center gap-16 p-16">
        <button onClick={() => setMode("window")} className="absolute right-6 top-6 text-sm text-sub hover:text-foreground">Exit ⎋</button>
        <Art album={cur.album} size={420} />
        <div className="w-[420px] space-y-8">
          <div><div className="text-4xl font-semibold">{cur.title}</div><div className="mt-2 text-xl text-sub">{cur.artist} — {cur.album}</div>
            <div className="mt-2 font-mono text-xs text-caption">{cur.fmt}</div></div>
          <Seek /><Controls big />
          <div className="text-xs text-sub">Up next: {queue[0]?.title ?? "—"}</div>
        </div>
      </div>
    );

  return (
    <div style={vars} className="flex min-h-screen items-center justify-center p-8">
      <div className="window-shadow flex h-[760px] w-full max-w-[1200px] overflow-hidden rounded-xl bg-background">
        {/* Sidebar */}
        <aside className="glass flex w-56 flex-col border-r p-3">
          <Lights onGreen={() => setMode("full")} />
          <div className="relative mt-5">
            <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
              className="w-full rounded-md bg-background/60 px-3 py-1.5 text-sm outline-none placeholder:text-sub focus:ring-2 focus:ring-main" />
            <kbd className="absolute right-2 top-1.5 rounded border px-1 font-mono text-[10px] text-sub">/</kbd>
          </div>
          <div className="mt-5 px-2 text-[11px] font-semibold text-sub">Library</div>
          {(["Songs", "Albums", "Artists", "Folders", "Most Played"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`mt-0.5 rounded-md px-2 py-1 text-left text-sm ${view === v ? "bg-main/20 text-main" : "hover:bg-background/40"}`}>{v}</button>
          ))}
          <div className="mt-auto space-y-1">
            <button onClick={() => flash("Open panel: choose files or folder…")} className="w-full rounded-md px-2 py-1 text-left text-sm text-sub hover:text-foreground">＋ Add Songs / Folder</button>
            <button onClick={() => setThemeOpen(!themeOpen)} className="w-full rounded-md px-2 py-1 text-left text-sm text-sub hover:text-foreground">◐ Theme: {THEMES[theme].name}</button>
          </div>
        </aside>

        {/* Main */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b px-6 py-3">
            <h1 className="text-xl font-bold text-caption">{view}</h1>
            <button onClick={() => setShowQueue(!showQueue)} className={`text-sm ${showQueue ? "text-main" : "text-sub"}`}>☰ Queue</button>
          </header>
          <div className="flex-1 overflow-auto px-4 py-3"
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); flash("Dropped files added to library"); }}>
            <Content />
            {filtered.length === 0 && <div className="mt-20 text-center text-sub">No results for “{q}”</div>}
          </div>

          {/* Player bar */}
          <footer className="glass flex items-center gap-6 border-t px-5 py-3">
            <div className="flex w-64 items-center gap-3"><Art album={cur.album} size={44} />
              <div className="min-w-0"><div className="truncate text-sm">{cur.title}</div><div className="truncate text-xs text-sub">{cur.artist}</div></div></div>
            <div className="flex flex-1 flex-col items-center gap-1"><Controls /><Seek /></div>
            <div className="flex w-40 items-center gap-2 text-sub">🔈<input type="range" value={vol} onChange={(e) => setVol(+e.target.value)} className="flex-1 accent-[var(--main)]" /></div>
          </footer>

          {themeOpen && (
            <div className="glass window-shadow absolute bottom-24 left-4 w-64 rounded-lg p-2" onMouseLeave={() => setHoverTheme(null)}>
              <div className="px-2 pb-1 text-[11px] text-sub">Hover to preview, click to keep</div>
              {THEMES.map((th, i) => (
                <button key={th.name} onMouseEnter={() => setHoverTheme(i)} onClick={() => { setTheme(i); setThemeOpen(false); setHoverTheme(null); }}
                  className="flex w-full items-center justify-between rounded px-2 py-1 font-mono text-xs hover:bg-background/50">
                  <span>{th.name}</span>
                  <span className="flex gap-1">{[th.bg, th.main, th.text, th.sub].map((c) => <span key={c} className="h-3 w-3 rounded-full border" style={{ background: c }} />)}</span>
                </button>
              ))}
            </div>
          )}
          {toast && <div className="glass absolute left-1/2 top-16 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs">{toast}</div>}
        </main>

        {showQueue && (
          <aside className="glass w-64 border-l p-3">
            <div className="mb-2 text-[11px] font-semibold text-sub">Now Playing</div>
            <div className="flex items-center gap-2 rounded-md bg-main/15 p-2"><Art album={cur.album} size={32} /><div className="min-w-0 text-xs"><div className="truncate text-main">{cur.title}</div><div className="truncate text-sub">{cur.artist}</div></div></div>
            <div className="mb-2 mt-4 text-[11px] font-semibold text-sub">Up Next · {queue.length}</div>
            {queue.map((s, i) => (
              <div key={i} className="group flex items-center gap-2 rounded-md p-1.5 text-xs hover:bg-background/40">
                <Art album={s.album} size={28} />
                <div className="min-w-0 flex-1"><div className="truncate">{s.title}</div><div className="truncate text-sub">{s.album}</div></div>
                <span className="hidden gap-1 group-hover:flex">
                  <button disabled={i === 0} onClick={() => { const n = [...queue]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setQueue(n); }} className="text-sub hover:text-main">↑</button>
                  <button onClick={() => setQueue(queue.filter((_, j) => j !== i))} className="text-sub hover:text-error">✕</button>
                </span>
              </div>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}
