import assert from "node:assert/strict";
import { test } from "node:test";
import { lettersOf, textForCopy } from "./coding.ts";

const letters = lettersOf("uiojkl");

test("copy drops stroke letters still being composed", () => {
  assert.equal(textForCopy("你好ui", 4, letters, false), "你好");
  assert.equal(textForCopy("十uio", 4, letters, false), "十");
  assert.equal(textForCopy("你好", 2, letters, false), "你好");
});

test("copy drops a keyboard punctuation b and the strokes before it", () => {
  assert.equal(textForCopy("你好uib", 6, letters, true), "你好");
  assert.equal(textForCopy("你好b", 4, letters, true), "你好");
  assert.equal(textForCopy("你好b", 4, letters, false), "你好b");
});
