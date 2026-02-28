'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'unheard' | 'archived';

interface AudioItem {
  id: string;
  filename: string;
  text: string;
  language: string;
  status: Status;
  createdAt: Date;
}

// ─── Language detection ───────────────────────────────────────────────────────

const PT_WORDS = new Set([
  'de', 'da', 'do', 'dos', 'das', 'e', 'o', 'a', 'os', 'as', 'em', 'para',
  'com', 'que', 'um', 'uma', 'não', 'se', 'mas', 'por', 'ao', 'nos', 'nas',
  'também', 'mais', 'já', 'foi', 'são', 'ser', 'ter', 'ou', 'eu', 'ele',
  'ela', 'nós', 'eles', 'elas', 'isto', 'isso', 'aqui', 'ali', 'este',
  'esta', 'esse', 'essa', 'muito', 'bem', 'quando', 'como', 'pelo', 'pela',
  'todo', 'toda', 'todos', 'todas', 'numa', 'num', 'duma', 'dum',
]);

const EN_WORDS = new Set([
  'the', 'and', 'of', 'to', 'in', 'is', 'it', 'you', 'that', 'he', 'was',
  'for', 'on', 'are', 'with', 'this', 'from', 'at', 'be', 'have', 'or',
  'an', 'they', 'we', 'his', 'her', 'she', 'its', 'by', 'but', 'not',
  'which', 'as', 'do', 'if', 'will', 'can', 'all', 'been', 'has', 'were',
  'said', 'each', 'their', 'there', 'would', 'about', 'them', 'than', 'then',
  'these', 'so', 'some', 'when', 'who', 'my', 'no', 'more', 'had',
]);

function detectLanguage(text: string): string {
  const words = text.toLowerCase().match(/\b[a-záàâãéèêíìîóòôõúùûçñ]+\b/g) ?? [];
  let pt = 0;
  let en = 0;
  for (const w of words) {
    if (PT_WORDS.has(w)) pt++;
    if (EN_WORDS.has(w)) en++;
  }
  return pt >= en ? 'pt-PT' : 'en-US';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(d: Date) {
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconUpload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653Z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
    </svg>
  );
}

function IconStop() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
    </svg>
  );
}

function IconArchive() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={2} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function IconSound() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    </svg>
  );
}

