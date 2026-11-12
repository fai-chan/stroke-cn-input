import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent } from "react";
import { Check, Copy, Github, Settings } from "lucide-react";
import {
  compositionBounds,
  digitsToLetters,
  FULL_EXAMPLES,
  GLYPH,
  lettersOf,
  lettersToDigits,
  LAYOUTS,
  STROKE_NAME,
  textForCopy,
  type LayoutId,
} from "../ime/coding";
import { associations, search, type Dict } from "../ime/engine";
import { loadDict } from "../ime/load";
import {
  DEFAULTS,
  isBias,
  isBool,
  isEntry,
  isLayout,
  isScript,
  isTheme,
  STORE,
  type EntryMode,
  type Prefs,
} from "../ime/prefs";
import { CandidatePane } from "./candidates";
import { KEY_ROWS, PAGE, PUNCTUATION } from "./constants";
import { Help } from "./help";
import { SettingsSheet } from "./settings";

function isHan(ch: string): boolean {
  return /\p{Script=Han}/u.test(ch);
}

export function StrokeApp() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [text, setText] = useState("");
  const [sel, setSel] = useState({ start: 0, end: 0 });
  const [page, setPage] = useState(0);
  const [dict, setDict] = useState<Dict | null>(null);
  const [dictError, setDictError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "empty">("idle");
  const [holdPad, setHoldPad] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [punctOpen, setPunctOpen] = useState(false);
  const [assocOff, setAssocOff] = useState<string | null>(null);
  const [pickedAt, setPickedAt] = useState<number | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const strokeRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef(0);
  const takeDigitRef = useRef<(key: string) => boolean>(() => false);

  const { layout, script, entry, bias, dropRare } = prefs;
  const letters = useMemo(() => lettersOf(layout), [layout]);

  const strokeComp = useMemo(() => {
    if (sel.start !== sel.end) return { start: sel.start, end: sel.start, raw: "" };
    return compositionBounds(text, sel.start, letters);
  }, [letters, sel.start, sel.end, text]);
  const beeComp = useMemo(() => {
    if (entry !== "keyboard" || sel.start !== sel.end) {
      return { start: sel.start, end: sel.start, raw: "" };
    }
    return compositionBounds(text, sel.start, new Set(["b"]));
  }, [entry, sel.start, sel.end, text]);
  const comp = useMemo(() => {
    if (!beeComp.raw) return strokeComp;
    let start = beeComp.start;
    while (start > 0 && letters.has(text[start - 1]!.toLowerCase())) start -= 1;
    return { start, end: beeComp.end, raw: text.slice(start, beeComp.end).toLowerCase() };
  }, [beeComp, letters, strokeComp, text]);

  const digits = lettersToDigits(beeComp.raw ? text.slice(comp.start, beeComp.start).toLowerCase() : strokeComp.raw, layout);
  const bees = beeComp.raw;
  const found = useMemo(
    () => (dict && digits ? search(dict, digits, script, bias, dropRare) : []),
    [bias, dict, digits, dropRare, script],
  );
  const anchor = useMemo(() => {
    if (digits || bees || punctOpen || sel.start !== sel.end) return "";
    const ch = text[sel.start - 1] ?? "";
    return isHan(ch) ? ch : "";
  }, [bees, digits, punctOpen, sel.start, sel.end, text]);
  const assoc = useMemo(
    () => (dict && anchor ? associations(dict, anchor, script, dropRare, bias) : []),
    [anchor, bias, dict, dropRare, script],
  );
  const associating =
    pickedAt === sel.start && assoc.length > 0 && assocOff !== `${sel.start}:${anchor}`;
  const picks = punctOpen || bees ? PUNCTUATION : digits ? found.map((c) => c.text) : assoc;
  const pageCount = Math.max(1, Math.ceil(picks.length / PAGE));
  const safePage = picks.length === 0 ? 0 : Math.min(page, pageCount - 1);
  const visible = picks.slice(safePage * PAGE, safePage * PAGE + PAGE);
  const queryKey = `${digits}|${bees}|${script}|${layout}|${bias}|${dropRare ? 1 : 0}|${punctOpen || bees ? "punct" : digits ? "char" : anchor}`;

  useLayoutEffect(() => {
    const el = strokeRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [digits]);

  const stateRef = useRef({
    letters,
    layout,
    safePage,
    picks,
    pageCount,
    entry,
    punctOpen,
    bees,
    associating,
  });
  stateRef.current = { letters, layout, safePage, picks, pageCount, entry, punctOpen, bees, associating };

  useEffect(() => {
    setPickedAt((cur) => (cur != null && cur !== sel.start ? null : cur));
  }, [sel.start]);

  useEffect(() => {
    setPage(0);
  }, [queryKey]);

  useLayoutEffect(() => {
    let entryMode: EntryMode = window.matchMedia("(pointer: coarse)").matches ? "button" : "keyboard";
    const root = document.documentElement;
    try {
      const cached = (window as Window & { __STROKE_PREFS?: Partial<Prefs> | null }).__STROKE_PREFS;
      const saved = cached === undefined ? localStorage.getItem(STORE) : null;
      const raw = cached ? null : saved;
      const p = cached ?? (raw ? (JSON.parse(raw) as Partial<Prefs>) : null);
      if (p) {
        if (isEntry(p.entry)) entryMode = p.entry;
        const next: Prefs = {
          layout: isLayout(p.layout) ? p.layout : DEFAULTS.layout,
          script: isScript(p.script) ? p.script : DEFAULTS.script,
          entry: entryMode,
          theme: isTheme(p.theme) ? p.theme : DEFAULTS.theme,
          bias: isBias(p.bias) ? p.bias : DEFAULTS.bias,
          dropRare: isBool(p.dropRare) ? p.dropRare : DEFAULTS.dropRare,
        };
        root.dataset.theme = next.theme;
        root.dataset.entry = next.entry;
        setPrefs(next);
      } else {
        root.dataset.entry = entryMode;
        setPrefs((prev) => ({ ...prev, entry: entryMode }));
      }
    } catch {
      /* ignore broken prefs */
    }
    root.removeAttribute("data-boot");
    setReady(true);
    if (entryMode === "keyboard" && !window.matchMedia("(pointer: coarse)").matches) {
      areaRef.current?.focus({ preventScroll: true });
    }
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.theme = prefs.theme;
    root.dataset.entry = prefs.entry;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", prefs.theme === "dark" ? "#141210" : "#f3eee4");
  }, [prefs.theme, prefs.entry, ready]);

  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    let pending = 0;
    const apply = () => {
      if (!vv) {
        root.style.setProperty("--kb", "0px");
        return;
      }
      const overlap = window.innerHeight - vv.height - vv.offsetTop;
      const kb = overlap > 80 && overlap < window.innerHeight * 0.75 ? Math.round(overlap) : 0;
      window.clearTimeout(pending);
      const write = (value: number) => {
        root.style.setProperty("--kb", `${value}px`);
        root.dataset.kb = value > 0 ? "1" : "0";
      };
      if (kb === 0) {
        write(0);
        return;
      }
      pending = window.setTimeout(() => write(kb), 120);
    };
    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      window.clearTimeout(pending);
      root.style.removeProperty("--kb");
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORE, JSON.stringify(prefs));
  }, [prefs, ready]);

  useEffect(() => {
    let dead = false;
    loadDict()
      .then((d) => {
        if (!dead) setDict(d);
      })
      .catch((err: unknown) => {
        if (!dead) setDictError(err instanceof Error ? err.message : "字庫讀取失敗");
      });
    return () => {
      dead = true;
    };
  }, []);

  useLayoutEffect(() => {
    const area = areaRef.current;
    const back = backRef.current;
    if (!area || !back) return;
    back.scrollTop = area.scrollTop;
    back.scrollLeft = area.scrollLeft;
  }, [text, sel]);

  function sync() {
    const el = areaRef.current;
    if (!el) return;
    setText(el.value);
    setSel({ start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 });
  }

  function focusArea() {
    const el = areaRef.current;
    if (!el || stateRef.current.entry === "button") return;
    el.focus({ preventScroll: true });
  }

  function commit(replacement: string) {
    const el = areaRef.current;
    if (!el) return;
    const s = stateRef.current;
    let start = el.selectionStart ?? 0;
    let end = el.selectionEnd ?? start;
    if (start === end) {
      const b = compositionBounds(el.value, start, s.letters);
      if (b.raw) {
        start = b.start;
        end = b.end;
      }
    }
    el.setRangeText(replacement, start, end, "end");
    setPickedAt(el.selectionStart ?? 0);
    setAssocOff(null);
    sync();
    focusArea();
  }

  function togglePunct() {
    setPunctOpen((open) => !open);
    setPage(0);
  }

  function insertPunct(mark: string) {
    const el = areaRef.current;
    if (!el) return;
    setPickedAt(null);
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    if (start === end) {
      const beesNow = compositionBounds(el.value, start, new Set(["b"]));
      if (beesNow.raw && entry === "keyboard") {
        el.setRangeText(mark, beesNow.start, beesNow.end, "end");
        setPunctOpen(false);
        sync();
        focusArea();
        return;
      }
      const b = compositionBounds(el.value, start, letters);
      if (b.raw && start === b.end && entry === "button") {
        el.setRangeText(mark, b.start, b.start, "end");
        const caret = b.start + mark.length + b.raw.length;
        el.selectionStart = caret;
        el.selectionEnd = caret;
        setPunctOpen(false);
        sync();
        focusArea();
        return;
      }
    }
    el.setRangeText(mark, start, end, "end");
    setPunctOpen(false);
    sync();
    focusArea();
  }

  function insertSpace() {
    setPunctOpen(false);
    insertRaw(" ");
  }

  function insertRaw(chunk: string) {
    const el = areaRef.current;
    if (!el) return;
    el.setRangeText(chunk, el.selectionStart ?? 0, el.selectionEnd ?? 0, "end");
    sync();
    focusArea();
  }

  function insertDigits(d: string) {
    const el = areaRef.current;
    if (!el) return;
    const chunk = digitsToLetters(d, layout);
    let start = el.selectionStart ?? el.value.length;
    let end = el.selectionEnd ?? start;
    if (start === end) {
      const b = compositionBounds(el.value, start, lettersOf(layout));
      if (b.raw) {
        start = b.start;
        end = b.end;
      }
    }
    el.setRangeText(chunk, start, end, "end");
    sync();
    focusArea();
  }

  function backspace() {
    const el = areaRef.current;
    if (!el) return;
    if (stateRef.current.associating) {
      const caret = el.selectionStart ?? 0;
      setAssocOff(`${caret}:${el.value[caret - 1] ?? ""}`);
      return;
    }
    const a = el.selectionStart ?? 0;
    const b = el.selectionEnd ?? a;
    if (a !== b) el.setRangeText("", a, b, "end");
    else if (a > 0) el.setRangeText("", a - 1, a, "end");
    setPickedAt(null);
    sync();
    focusArea();
  }

  function clearAll() {
    const el = areaRef.current;
    if (!el || el.value.length === 0) return;
    el.setRangeText("", 0, el.value.length, "end");
    setPunctOpen(false);
    setPickedAt(null);
    sync();
    focusArea();
  }

  function switchLayout(next: LayoutId) {
    if (next === layout) return;
    const el = areaRef.current;
    if (el && el.selectionStart === el.selectionEnd) {
      const b = compositionBounds(el.value, el.selectionStart ?? 0, lettersOf(layout));
      if (b.raw) {
        const remapped = digitsToLetters(lettersToDigits(b.raw, layout), next);
        el.setRangeText(remapped, b.start, b.end, "end");
        sync();
      }
    }
    setPrefs((p) => ({ ...p, layout: next }));
  }

  function setEntry(next: EntryMode) {
    const el = areaRef.current;
    if (next === "button") {
      setHoldPad(false);
      if (el) {
        el.inputMode = "none";
        el.blur();
      }
    }
    setPrefs((p) => ({ ...p, entry: next }));
  }

  function armKeyboard() {
    const el = areaRef.current;
    if (!el) return;
    el.readOnly = false;
    el.removeAttribute("readonly");
    el.inputMode = "text";
    setHoldPad(true);
    setPrefs((p) => ({ ...p, entry: "keyboard" }));
    el.focus();
    window.setTimeout(() => setHoldPad(false), 420);
  }

  function takeDigit(key: string) {
    if (key < "1" || key > "9") return false;
    const s = stateRef.current;
    const el = areaRef.current;
    if (!el) return false;
    const collapsed = el.selectionStart === el.selectionEnd;
    const raw = collapsed ? compositionBounds(el.value, el.selectionStart ?? 0, s.letters).raw : "";
    if (!s.punctOpen && !s.bees && !s.associating && !raw) return false;
    const cand = s.picks[s.safePage * PAGE + (57 - key.charCodeAt(0))];
    if (cand) {
      if (s.punctOpen || s.bees) insertPunct(cand);
      else commit(cand);
    }
    return true;
  }
  takeDigitRef.current = takeDigit;

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const onBefore = (event: Event) => {
      const ie = event as InputEvent;
      if (stateRef.current.entry === "button") {
        ie.preventDefault();
        return;
      }
      if (ie.inputType !== "insertText" && ie.inputType !== "insertCompositionText") return;
      const data = ie.data ?? "";
      if (data.length === 1 && takeDigitRef.current(data)) ie.preventDefault();
    };
    el.addEventListener("beforeinput", onBefore);
    return () => el.removeEventListener("beforeinput", onBefore);
  }, []);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing) return;
    if (e.altKey || e.metaKey || e.ctrlKey) return;

    const s = stateRef.current;
    if (s.entry === "button") {
      if (e.key !== "Tab") e.preventDefault();
      return;
    }

    const el = areaRef.current;
    if (!el) return;
    const lower = e.key.toLowerCase();

    if (e.key === " ") {
      e.preventDefault();
      insertSpace();
      return;
    }

    if (lower === "b" && e.key.length === 1) {
      e.preventDefault();
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? start;
      el.setRangeText("b", start, end, "end");
      setPage(0);
      sync();
      return;
    }

    if (e.key.length === 1 && s.letters.has(lower)) {
      e.preventDefault();
      el.setRangeText(lower, el.selectionStart ?? 0, el.selectionEnd ?? 0, "end");
      sync();
      return;
    }

    if (e.key >= "1" && e.key <= "9" && takeDigit(e.key)) {
      e.preventDefault();
      return;
    }

    if (s.punctOpen || s.bees) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (s.bees) {
          const b = compositionBounds(el.value, el.selectionStart ?? 0, new Set(["b"]));
          el.setRangeText("", b.start, b.end, "end");
          sync();
        }
        setPunctOpen(false);
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        if (!s.bees) return;
        e.preventDefault();
        const a = el.selectionStart ?? 0;
        const b = el.selectionEnd ?? a;
        if (a !== b) el.setRangeText("", a, b, "end");
        else if (e.key === "Backspace" && a > 0) el.setRangeText("", a - 1, a, "end");
        else if (e.key === "Delete" && a < el.value.length) el.setRangeText("", a, a + 1, "end");
        sync();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        setPage((p) => Math.max(0, Math.min(p, s.pageCount - 1) - 1));
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        setPage((p) => Math.min(s.pageCount - 1, Math.min(p, s.pageCount - 1) + 1));
      }
      return;
    }

    const collapsed = el.selectionStart === el.selectionEnd;
    const raw = collapsed ? compositionBounds(el.value, el.selectionStart ?? 0, s.letters).raw : "";
    if (!raw && !s.associating) return;

    if (!raw) {
      if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        setPage((p) => Math.max(0, Math.min(p, s.pageCount - 1) - 1));
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        setPage((p) => Math.min(s.pageCount - 1, Math.min(p, s.pageCount - 1) + 1));
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const b = compositionBounds(el.value, el.selectionStart ?? 0, s.letters);
      el.setRangeText("", b.start, b.end, "end");
      sync();
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      setPage((p) => Math.max(0, Math.min(p, s.pageCount - 1) - 1));
      return;
    }
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      setPage((p) => Math.min(s.pageCount - 1, Math.min(p, s.pageCount - 1) + 1));
    }
  }

  async function copyAll() {
    const el = areaRef.current;
    const value = el?.value ?? text;
    const collapsed = !el || el.selectionStart === el.selectionEnd;
    const caret = el?.selectionStart ?? value.length;
    const clean = collapsed ? textForCopy(value, caret, letters, entry === "keyboard") : value;
    window.clearTimeout(copyTimer.current);
    if (!clean) {
      setCopyState("empty");
      copyTimer.current = window.setTimeout(() => setCopyState("idle"), 1600);
      focusArea();
      return;
    }
    try {
      await navigator.clipboard.writeText(clean);
    } catch {
      const buf = document.createElement("textarea");
      buf.value = clean;
      buf.setAttribute("readonly", "");
      buf.style.position = "fixed";
      buf.style.left = "-9999px";
      document.body.appendChild(buf);
      buf.select();
      document.execCommand("copy");
      buf.remove();
    }
    setCopyState("ok");
    copyTimer.current = window.setTimeout(() => setCopyState("idle"), 1400);
    focusArea();
  }

  function keepFocus(e: MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("button")) e.preventDefault();
  }

  const examples = FULL_EXAMPLES;
  const composing = digits.length > 0;
  const choosing = composing || bees.length > 0 || punctOpen || associating;

  return (
    <div className="ime-app flex flex-col overflow-hidden bg-paper text-ink" onMouseDown={keepFocus}>
      <header className="flex shrink-0 items-center gap-3 px-4 pt-3 pb-2">
        <div className="flex size-10 shrink-0 items-center justify-center border-2 border-cinnabar bg-cinnabar text-sheet">
          <span className="flex size-7 flex-col items-center justify-center border border-sheet/80 font-serif text-[10px] leading-none font-bold">
            <span>筆</span>
            <span>劃</span>
          </span>
        </div>
        <h1 className="min-w-0 flex-1 font-serif text-lg leading-tight font-bold sm:text-xl">線上筆劃中文輸入</h1>
        <a
          href="https://github.com/fai-chan/stroke-cn-input"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="inline-flex size-11 items-center justify-center rounded-full bg-sheet text-ink border border-line"
        >
          <Github className="size-5" />
        </a>
        <button
          type="button"
          aria-expanded={settingsOpen}
          aria-label="設定"
          onClick={() => setSettingsOpen((open) => !open)}
          className="inline-flex size-11 items-center justify-center rounded-full bg-sheet text-ink border border-line"
        >
          <Settings className="size-5" />
        </button>
      </header>

      <main className="ime-stage mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4">
        {choosing ? (
          <CandidatePane
            digits={digits}
            punct={punctOpen || bees.length > 0}
            assoc={associating && !digits && !punctOpen && !bees}
            dict={dict}
            dictError={dictError}
            visible={visible}
            total={picks.length}
            page={safePage}
            pageCount={pageCount}
            entry={entry}
            onPick={punctOpen || bees ? insertPunct : commit}
            onPage={(dir) =>
              setPage((p) => {
                const cur = Math.min(p, pageCount - 1);
                return dir < 0 ? Math.max(0, cur - 1) : Math.min(pageCount - 1, cur + 1);
              })
            }
            onRetry={() => {
              setDictError(null);
              loadDict()
                .then(setDict)
                .catch((err: unknown) =>
                  setDictError(err instanceof Error ? err.message : "字庫讀取失敗"),
                );
            }}
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-auto pb-3">
          <Help
            entry={entry}
            theme={prefs.theme}
            ready={ready}
            layout={layout}
            dict={dict}
            dictError={dictError}
            examples={examples}
            onExample={insertDigits}
            onRetry={() => {
              setDictError(null);
              loadDict()
                .then(setDict)
                .catch((err: unknown) =>
                  setDictError(err instanceof Error ? err.message : "字庫讀取失敗"),
                );
            }}
          />
          </div>
        )}
      </main>

      <footer className="ime-dock shrink-0 border-t border-line bg-sheet">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1.5 px-4 pt-1.5">
          {digits.length > 0 || bees.length > 0 ? (
            <div
              ref={strokeRef}
              className="stroke-row flex h-8 min-w-0 flex-nowrap items-end gap-1 overflow-x-auto overflow-y-hidden"
              data-strokes={digits + bees}
            >
              {[...digits].map((d, i) => (
                <span key={`s-${d}-${i}`} className="px-0.5 font-serif text-2xl leading-none whitespace-nowrap">
                  {GLYPH[d]}
                </span>
              ))}
              {[...bees].map((_, i) => (
                <span key={`b-${i}`} className="px-0.5 font-serif text-2xl leading-none whitespace-nowrap">
                  B
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex items-stretch gap-1.5">
          <div className="relative h-16 min-w-0 flex-1 md:h-28">
            <div
              ref={backRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-xl border border-line bg-paper"
            >
              <div className="h-full overflow-hidden p-3 font-serif text-lg leading-8 break-words whitespace-pre-wrap">
              <Highlighted text={text} start={comp.raw ? comp.start : 0} end={comp.raw ? comp.end : 0} />
              </div>
            </div>
            <textarea
              id="draft"
              ref={areaRef}
              aria-label="文稿"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              lang="zh-Hant"
              inputMode={entry === "keyboard" ? "text" : "none"}
              onBeforeInput={(e: FormEvent<HTMLTextAreaElement>) => {
                if (entry === "button") e.preventDefault();
              }}
              onPaste={(e) => {
                if (entry === "button") e.preventDefault();
              }}
              onDrop={(e) => {
                if (entry === "button") e.preventDefault();
              }}
              onInput={sync}
              onKeyUp={sync}
              onSelect={sync}
              onKeyDown={onKeyDown}
              onScroll={(e) => {
                if (!backRef.current) return;
                backRef.current.scrollTop = e.currentTarget.scrollTop;
                backRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }}
              className="ime-field absolute inset-0 h-full w-full resize-none rounded-xl border border-transparent bg-transparent p-3 font-serif text-lg leading-8 break-words whitespace-pre-wrap outline-none"
            />
          </div>
            <button
              type="button"
              onClick={() => void copyAll()}
              aria-live="polite"
              className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[11px] leading-tight text-muted border border-line ${copyState === "empty" ? "w-16" : "w-14"}`}
            >
              {copyState === "ok" ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copyState === "ok" ? "已複製" : copyState === "empty" ? "沒有可複製的文字" : "複製"}
            </button>
          </div>

          {entry === "button" || holdPad ? (
            <div className="ime-pad flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            {KEY_ROWS.flatMap((row) =>
              [...row].map((letter) => {
                const digit = LAYOUTS[layout].map[letter] ?? "";
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => insertRaw(letter)}
                    className="flex h-11 shrink-0 flex-col items-center justify-center rounded-xl bg-paper border border-line disabled:opacity-40 sm:h-14"
                  >
                    <span className="font-serif text-2xl leading-none">{GLYPH[digit]}</span>
                    <span className="text-xs text-muted">{STROKE_NAME[digit]}</span>
                  </button>
                );
              }),
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Utility label="退格" onClick={backspace} />
            <button
              type="button"
              aria-pressed={punctOpen}
              onClick={togglePunct}
              className={
                punctOpen
                  ? "h-11 shrink-0 rounded-lg bg-cinnabar text-sm text-sheet border border-cinnabar"
                  : "h-11 shrink-0 rounded-lg bg-paper text-sm text-ink border border-line"
              }
            >
              標點
            </button>
            <Utility label="空白" onClick={insertSpace} />
            <Utility label="清除所有" onClick={clearAll} disabled={!text} />
          </div>
            </div>
          ) : null}
        </div>
      </footer>
      {settingsOpen ? (
        <SettingsSheet
          layout={layout}
          script={script}
          entry={entry}
          theme={prefs.theme}
          bias={bias}
          dropRare={dropRare}
          onLayout={switchLayout}
          onScript={(script) => setPrefs((p) => ({ ...p, script }))}
          onEntry={(next) => {
            if (next === "keyboard") armKeyboard();
            else setEntry("button");
          }}
          onTheme={(theme) => setPrefs((p) => ({ ...p, theme }))}
          onBias={(bias) => setPrefs((p) => ({ ...p, bias }))}
          onDropRare={(dropRare) => setPrefs((p) => ({ ...p, dropRare }))}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
    </div>
  );
}

function Highlighted({ text, start, end }: { text: string; start: number; end: number }) {
  const body =
    end > start ? (
      <>
        {text.slice(0, start)}
        <mark className="ime-mark">{text.slice(start, end)}</mark>
        {text.slice(end)}
      </>
    ) : (
      text
    );
  return (
    <>
      {body}
      {"\u200b"}
    </>
  );
}

function Utility({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-11 shrink-0 rounded-lg bg-paper text-sm text-ink border border-line disabled:opacity-40"
    >
      {label}
    </button>
  );
}
