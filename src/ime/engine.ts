import { type ScriptMode } from "./coding.ts";

export type Candidate = {
  text: string;
  exact: boolean;
  kind: "char" | "phrase";
  rank: number;
  strokes: number;
};

type SeqEntry = { seq: string; chars: string[] };

export type Dict = {
  buckets: SeqEntry[][];
  rankT: Map<string, number>;
  rankS: Map<string, number>;
  assocT: Map<string, string[]>;
  assocS: Map<string, string[]>;
  hideInTrad: Set<string>;
  hideInSimp: Set<string>;
  rare: Set<string>;
  charCount: number;
  phraseCount: number;
};

export type RankBias = "stroke" | "yue" | "guo";

/** Colloquial Cantonese characters. Shifted as a group, not a separate frequency list. */
export const YUE_CHARS = new Set(
  [..."係唔咗嘅冇嚟咁啲佢喺嗰哋乜嘢咩咪嗮畀睇喎喇啱晏瞓冚拎攞揼撳嗌嘈叻喐噚咋啫囉啵吖噉孖孻尐搵揾攰嘥佬仔諗靚噏嘟唞踎嚿嗱吔嘜"],
);

const YUE_SHIFT = 100_000;
const ASSOC_CAP = 36;
const FALL = 1_000_000;
const CAP = 180;

export type DictTexts = {
  strokes: string;
  phrasesT: string;
  phrasesS: string;
  rankT: string;
  rankS: string;
  onlyT: string;
  onlyS: string;
  assocT?: string | null;
  assocS?: string | null;
};

function rankMap(text: string): Map<string, number> {
  const map = new Map<string, number>();
  let i = 0;
  for (const ch of text) {
    if (!map.has(ch)) map.set(ch, i++);
  }
  return map;
}

function onlySet(text: string): Set<string> {
  const set = new Set<string>();
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t) set.add(t);
  }
  return set;
}

function matchPrefix(code: string, input: string): boolean {
  if (input.length > code.length) return false;
  for (let i = 0; i < input.length; i++) {
    const q = input[i]!;
    if (q !== "*" && q !== code[i]) return false;
  }
  return true;
}

export function buildDict(texts: DictTexts): Dict {
  const rankT = rankMap(texts.rankT);
  const rankS = rankMap(texts.rankS);
  const onlyT = onlySet(texts.onlyT);
  const onlyS = onlySet(texts.onlyS);
  const buckets: SeqEntry[][] = [[], [], [], [], []];
  const primary = new Map<string, string>();
  const allChars = new Set<string>();

  for (const line of texts.strokes.split("\n")) {
    const tab = line.indexOf("\t");
    if (tab <= 0) continue;
    const seq = line.slice(0, tab);
    const chars = [...line.slice(tab + 1)];
    if (!seq || chars.length === 0) continue;
    const bi = seq.charCodeAt(0) - 49;
    if (bi < 0 || bi > 4) continue;
    buckets[bi]!.push({ seq, chars });
    for (const ch of chars) {
      allChars.add(ch);
      const prev = primary.get(ch);
      if (!prev || seq.length < prev.length || (seq.length === prev.length && seq < prev)) {
        primary.set(ch, seq);
      }
    }
  }

  const hideInTrad = new Set<string>();
  const hideInSimp = new Set<string>();
  for (const ch of allChars) {
    const inT = onlyT.has(ch) || (rankT.has(ch) && !rankS.has(ch));
    const inS = onlyS.has(ch) || (rankS.has(ch) && !rankT.has(ch));
    if (inS && !inT) hideInTrad.add(ch);
    else if (inT && !inS) hideInSimp.add(ch);
  }

  const rare = new Set<string>();
  for (const ch of allChars) {
    if (rankT.has(ch) || rankS.has(ch)) continue;
    rare.add(ch);
  }

  let phraseCount = 0;
  const seenPhrase = new Set<string>();

  const countPhrases = (text: string, list: "t" | "s") => {
    for (const line of text.split("\n")) {
      const phrase = line.trim();
      if ([...phrase].length < 2) continue;
      const chars = [...phrase];
      if (!primary.get(chars[0]!) || !primary.get(chars[chars.length - 1]!)) continue;
      const key = list + phrase;
      if (seenPhrase.has(key)) continue;
      seenPhrase.add(key);
      phraseCount += 1;
    }
  };
  countPhrases(texts.phrasesT, "t");
  countPhrases(texts.phrasesS, "s");

  return {
    buckets,
    rankT,
    rankS,
    assocT: resolveAssoc(texts.assocT, texts.phrasesT, rankT),
    assocS: resolveAssoc(texts.assocS, texts.phrasesS, rankS),
    hideInTrad,
    hideInSimp,
    rare,
    charCount: allChars.size,
    phraseCount,
  };
}

export function loadAssoc(text: string): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const line of text.split("\n")) {
    const tab = line.indexOf("\t");
    if (tab <= 0) continue;
    const k = line.slice(0, tab).trim();
    const v = line.slice(tab + 1).trim();
    if (k && v) m.set(k, [...v].slice(0, ASSOC_CAP));
  }
  return m;
}

function resolveAssoc(precomputed: string | null | undefined, phrases: string, rank: Map<string, number>) {
  if (precomputed && precomputed.trim()) {
    const parsed = loadAssoc(precomputed);
    if (parsed.size > 0) return parsed;
  }
  return buildAssoc(phrases, rank);
}

