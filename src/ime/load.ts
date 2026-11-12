import { buildDict, type Dict } from "./engine";

let pending: Promise<Dict> | null = null;

/** Public URL of a file in `public/dict`. Honours Vite's `base`. */
export function dictAsset(name: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${prefix}/dict/${name}`;
}

async function fetchText(name: string): Promise<string> {
  const res = await fetch(dictAsset(name));
  if (!res.ok) throw new Error(`字庫讀取失敗（${name}）`);
  return res.text();
}

async function fetchOptional(name: string): Promise<string | null> {
  try {
    const res = await fetch(dictAsset(name));
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

export function loadDict(): Promise<Dict> {
  if (!pending) {
    pending = (async () => {
      const [strokes, phrasesT, phrasesS, rankT, rankS, onlyT, onlyS, assocT, assocS] = await Promise.all([
        fetchText("strokes.txt"),
        fetchText("phrases-t.txt"),
        fetchText("phrases-s.txt"),
        fetchText("rank-t.txt"),
        fetchText("rank-s.txt"),
        fetchText("only-t.txt"),
        fetchText("only-s.txt"),
        fetchOptional("assoc-t.txt"),
        fetchOptional("assoc-s.txt"),
      ]);
      return buildDict({ strokes, phrasesT, phrasesS, rankT, rankS, onlyT, onlyS, assocT, assocS });
    })().catch((err: unknown) => {
      pending = null;
      throw err;
    });
  }
  return pending;
}
