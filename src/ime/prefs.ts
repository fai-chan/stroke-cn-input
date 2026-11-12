import type { LayoutId, ScriptMode } from "./coding";
import type { RankBias } from "./engine";

export type EntryMode = "button" | "keyboard";
export type ThemeMode = "light" | "dark";

export type Prefs = {
  layout: LayoutId;
  script: ScriptMode;
  entry: EntryMode;
  theme: ThemeMode;
  bias: RankBias;
  dropRare: boolean;
};

export const STORE = "stroke-cn.v1";

export const DEFAULTS: Prefs = {
  layout: "uiojkl",
  script: "trad",
  entry: "button",
  theme: "light",
  bias: "stroke",
  dropRare: true,
};

export function isLayout(v: unknown): v is LayoutId {
  return v === "jkluio" || v === "uiojkl";
}
export function isScript(v: unknown): v is ScriptMode {
  return v === "trad" || v === "simp" || v === "all";
}
export function isEntry(v: unknown): v is EntryMode {
  return v === "button" || v === "keyboard";
}
export function isTheme(v: unknown): v is ThemeMode {
  return v === "light" || v === "dark";
}
export function isBias(v: unknown): v is RankBias {
  return v === "stroke" || v === "yue" || v === "guo";
}
export function isBool(v: unknown): v is boolean {
  return v === true || v === false;
}
