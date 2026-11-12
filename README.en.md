# Stroke Chinese Input

[中文](README.md) · **[Open the app](https://stroke-cn-input.grok.me/)**

Type Chinese in the browser from five stroke classes. The keys `U I O J K L` stand for those strokes. After you pick a character, the letters are replaced by the character. The text stays on this page.

The program is MIT. The dictionary license is in [NOTICE.md](NOTICE.md).

## What it is

Open the page and type Chinese by stroke order.

The strokes are horizontal, vertical, left-falling, dot, and turning. A rising stroke counts as horizontal, a vertical hook as vertical, a right-falling stroke as a dot, and every other turn as turning. Enter the strokes in order, then pick a character.

The page is static. The dictionary is downloaded into the browser. Lookup, next-character suggestions, and the script filter all run on the device. Settings stay on the device.

Stroke order comes from [Conway Stroke Data](https://github.com/stroke-input/stroke-input-data), about 28,000 characters.

## Who it is for

- You recognize the character, but the reading is uncertain, or you would rather not start from the reading.
- You are on someone else's computer, a shared machine, or a machine without your usual input method.
- You can write the character and have not learned a shape-based code.
- You only need a few characters, then a copy.
- You want traditional, simplified, or colloquial Cantonese characters, and you want to choose what is shown.

## How stroke input behaves

- The code is the stroke order, so you need to know how the character is written.
- Input is one character at a time. After a choice, the page lists a next character. There is no whole-sentence conversion.
- Many characters share the first few strokes, so the candidates stay in view while you type.

## Features

- **Five stroke classes, and one wildcard.** `L` matches any stroke in that place.
- **Keyboard or buttons.** Type the letters, or tap the strokes on screen.
- **The key order can change.** The default is `UIOJKL`. It can be `JKLUIO`.
- **Picks start at `9`.** The first candidate is `9`, then `8` down to `1`. `9` sits next to the stroke keys, so the usual choice does not reach across to `1`. Punctuation and the next-character row use the same order.
- **One hand can do the typing.** The stroke keys and `9` are on the right hand. Button mode can be used with one hand as well.
- **The script can change.** Traditional, simplified, or both. Characters already in the draft stay as typed.
- **Preference can change.** A set of colloquial Cantonese characters can move forward or back. Characters outside the frequency lists can be hidden.
- **Next character.** After a choice, the page lists a following character. The list closes when the next stroke starts, or when punctuation is chosen.
- **The layout follows the typing.** Candidates sit above the draft, and the strokes sit with the input.

## How to type

| Key (default `UIOJKL`) | Stroke |
|---|---|
| `U` | Horizontal |
| `I` | Vertical |
| `O` | Left-falling |
| `J` | Dot |
| `K` | Turning |
| `L` | Wildcard (any stroke) |

Other keys:

| Key | Action |
|---|---|
| `9`–`1` | Pick a character on the current page |
| `B` | Punctuation |
| Space | Space |
| `←` `→` | Change page |
| Backspace | Delete |
| `Esc` | Clear the current strokes |

Button mode taps the strokes and changes page with a sideways swipe. On a touch screen, a candidate can also be tapped.

### Try these

| Character | Strokes | Keys |
|---|---|---|
| 十 | 一 丨 | `U I` |
| 人 | 丿 丶 | `O J` |
| 口 | 丨 フ 一 | `I K U` |
| 木 | 一 丨 丿 丶 | `U I O J` |

### A few notes

- **Unsure of one stroke: use `L`.** If the fourth stroke of 木 is forgotten, type `U I O L`.
- **If nothing appears, type the first two or three strokes.** The list narrows with each stroke.
- **After a choice, look at the next-character row.** The following character can be picked directly.

## Settings

- **Script:** traditional, simplified, or both.
- **Hide rare characters:** hides characters outside the frequency lists. With Cantonese preference, that colloquial set still appears.
- **Preference:** Default ranks candidates by Conway's character frequency. Next-character suggestions use a frequency table prepared ahead of time. Cantonese moves the colloquial set forward. Mandarin moves it back.
- **Input:** keyboard or buttons. Key order `UIOJKL` or `JKLUIO`.

Settings are stored in `localStorage` under `stroke-cn.v1`. Clearing the site data returns the defaults.

## Privacy

What you type, what you pick, and the draft are handled in the browser. The dictionary and the program are downloaded as static files. Settings stay in `localStorage` on the device.

The page requests Noto Sans TC and Noto Serif TC from Google Fonts. That request includes the IP address and the browser type. It does not include the text you type.

For offline use, run `npm run build` and put `dist/` on the machine or on any static host. The typeface then falls back to a system font.

## Limits

- **The stroke order has to match the dictionary.** `L` covers one uncertain stroke.
- **Input is one character at a time.** A long passage takes more keystrokes.
- **The candidate list can be long.** Characters that share the first strokes need another page.
- **Typing happens on this page.** Copy the result into the program where you need it.
- **The script setting only filters candidates.** Characters already in the draft are not rewritten into the other script.
- **The dictionary can lack a character, and a stored stroke order can differ from the one you remember.** Ranking is statistical.
- **Settings change the results.** Hiding rare characters, or showing only one script, leaves some characters out.

## Develop

Node.js 22 or newer.

```bash
npm install
npm test
npm run dev
```

`npm run dev` opens a local page. `npm run build` typechecks and writes static files to `dist/`. The dictionary in `public/dict/` is copied as it is.

```
src/ime/      Stroke mapping, lookup, and next-character suggestions. Tested on its own.
src/ui/       Interface. App holds the draft. The rest is settings, help, and candidates.
public/dict/  Dictionary. See NOTICE.md for its license.
```

## Questions

**Can I type without knowing the stroke order?**
Partly. Use `L` for an uncertain stroke, or type the first few strokes and pick from the list.

**A character does not appear.**
Check three things: whether the stroke order matches the dictionary, whether rare characters are hidden, and whether the script is limited to traditional or simplified.

**Does it work on a phone?**
Yes. Button mode taps the strokes, and a sideways swipe changes page.

**Can I host it myself?**
Yes. After `npm run build`, `dist/` is the whole static site, dictionary included.

## License

The program is [MIT](LICENSE). The dictionary license is in [NOTICE.md](NOTICE.md). Stroke order from [Conway Stroke Data](https://github.com/stroke-input/stroke-input-data) is CC BY 4.0. The frequency lists and the phrase lists are in the public domain. Keep `LICENSE.txt` inside `public/dict/` when you redistribute that directory.
