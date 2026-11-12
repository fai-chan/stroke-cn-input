import assert from "node:assert/strict";
import { test } from "node:test";
import { associations, buildDict, loadAssoc, search, type DictTexts } from "./engine.ts";

const texts: DictTexts = {
  strokes: "5\t係是\n12\t十\n",
  phrasesT: "你好\n你們\n十字\n十字架\n好人\n",
  phrasesS: "你好\n",
  rankT: "係是十好們字人",
  rankS: "是十好",
  onlyT: "",
  onlyS: "",
};

test("筆順排序 keeps the existing frequency order", () => {
  const hits = search(buildDict(texts), "5", "trad", "stroke").map((c) => c.text);
  assert.deepEqual(hits, ["係", "是"]);
});

test("粵語優先 lifts the colloquial group ahead of an earlier non-group character", () => {
  const custom: DictTexts = { ...texts, rankT: "是係十好們字人" };
  const hits = search(buildDict(custom), "5", "trad", "yue").map((c) => c.text);
  assert.deepEqual(hits, ["係", "是"]);
});

test("國語優先 sinks the colloquial group", () => {
  const hits = search(buildDict(texts), "5", "trad", "guo").map((c) => c.text);
  assert.deepEqual(hits, ["是", "係"]);
});

test("去除罕用字 hides unlisted characters unless 粵語優先", () => {
  const custom: DictTexts = {
    strokes: "3\t丮\n1\t一\n12\t十𡿨㸾乄䖸冃\n5\t瞓係\n",
    phrasesT: "十一\n十丮\n",
    phrasesS: "",
    rankT: "一十係",
    rankS: "一十",
    onlyT: "",
    onlyS: "",
  };
  const dict = buildDict(custom);
  const on = search(dict, "12", "all", "stroke", true).map((c) => c.text);
  const off = search(dict, "12", "all", "stroke", false).map((c) => c.text);
  assert.deepEqual(on, ["十"]);
  assert.ok(off.includes("𡿨") && off.includes("乄") && off.includes("㸾") && off.includes("䖸"));
  assert.deepEqual(search(dict, "3", "all", "stroke", true).map((c) => c.text), []);
  assert.deepEqual(search(dict, "3", "all", "stroke", false).map((c) => c.text), ["丮"]);
  assert.deepEqual(search(dict, "5", "trad", "stroke", true).map((c) => c.text), ["係"]);
  const yue = search(dict, "5", "trad", "yue", true).map((c) => c.text);
  assert.deepEqual(yue.filter((ch) => ch === "係" || ch === "瞓").sort(), ["係", "瞓"]);
  assert.deepEqual(associations(dict, "十", "trad", true), ["一"]);
  assert.deepEqual(associations(dict, "十", "trad", false), ["一", "丮"]);
});

test("預先算好的聯想表蓋過詞條計數，空表則沿用原算法", () => {
  const dict = buildDict({ ...texts, assocT: "十\t分年二" });
  assert.deepEqual(associations(dict, "十", "trad"), ["分", "年", "二"]);
  assert.deepEqual(associations(dict, "你", "trad"), []);
  const fallback = buildDict({ ...texts, assocT: "   \n" });
  assert.equal(associations(fallback, "十", "trad")[0], "字");
  assert.deepEqual(loadAssoc("十\t分年二\n\n壞行"), new Map([["十", ["分", "年", "二"]]]));
});

test("頻率表裡的罕用字仍會被字集過濾", () => {
  const dict = buildDict({
    strokes: "1\t十丮分",
    phrasesT: "十字\n",
    phrasesS: "十分\n",
    rankT: "十分",
    rankS: "十分",
    onlyT: "",
    onlyS: "",
    assocT: "十\t分丮年",
    assocS: "十\t分",
  });
  assert.deepEqual(associations(dict, "十", "trad", true), ["分", "年"]);
  assert.deepEqual(associations(dict, "十", "trad", false), ["分", "丮", "年"]);
  assert.deepEqual(associations(dict, "十", "simp", true), ["分"]);
  assert.deepEqual(associations(dict, "十", "all", true), ["分", "年"]);
});

test("偏好會改聯想次序：粵語提前口語字，國語押後", () => {
  const dict = buildDict({ ...texts, assocT: "我\t們哋自" });
  assert.deepEqual(associations(dict, "我", "trad", false, "stroke"), ["們", "哋", "自"]);
  assert.deepEqual(associations(dict, "我", "trad", false, "yue"), ["哋", "們", "自"]);
  assert.deepEqual(associations(dict, "我", "trad", false, "guo"), ["們", "自", "哋"]);
});

test("聯想字 follows the most common next character and can chain", () => {
  const dict = buildDict(texts);
  assert.equal(associations(dict, "十", "trad")[0], "字");
  assert.deepEqual(associations(dict, "你", "trad"), ["好", "們"]);
  assert.deepEqual(associations(dict, "好", "trad"), ["人"]);
  assert.deepEqual(associations(dict, "你", "simp"), ["好"]);
});
