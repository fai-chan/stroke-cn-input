# 第三方資料

本倉庫的程式（`src/`、建置設定）以 [MIT License](LICENSE) 授權。`public/dict/` 的字庫不是這個授權，權利仍屬各來源方。轉載字庫時請連同 [public/dict/LICENSE.txt](public/dict/LICENSE.txt) 一併附上。

| 檔案 | 來源 | 授權 |
|---|---|---|
| `strokes.txt` | [Conway Stroke Data](https://github.com/stroke-input/stroke-input-data)，Conway，2021–2026 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `rank-t.txt`、`rank-s.txt`、`phrases-t.txt`、`phrases-s.txt`、`only-t.txt`、`only-s.txt` | 同上 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `assoc-t.txt`、`assoc-s.txt` | 由下方兩個詞頻算出的衍生表，不是原詞庫 | 見下 |

`assoc-*.txt` 的詞頻：

- 書面詞頻取自 [萬象詞庫](https://github.com/amzxyz/rime-wanxiang-data) 的基礎詞庫，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。只用詞庫資料，沒有包含該專案的程式。
- 粵語詞頻取自 [粵典細數據](https://words.hk/faiman/analysis/existingwordcount/) 的「語料庫×詞表使用頻率」，公有領域。Credits to words.hk。只用詞頻，沒有採用詞典釋義或例句。

同一個詞若兩邊都有次數，取較高的一邊。詞表有、詞頻沒有的詞仍保留，並排在後面。同一個後續字只留最強的一個詞。

筆順依 Conway 對舊式手機五類筆劃的整理，不是香港教育局、臺灣教育部或中國大陸的筆順規範。
