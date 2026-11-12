import { useRef, type PointerEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { digitsToGlyphs } from "../ime/coding";
import { CANDIDATE_CAP, type Dict } from "../ime/engine";
import type { EntryMode } from "../ime/prefs";
import { PAGE } from "./constants";
import { useCoarsePointer } from "./use-coarse-pointer";

export function CandidatePane({
  digits,
  punct,
  assoc,
  dict,
  dictError,
  visible,
  total,
  page,
  pageCount,
  entry,
  onPick,
  onPage,
  onRetry,
}: {
  digits: string;
  punct: boolean;
  assoc: boolean;
  dict: Dict | null;
  dictError: string | null;
  visible: string[];
  total: number;
  page: number;
  pageCount: number;
  entry: EntryMode;
  onPick: (text: string) => void;
  onPage: (dir: -1 | 1) => void;
  onRetry: () => void;
}) {
  let message: ReactNode = null;
  if (!punct) {
    if (!dict && !dictError) message = "正在載入字庫…";
    else if (dictError) {
      message = (
        <>
          {dictError}{" "}
          <button type="button" onClick={onRetry} className="text-cinnabar underline">
            重試
          </button>
        </>
      );
    } else if (total === 0) message = `沒有符合「${digitsToGlyphs(digits)}」的字。可改用通配，或再刪一畫。`;
  }

  const coarse = useCoarsePointer();
  const swipeRef = useRef({ x: 0, y: 0, picking: false });

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    swipeRef.current = { x: e.clientX, y: e.clientY, picking: false };
  }
  function swiped(e: PointerEvent) {
    const dx = e.clientX - swipeRef.current.x;
    const dy = e.clientY - swipeRef.current.y;
    return Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy);
  }
  function onPointerUp(e: PointerEvent) {
    if (!swiped(e)) return;
    onPage(e.clientX - swipeRef.current.x < 0 ? 1 : -1);
  }
  function pick(text: string) {
    if (swipeRef.current.picking) return;
    swipeRef.current.picking = true;
    onPick(text);
    window.setTimeout(() => {
      swipeRef.current.picking = false;
    }, 0);
  }

  return (
    <div
      className="flex min-h-0 flex-1 touch-pan-y flex-col gap-1.5 pb-1"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {assoc
            ? entry === "button"
              ? "聯想 · 點字接上"
              : coarse
                ? "聯想 · 點字或 9–1 接上"
                : "聯想 · 點字或 9–1 接上 · ← → 翻頁"
            : punct
              ? entry === "button"
                ? "點選標點 · 左右滑動翻頁"
                : coarse
                  ? "點選或 9–1 選標點 · 左右滑動翻頁"
                  : "點選或 9–1 選標點 · ← → 翻頁"
              : entry === "button"
                ? "點字選定 · 左右滑動翻頁"
                : coarse
                  ? "點字或 9–1 選字 · 左右滑動翻頁"
                  : "點字或 9–1 選字 · ← → 翻頁"}
        </p>
        <p className="shrink-0 text-xs text-muted">
          {total === 0 ? "0" : `${page * PAGE + 1}–${page * PAGE + visible.length}`} / {total}
          {!punct && total >= CANDIDATE_CAP ? "+" : ""}
        </p>
      </div>
      {message ? (
        <p className="flex min-h-0 flex-1 items-center rounded-xl bg-sheet px-4 py-6 text-sm leading-6 border border-line">{message}</p>
      ) : (
        <div role="listbox" aria-label={punct ? "標點" : "候選字"} className="grid min-h-0 w-full max-h-[23.5rem] flex-1 grid-cols-3 gap-1.5 [grid-template-rows:repeat(3,minmax(0,1fr))]">
          {visible.map((c, i) => (
            <button
              key={`${c}-${i}`}
              type="button"
              role="option"
              aria-selected={false}
              onPointerUp={(e) => {
                if (swiped(e)) return;
                pick(c);
              }}
              onClick={() => pick(c)}
              className="relative flex h-full min-h-11 items-center justify-center rounded-xl border border-line bg-sheet px-1 text-center"
            >
              <span className="absolute top-1 left-1.5 text-[10px] text-cinnabar">{9 - i}</span>
              <span
                className={
                  c.length > 2
                    ? "font-serif text-sm leading-snug"
                    : c.length > 1
                      ? "font-serif text-lg leading-tight"
                      : "font-serif text-2xl leading-none"
                }
              >
                {c}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="flex shrink-0 items-center justify-center gap-2">
        <button
          type="button"
          aria-label="上一頁"
          disabled={page <= 0}
          onClick={() => onPage(-1)}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-sheet px-2.5 text-xs border border-line disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
          上一頁
        </button>
        <span className="min-w-16 text-center text-sm text-muted">
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          aria-label="下一頁"
          disabled={page >= pageCount - 1}
          onClick={() => onPage(1)}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-sheet px-2.5 text-xs border border-line disabled:opacity-40"
        >
          下一頁
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
