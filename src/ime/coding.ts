export type LayoutId = "jkluio" | "uiojkl";
export type ScriptMode = "trad" | "simp" | "all";
export type LangMode = "zh" | "en";

export const GLYPH: Record<string, string> = {
  "1": "一",
  "2": "丨",
  "3": "丿",
  "4": "丶",
  "5": "フ",
  "*": "＊",
};

export const STROKE_NAME: Record<string, string> = {
  "1": "橫",
  "2": "豎",
  "3": "撇",
  "4": "點",
  "5": "折",
  "*": "通配",
};

const JKLUIO: Record<string, string> = {
  j: "1",
  k: "2",
  l: "3",
  u: "4",
  i: "5",
  o: "*",
};

const UIOJKL: Record<string, string> = {
  u: "1",
  i: "2",
  o: "3",
  j: "4",
  k: "5",
  l: "*",
};

export const LAYOUTS: Record<
  LayoutId,
  { id: LayoutId; label: string; hint: string; map: Record<string, string> }
> = {
  jkluio: { id: "jkluio", label: "JKLUIO", hint: "標準", map: JKLUIO },
  uiojkl: { id: "uiojkl", label: "UIOJKL", hint: "傳統", map: UIOJKL },
};

const REVERSE: Record<LayoutId, Record<string, string>> = {
  jkluio: invert(JKLUIO),
  uiojkl: invert(UIOJKL),
};

function invert(map: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [letter, digit] of Object.entries(map)) out[digit] = letter;
  return out;
}

export function lettersOf(layout: LayoutId): Set<string> {
  return new Set(Object.keys(LAYOUTS[layout].map));
}

export function lettersToDigits(raw: string, layout: LayoutId): string {
  const map = LAYOUTS[layout].map;
  let out = "";
  for (const ch of raw.toLowerCase()) {
    const d = map[ch];
    if (!d) return "";
    out += d;
  }
  return out;
}

export function digitsToLetters(digits: string, layout: LayoutId): string {
  const rev = REVERSE[layout];
  let out = "";
  for (const d of digits) out += rev[d] ?? "";
  return out;
}

export function digitsToGlyphs(digits: string): string {
  let out = "";
  for (const d of digits) out += GLYPH[d] ?? "";
  return out;
}

/** Trailing run of stroke letters immediately before the caret. */
export function compositionBounds(
  text: string,
  caret: number,
  letters: Set<string>,
): { start: number; end: number; raw: string } {
  let start = caret;
  while (start > 0 && letters.has(text[start - 1]!.toLowerCase())) start -= 1;
  return { start, end: caret, raw: text.slice(start, caret).toLowerCase() };
}

/** Drop the stroke letters (and a trailing b in keyboard punctuation) still being composed. */
export function textForCopy(value: string, caret: number, letters: Set<string>, includeBee: boolean): string {
  if (caret < 0) caret = 0;
  if (caret > value.length) caret = value.length;
  if (includeBee) {
    const bee = compositionBounds(value, caret, new Set(["b"]));
    if (bee.raw) {
      let start = bee.start;
      while (start > 0 && letters.has(value[start - 1]!.toLowerCase())) start -= 1;
      return value.slice(0, start) + value.slice(bee.end);
    }
  }
  const stroke = compositionBounds(value, caret, letters);
  if (!stroke.raw) return value;
  return value.slice(0, stroke.start) + value.slice(stroke.end);
}

export const FULL_EXAMPLES: { ch: string; digits: string; note: string }[] = [
  { ch: "十", digits: "12", note: "橫、豎" },
  { ch: "人", digits: "34", note: "撇、點" },
  { ch: "口", digits: "251", note: "豎、折、橫" },
  { ch: "木", digits: "1234", note: "橫、豎、撇、點" },
];
