export interface LyricLine {
  tMs: number;
  text: string;
}

export interface LrcLibResult {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  instrumental?: boolean;
}

const STAMP = /\[(\d+):(\d+)(?:\.(\d+))?\]/g;

/** Parse an LRC string into time-sorted lyric lines. */
export function parseLrc(lrc: string): LyricLine[] {
  const out: LyricLine[] = [];
  for (const raw of lrc.split(/\r?\n/)) {
    const text = raw.replace(STAMP, '').trim();
    STAMP.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = STAMP.exec(raw))) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const frac = match[3] ? Number(`0.${match[3]}`) : 0;
      out.push({ tMs: (minutes * 60 + seconds + frac) * 1000, text });
    }
  }
  return out.sort((a, b) => a.tMs - b.tMs);
}
