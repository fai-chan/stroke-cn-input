import {
  digitsToGlyphs,
  digitsToLetters,
  GLYPH,
  LAYOUTS,
  STROKE_NAME,
  type LayoutId,
} from "../ime/coding";
import type { Dict } from "../ime/engine";
import { dictAsset } from "../ime/load";
import type { EntryMode, ThemeMode } from "../ime/prefs";
import { useCoarsePointer } from "./use-coarse-pointer";

function KeysShot({ theme, ready }: { theme: ThemeMode; ready: boolean }) {
  if (!ready) return null;
  const alt = "鍵盤上 U、I、O、J、K、L 與 9 以藍光標示";
  const name = theme === "dark" ? "keys-dark.webp?v=3" : "keys-light.webp?v=3";
  return (
    <figure className="keys-figure mx-auto w-full max-w-md">
      <img src={dictAsset(name)} alt={alt} width={1600} height={900} className="block h-auto w-full" />
    </figure>
  );
}

export function Help({
  entry,
  theme,
  ready,
  layout,
  dict,
  dictError,
  examples,
  onExample,
  onRetry,
}: {
  entry: EntryMode;
  theme: ThemeMode;
  ready: boolean;
  layout: LayoutId;
  dict: Dict | null;
  dictError: string | null;
  examples: { ch: string; digits: string; note: string }[];
  onExample: (digits: string) => void;
  onRetry: () => void;
}) {
  const coarse = useCoarsePointer();
  const steps =
    entry === "button"
      ? ["依筆順點下面的筆劃，再點字選定。", "標點按「標點」。左右滑動翻頁。"]
      : coarse
        ? ["依筆順按 U I O J K L，點字或 9–1 選字後字母換成漢字。", "標點按 B。左右滑動翻頁。"]
        : ["依筆順按 U I O J K L，點字或 9–1 選字後字母換成漢字。", "標點按 B。← → 或左右滑動翻頁。"];
  const keyNotes = [
    ["B", "標點"],
    ["空白", "空格"],
    ["9–1", "選字"],
    ...(coarse ? [] : [["← →", "翻頁"] as const]),
    ["退格", "刪除"],
    ["Esc", "取消筆劃"],
  ];
  return (
    <div className="flex flex-col gap-4">
      <KeysShot theme={theme} ready={ready} />
      <section className="rounded-xl bg-sheet p-4 border border-line">
        <h2 className="font-serif text-lg font-bold">怎麼打</h2>
        <ul className="mt-2 space-y-1.5 text-sm leading-6 text-ink">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>

      <section>
        <article className="rounded-xl border border-line bg-sheet p-3">
          <h2 className="text-sm font-medium text-muted">現在的鍵位 · {LAYOUTS[layout].hint}</h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {["u", "i", "o", "j", "k", "l"].map((letter) => {
              const digit = LAYOUTS[layout].map[letter] ?? "";
              return (
                <li
                  key={letter}
                  className="inline-flex items-baseline gap-2 rounded-lg bg-paper px-2.5 py-1.5 text-sm"
                >
                  <span className="font-medium">{letter.toUpperCase()}</span>
                  <span className="font-serif">
                    {GLYPH[digit]} {STROKE_NAME[digit]}
                  </span>
                </li>
              );
            })}
          </ul>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {keyNotes.map(([key, name]) => (
              <li key={key} className="inline-flex items-baseline gap-2 rounded-lg bg-paper px-2.5 py-1.5 text-sm">
                <span className="font-medium">{key}</span>
                <span>{name}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted">試打</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {examples.map((ex) => (
            <button
              key={ex.ch + ex.digits}
              type="button"
              onClick={() => onExample(ex.digits)}
              className="rounded-xl bg-sheet px-3 py-3 text-left border border-line"
            >
              <span className="block font-serif text-2xl leading-none">{ex.ch}</span>
              <span className="mt-2 block font-serif text-sm text-cinnabar">{digitsToGlyphs(ex.digits)}</span>
              <span className="mt-1 block text-xs text-muted">
                {digitsToLetters(ex.digits, layout).toUpperCase()} · {ex.note}
              </span>
            </button>
          ))}
        </div>
      </section>

      <p className="text-xs leading-5 text-muted">
        {dict
          ? `字庫 ${dict.charCount.toLocaleString("zh-Hant")} 字、${dict.phraseCount.toLocaleString("zh-Hant")} 條詞。`
          : dictError
            ? dictError
            : "正在載入筆劃字庫…"}
        {dictError ? (
          <>
            {" "}
            <button type="button" onClick={onRetry} className="text-cinnabar underline">
              重試
            </button>
          </>
        ) : null}
      </p>
    </div>
  );
}
