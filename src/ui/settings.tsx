import { useEffect, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import type { LayoutId, ScriptMode } from "../ime/coding";
import type { RankBias } from "../ime/engine";
import type { EntryMode, ThemeMode } from "../ime/prefs";
import { LegalPage, type LegalPageId } from "./legal";

export function SettingsSheet({
  layout,
  script,
  entry,
  theme,
  bias,
  dropRare,
  onLayout,
  onScript,
  onEntry,
  onTheme,
  onBias,
  onDropRare,
  onClose,
}: {
  layout: LayoutId;
  script: ScriptMode;
  entry: EntryMode;
  theme: ThemeMode;
  bias: RankBias;
  dropRare: boolean;
  onLayout: (layout: LayoutId) => void;
  onScript: (script: ScriptMode) => void;
  onEntry: (entry: EntryMode) => void;
  onTheme: (theme: ThemeMode) => void;
  onBias: (bias: RankBias) => void;
  onDropRare: (dropRare: boolean) => void;
  onClose: () => void;
}) {
  const [page, setPage] = useState<LegalPageId | null>(null);

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (page) setPage(null);
      else onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, page]);

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="關閉設定" className="absolute inset-0 bg-ink/45" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="設定"
        className="absolute top-16 right-3 left-3 flex max-h-[min(34rem,calc(100%-5.5rem))] flex-col rounded-2xl border border-line bg-sheet text-ink shadow-lg sm:left-auto sm:w-96"
      >
        <div className="min-h-0 overflow-auto p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-serif text-lg font-bold">設定</h2>
            <button type="button" onClick={onClose} className="text-sm text-muted">
              關閉
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <Field label="外觀">
              <Segment
                label="外觀"
                value={theme}
                onChange={onTheme}
                options={[
                  { id: "light", label: "淺色" },
                  { id: "dark", label: "深色" },
                ]}
              />
            </Field>
            <Field label="輸入方式">
              <div role="group" aria-label="輸入方式" className="flex w-full rounded-lg border border-line bg-paper p-0.5">
                <button
                  type="button"
                  aria-pressed={entry === "button"}
                  onClick={() => onEntry("button")}
                  className={segmentClass(entry === "button")}
                >
                  按鈕
                </button>
                <button
                  type="button"
                  aria-pressed={entry === "keyboard"}
                  onPointerDown={() => onEntry("keyboard")}
                  onClick={() => onEntry("keyboard")}
                  className={segmentClass(entry === "keyboard")}
                >
                  鍵盤
                </button>
              </div>
            </Field>
            <Field label="鍵位">
              <Segment
                label="鍵位"
                value={layout}
                onChange={onLayout}
                options={[
                  { id: "uiojkl", label: "UIOJKL" },
                  { id: "jkluio", label: "JKLUIO" },
                ]}
              />
            </Field>
            <Field label="字集">
              <Segment
                label="字集"
                value={script}
                onChange={onScript}
                options={[
                  { id: "trad", label: "繁" },
                  { id: "simp", label: "簡" },
                  { id: "all", label: "全" },
                ]}
              />
            </Field>
            <Field label="去除罕用字">
              <Segment
                label="去除罕用字"
                value={dropRare ? "on" : "off"}
                onChange={(v) => onDropRare(v === "on")}
                options={[
                  { id: "on", label: "開" },
                  { id: "off", label: "關" },
                ]}
              />
            </Field>
            <Field label="偏好">
              <Segment
                label="偏好"
                value={bias}
                onChange={onBias}
                options={[
                  { id: "stroke", label: "預設" },
                  { id: "yue", label: "粵語" },
                  { id: "guo", label: "國語" },
                ]}
              />
            </Field>
            <div className="border-t border-line pt-2">
              <SettingsLink label="免責聲明" onClick={() => setPage("disclaimer")} />
              <SettingsLink label="資料來源" onClick={() => setPage("references")} />
            </div>
          </div>
        </div>
      </div>
      {page ? <LegalPage id={page} onBack={() => setPage(null)} /> : null}
    </div>
  );
}


function SettingsLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-between text-left text-sm"
    >
      <span>{label}</span>
      <ChevronRight className="size-4 text-muted" aria-hidden="true" />
    </button>
  );
}

function segmentClass(on: boolean) {
  return on
    ? "flex-1 cursor-pointer rounded-md bg-sheet px-2.5 py-1.5 text-center text-sm font-medium text-ink shadow-sm"
    : "flex-1 cursor-pointer rounded-md px-2.5 py-1.5 text-center text-sm text-muted";
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">{label}</p>
      {children}
    </div>
  );
}

function Segment<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div role="group" aria-label={label} className="flex w-full rounded-lg border border-line bg-paper p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={segmentClass(value === o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
