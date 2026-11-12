import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

export type LegalPageId = "disclaimer" | "references";

export function LegalPage({ id, onBack }: { id: LegalPageId; onBack: () => void }) {
  const title = id === "disclaimer" ? "免責聲明" : "資料來源";
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-paper text-ink">
      <header className="flex shrink-0 items-center gap-1 border-b border-line bg-sheet px-2 py-2">
        <button type="button" onClick={onBack} className="inline-flex h-11 items-center gap-1 px-2 text-sm">
          <ChevronLeft className="size-4" aria-hidden="true" />
          設定
        </button>
        <h2 className="font-serif text-lg font-bold">{title}</h2>
      </header>
      <article className="min-h-0 flex-1 overflow-auto px-5 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 text-sm leading-7">
          {id === "disclaimer" ? <DisclaimerCopy /> : <ReferencesCopy />}
        </div>
      </article>
    </div>
  );
}

function DisclaimerCopy() {
  return (
    <>
      <p>本頁只說明這個工具實際做什麼、不做什麼。它不是使用條款，也不構成法律意見。</p>
      <p>
        線上筆劃中文輸入是瀏覽器裡的筆劃選字工具。文稿只留在這一頁，重新載入就會消失。設定存在這部裝置的瀏覽器。除了你自己按「複製」，文稿不會被送出。
      </p>
      <p>
        筆劃分成五類：橫（含提）、豎（含豎鉤）、撇、點（含捺）、折。次序來自 Conway Stroke Data，依編者對舊式手機筆劃輸入的記憶整理，字形從寬，而且註明可能有人手錯誤。它不是香港教育局、臺灣教育部或中國大陸的筆順規範，學校教的筆順可能不同。
      </p>
      <p>
        同一個筆劃序列通常有多個字，排第一的不一定是你要的字。候選依字頻排列。「繁／簡／全」只決定顯示哪一套字，不會把已經選入文稿的字轉成另一套字形。「去除罕用字」隱藏字頻表以外的字；偏好選「粵語」時，一組口語用字仍會留下。「粵語」和「國語」只把這組口語用字整組提前或押後，不會把詞庫換成粵語或國語。
      </p>
      <p>
        聯想是下一個字，不是詞義。它只看詞表裡前後相鄰的兩個字，用萬象基礎詞庫的書面詞頻和粵典細數據的粵語詞頻來排，同一個後續字只留較強的一個詞。詞表沒有的組合不會出現，出現了也不表示語意上最合適。
      </p>
      <p>本工具不是詞典，不提供讀音、釋義或規範字形，也不能代替校對。正式文件請自行核對。</p>
      <p>本工具與 Conway、萬象詞庫、粵典，以及任何輸入法或作業系統，都沒有從屬或背書關係。資料的授權見「資料來源」。</p>
    </>
  );
}

function ReferencesCopy() {
  return (
    <>
      <section className="flex flex-col gap-2">
        <h3 className="font-medium">筆劃、詞表與字頻排序</h3>
        <p>
          <Ext href="https://github.com/stroke-input/stroke-input-data">Conway Stroke Data</Ext>
          ，Conway，2021–2026。筆順為
          <Ext href="https://creativecommons.org/licenses/by/4.0/"> CC BY 4.0</Ext>
          。字頻排序、詞表與單字表為
          <Ext href="https://creativecommons.org/publicdomain/zero/1.0/"> CC0 1.0</Ext>
          ，公有領域。
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="font-medium">聯想詞頻</h3>
        <p>
          書面詞頻取自
          <Ext href="https://github.com/amzxyz/rime-wanxiang-data"> 萬象詞庫</Ext>
          的基礎詞庫，
          <Ext href="https://creativecommons.org/licenses/by/4.0/"> CC BY 4.0</Ext>
          。只用詞庫資料，沒有包含該專案的程式。
        </p>
        <p>
          粵語詞頻取自
          <Ext href="https://words.hk/faiman/analysis/existingwordcount/"> 粵典細數據</Ext>
          的「語料庫×詞表使用頻率」，公有領域。Credits to words.hk。只用詞頻，沒有採用詞典釋義或例句。
        </p>
        <p>同一個詞若兩邊都有次數，取較高的一邊。詞頻沒有收錄、但本工具詞表有的詞仍會保留，並排在後面。同一個後續字只留最強的一個詞。</p>
      </section>
    </>
  );
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="text-cinnabar underline" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}