function IconSpin() {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg"
      fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// ─── Waveform animation (shown while playing) ─────────────────────────────────

function Waveform() {
  return (
    <span className="flex items-end gap-0.5" aria-hidden>
      {[3, 6, 4, 7, 5].map((h, i) => (
        <span
          key={i}
          className="w-0.5 rounded-full bg-indigo-400 animate-bounce"
          style={{ height: `${h * 2}px`, animationDelay: `${i * 80}ms` }}
        />
      ))}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AudioReaderPage() {
  const [items, setItems] = useState<AudioItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  // ── File handling ────────────────────────────────────────────────────────

  const resetFile = useCallback(() => {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const handleFile = useCallback(
    (f: File) => {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowed.includes(f.type)) {
        setError('Formato inválido. Use JPG, PNG ou PDF.');
        return;
      }
      if (f.size > 20 * 1024 * 1024) {
        setError('Ficheiro demasiado grande. Máximo: 20 MB.');
        return;
      }
      setError(null);
      setFile(f);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(f);
      });
    },
    [],
  );

  // ── Text extraction ──────────────────────────────────────────────────────

  const handleExtract = async () => {
    if (!file) return;
    setIsExtracting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/extract-text', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido');

      const text: string = data.text ?? '';
      if (!text.trim()) throw new Error('Nenhum texto encontrado no ficheiro');

      const language = detectLanguage(text);
      const item: AudioItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        filename: file.name,
        text,
        language,
        status: 'unheard',
        createdAt: new Date(),
      };

      setItems((prev) => [item, ...prev]);
      setSelectedId(item.id);
      resetFile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao extrair texto');
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Audio playback ───────────────────────────────────────────────────────

  const stopAudio = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  const togglePlay = () => {
    if (!selected || typeof window === 'undefined') return;
    const synth = window.speechSynthesis;

    if (isPlaying) {
      synth.pause();
      setIsPlaying(false);
      return;
    }

    if (synth.paused) {
      synth.resume();
      setIsPlaying(true);
      return;
    }

    synth.cancel();
    const utt = new SpeechSynthesisUtterance(selected.text);
    utt.lang = selected.language;
    utt.rate = 1;
    utt.onend = () => setIsPlaying(false);
    utt.onerror = () => setIsPlaying(false);
    synth.speak(utt);
    setIsPlaying(true);
  };

  const selectItem = (item: AudioItem) => {
    stopAudio();
    setSelectedId(item.id);
  };

  const archiveItem = (id: string) => {
    if (selectedId === id) stopAudio();
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'archived' } : i)),
    );
  };

  // ── Cleanup ──────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') window.speechSynthesis.cancel();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────

  const isImage = file?.type.startsWith('image/');
  const isPdf = file?.type === 'application/pdf';
  const unheardCount = items.filter((i) => i.status === 'unheard').length;

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <IconSound />
            </div>
            <span className="text-lg font-semibold tracking-tight">Audio Reader</span>
          </div>

          {unheardCount > 0 && (
            <span className="rounded-full bg-indigo-950 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
              {unheardCount} não {unheardCount === 1 ? 'ouvido' : 'ouvidos'}
            </span>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-2">

        {/* ════ LEFT COLUMN ════ */}
        <section className="flex flex-col gap-5">

          {/* Upload zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Zona de upload"
            className={`relative flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-950/30'
                : file
                ? 'border-zinc-700 bg-zinc-900/60'
                : 'border-zinc-700 bg-zinc-900/30 hover:border-zinc-500 hover:bg-zinc-900/60'
            }`}
            onClick={() => { if (!file) fileInputRef.current?.click(); }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !file)
                fileInputRef.current?.click();
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />

            {!file ? (
              <div className="flex flex-col items-center gap-3 text-center px-6 py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
                  <IconUpload />
                </div>
                <div>
                  <p className="font-medium text-zinc-300">
                    Arraste ou clique para carregar
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    JPG, PNG ou PDF · máx. 20 MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full p-4">
                {isImage && previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Preview do ficheiro"
                    className="mx-auto max-h-52 rounded-xl object-contain"
                  />
                )}
                {isPdf && (
                  <div className="flex items-center gap-4 rounded-xl bg-zinc-800/60 px-4 py-4">
                    <div className="flex h-12 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-red-700/40 bg-red-950/40 text-xs font-bold text-red-400">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-200">{file.name}</p>
                      <p className="text-sm text-zinc-500">{fmtSize(file.size)}</p>
                    </div>
                  </div>
                )}

                {/* Remove file button */}
                <button
                  onClick={(e) => { e.stopPropagation(); resetFile(); }}
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-zinc-300 transition hover:bg-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="Remover ficheiro"
                >
                  <IconX />
                </button>
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-800/40 bg-red-950/30 px-4 py-3 text-sm text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={1.5} stroke="currentColor" className="mt-0.5 h-4 w-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              {error}
            </div>
          )}

          {/* Extract button */}
          <button
            onClick={handleExtract}
            disabled={!file || isExtracting}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isExtracting ? (
              <>
                <IconSpin />
                A extrair texto…
              </>
            ) : (
              <>
                <IconSparkle />
                Extrair texto com Gemini
              </>
            )}
          </button>

          {/* Items list */}
          {items.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Itens processados
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectItem(item)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      selectedId === item.id
                        ? 'bg-indigo-950/60 ring-1 ring-indigo-700/60'
                        : 'bg-zinc-900/60 hover:bg-zinc-800/60'
                    }`}
                  >
                    {/* Status dot */}
                    <span
                      className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                        item.status === 'archived' ? 'bg-zinc-600' : 'bg-indigo-500'
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {item.filename}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {item.language === 'pt-PT' ? 'pt-PT' : 'en-US'}
                        {' · '}
                        {fmtTime(item.createdAt)}
                        {item.status === 'archived' && ' · arquivado'}
                      </p>
                    </div>

                    {/* Playing animation */}
                    {selectedId === item.id && isPlaying && <Waveform />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ════ RIGHT COLUMN ════ */}
        <section className="flex flex-col gap-5">
          {selected ? (
            <>
              {/* Item header card */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-zinc-200">
                      {selected.filename}
                    </h2>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {selected.language === 'pt-PT'
                        ? '🇵🇹 Português'
                        : '🇬🇧 English'}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      selected.status === 'archived'
                        ? 'bg-zinc-800 text-zinc-500'
                        : 'bg-indigo-950 text-indigo-400'
                    }`}
                  >
                    {selected.status === 'archived' ? 'Arquivado' : 'Não ouvido'}
                  </span>
                </div>
              </div>

              {/* Audio controls */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  {isPlaying ? <IconPause /> : <IconPlay />}
                  {isPlaying ? 'Pausa' : 'Reproduzir'}
                </button>

                {isPlaying && (
                  <button
                    onClick={stopAudio}
                    className="flex items-center gap-2 rounded-xl bg-zinc-800 px-5 py-2.5 font-medium text-zinc-300 transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                  >
                    <IconStop />
                    Parar
                  </button>
                )}

                {selected.status !== 'archived' && (
                  <button
                    onClick={() => archiveItem(selected.id)}
                    className="ml-auto flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                  >
                    <IconArchive />
                    Arquivar
                  </button>
                )}
              </div>

              {/* Text viewer */}
              <div className="flex-1 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                  {selected.text}
                </p>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-800">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-600">
                <IconSound />
              </div>
              <div className="text-center">
                <p className="font-medium text-zinc-500">Pronto para ouvir</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Carregue um ficheiro e extraia o texto
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