function buildAssoc(text: string, rank: Map<string, number>): Map<string, string[]> {
  const counts = new Map<string, Map<string, number>>();
  for (const line of text.split("\n")) {
    const chars = [...line.trim()];
    for (let i = 0; i < chars.length - 1; i++) {
      const a = chars[i]!;
      const b = chars[i + 1]!;
      let row = counts.get(a);
      if (!row) counts.set(a, (row = new Map()));
      row.set(b, (row.get(b) ?? 0) + 1);
    }
  }
  const out = new Map<string, string[]>();
  for (const [a, row] of counts) {
    const list = [...row.entries()]
      .sort((x, y) => {
        if (y[1] !== x[1]) return y[1] - x[1];
        const rx = rank.get(x[0]) ?? FALL;
        const ry = rank.get(y[0]) ?? FALL;
        if (rx !== ry) return rx - ry;
        return x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0;
      })
      .slice(0, ASSOC_CAP)
      .map(([ch]) => ch);
    out.set(a, list);
  }
  return out;
}

function adjustedRank(dict: Dict, text: string, script: ScriptMode, bias: RankBias): number {
  const base = rankOf(dict, text, script);
  if (bias === "stroke" || [...text].length !== 1 || !YUE_CHARS.has(text)) return base;
  return bias === "yue" ? base - YUE_SHIFT : base + YUE_SHIFT;
}
function rankOf(dict: Dict, text: string, script: ScriptMode): number {
  let best = FALL;
  for (const ch of text) {
    const t = dict.rankT.get(ch);
    const s = dict.rankS.get(ch);
    const r =
      script === "trad" ? (t ?? FALL) : script === "simp" ? (s ?? FALL) : Math.min(t ?? FALL, s ?? FALL);
    if (r < best) best = r;
  }
  return best;
}

function hidden(dict: Dict, text: string, script: ScriptMode, dropRare = false, bias: RankBias = "stroke"): boolean {
  for (const ch of text) {
    if (dropRare && dict.rare.has(ch) && !(bias === "yue" && YUE_CHARS.has(ch))) return true;
  }
  if (script === "all") return false;
  const set = script === "trad" ? dict.hideInTrad : dict.hideInSimp;
  for (const ch of text) if (set.has(ch)) return true;
  return false;
}

function consider(best: Map<string, Candidate>, cand: Candidate) {
  const prev = best.get(cand.text);
  if (!prev || cmp(cand, prev) < 0) best.set(cand.text, cand);
}

function cmp(a: Candidate, b: Candidate): number {
  const ga = a.exact ? (a.kind === "char" ? 0 : 1) : 2;
  const gb = b.exact ? (b.kind === "char" ? 0 : 1) : 2;
  if (ga !== gb) return ga - gb;
  const ra = a.rank + (!a.exact && a.kind === "phrase" ? 40 : 0);
  const rb = b.rank + (!b.exact && b.kind === "phrase" ? 40 : 0);
  if (ra !== rb) return ra - rb;
  if (a.kind !== b.kind) return a.kind === "char" ? -1 : 1;
  if (a.strokes !== b.strokes) return a.strokes - b.strokes;
  return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
}

export function associations(
  dict: Dict,
  ch: string,
  script: ScriptMode,
  dropRare = false,
  bias: RankBias = "stroke",
): string[] {
  const primary = script === "simp" ? dict.assocS : dict.assocT;
  const list = [...(primary.get(ch) ?? [])];
  if (script === "all") {
    const seen = new Set(list);
    for (const next of dict.assocS.get(ch) ?? []) {
      if (!seen.has(next)) list.push(next);
    }
  }
  return prefer(list.filter((next) => !hidden(dict, next, script, dropRare, bias)), bias);
}

/** 預設 keeps the table order. 粵語 / 國語 move the colloquial group as a block. */
function prefer(list: string[], bias: RankBias): string[] {
  if (bias === "stroke") return list;
  const yue: string[] = [];
  const rest: string[] = [];
  for (const ch of list) (YUE_CHARS.has(ch) ? yue : rest).push(ch);
  return bias === "yue" ? [...yue, ...rest] : [...rest, ...yue];
}

export function search(
  dict: Dict,
  input: string,
  script: ScriptMode,
  bias: RankBias = "stroke",
  dropRare = false,
): Candidate[] {
  if (!input || ![...input].every((c) => c === "*" || (c >= "1" && c <= "5"))) return [];
  const seqPools =
    input[0] === "*" ? dict.buckets : [dict.buckets[input.charCodeAt(0)! - 49] ?? []];
  const best = new Map<string, Candidate>();

  for (const pool of seqPools) {
    for (const entry of pool) {
      if (!matchPrefix(entry.seq, input)) continue;
      const exact = input.length === entry.seq.length;
      for (const ch of entry.chars) {
        if (hidden(dict, ch, script, dropRare, bias)) continue;
        consider(best, {
          text: ch,
          exact,
          kind: "char",
          rank: adjustedRank(dict, ch, script, bias),
          strokes: entry.seq.length,
        });
      }
    }
  }

  const items = [...best.values()].sort(cmp);
  return items.slice(0, CAP);
}

export const CANDIDATE_CAP = CAP;
