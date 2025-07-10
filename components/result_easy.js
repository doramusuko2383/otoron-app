// components/result_easy.js
// Uses global VexFlow loaded in index.html

import { switchScreen } from "../main.js";

export function renderTrainingEasyResultScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>単音テスト（3オクターブ）結果</h2>
    <div class="score-wrapper">
      <img id="score-image" class="score-image" alt="絶対音感トレーニングアプリ『オトロン』単音テスト結果の画像" />
    </div>
    <div id="score-modal" class="modal hidden">
      <img id="full-score-image" alt="絶対音感トレーニングアプリ『オトロン』単音テスト全スコアの画像" />
    </div>
    <div id="summary"></div>
    <button id="back-btn">設定に戻る</button>`;

  const history = JSON.parse(sessionStorage.getItem("noteHistory") || "[]");

  const vexDiv = document.createElement("div");
  vexDiv.id = "vexflow-staff";
  vexDiv.style.margin = "2em 0";
  app.insertBefore(vexDiv, document.querySelector(".score-wrapper"));

  const VF = (typeof Vex !== "undefined" && Vex.Flow) ? Vex.Flow : null;

  const summary = {};
  history.forEach(entry => {
    if (!summary[entry.question]) summary[entry.question] = { correct: 0, total: 0 };
    summary[entry.question].total++;
    if (entry.correct) summary[entry.question].correct++;
  });

  function convertForStaff(note) {
    const m = note.match(/^([A-G]#?)(\d)$/);
    if (!m) return { clef: "treble", key: "c/4", accidental: null };
    const [_, base, octave] = m;
    const accidental = base.includes("#") ? "#" : null;
    const pitch = base.replace("#", "");
    const midi = (parseInt(octave) + 1) * 12 + {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[pitch] + (accidental?1:0);
    const clef = midi < 60 ? "bass" : "treble";
    const key = `${pitch.toLowerCase()}${accidental?"#" : ""}/${octave}`;
    return { key, accidental, clef };
  }

  if (VF) {
    const measures = Array.from({ length: Math.ceil(history.length / 3) }, () => ({ treble: [], bass: [] }));

    history.forEach((entry, idx) => {
      const conv = convertForStaff(entry.question);
      const vNote = new VF.StaveNote({ clef: conv.clef, keys: [conv.key], duration: "q" });
      if (conv.accidental) vNote.addAccidental(0, new VF.Accidental(conv.accidental));
      if (!entry.correct) {
        vNote.setStyle({ fillStyle: "red", strokeStyle: "red" });
      }
      const ghost = new VF.GhostNote("q");
      const mIdx = Math.floor(idx / 3);
      if (conv.clef === "treble") {
        measures[mIdx].treble.push(vNote);
        measures[mIdx].bass.push(ghost);
      } else {
        measures[mIdx].treble.push(ghost);
        measures[mIdx].bass.push(vNote);
      }
    });

    const measureWidth = 180;
    const lineHeight = 180;
    const measuresPerLine = 4;
    const renderer = new VF.Renderer("vexflow-staff", VF.Renderer.Backends.SVG);
    const numLines = Math.ceil(measures.length / measuresPerLine);
    const width = Math.min(measures.length, measuresPerLine) * measureWidth + 40;
    renderer.resize(width, lineHeight * numLines + 40);
    const context = renderer.getContext();

    for (let line = 0; line < numLines; line++) {
      for (let m = 0; m < measuresPerLine; m++) {
        const idx = line * measuresPerLine + m;
        if (idx >= measures.length) break;
        const x = 20 + m * measureWidth;
        const y = 20 + line * lineHeight;

        const treble = new VF.Stave(x, y, measureWidth);
        if (m === 0) treble.addClef("treble");
        if (idx === measures.length - 1) treble.setEndBarType(VF.Barline.type.END);
        treble.setContext(context).draw();

        const bass = new VF.Stave(x, y + 80, measureWidth);
        if (m === 0) bass.addClef("bass");
        if (idx === measures.length - 1) bass.setEndBarType(VF.Barline.type.END);
        bass.setContext(context).draw();

        if (m === 0) {
          new VF.StaveConnector(treble, bass)
            .setType(VF.StaveConnector.type.BRACE)
            .setContext(context)
            .draw();
        }
        new VF.StaveConnector(treble, bass)
          .setType(VF.StaveConnector.type.SINGLE)
          .setContext(context)
          .draw();

        const voiceTreble = new VF.Voice({ num_beats: measures[idx].treble.length, beat_value: 4 }).setStrict(false);
        voiceTreble.addTickables(measures[idx].treble);
        const voiceBass = new VF.Voice({ num_beats: measures[idx].bass.length, beat_value: 4 }).setStrict(false);
        voiceBass.addTickables(measures[idx].bass);

        new VF.Formatter().joinVoices([voiceTreble, voiceBass]).format([voiceTreble, voiceBass], measureWidth - 20);
        voiceTreble.draw(context, treble);
        voiceBass.draw(context, bass);
      }
    }

    const svg = vexDiv.querySelector("svg");
    const data = new XMLSerializer().serializeToString(svg);
    const base64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
    document.getElementById("score-image").src = base64;
    document.getElementById("full-score-image").src = base64;
    vexDiv.innerHTML = "";

    document.getElementById("score-image").addEventListener("click", () => {
      document.getElementById("score-modal").classList.remove("hidden");
    });

    document.getElementById("score-modal").addEventListener("click", () => {
      document.getElementById("score-modal").classList.add("hidden");
    });
  }

  const summaryDiv = document.getElementById("summary");
  const totalQuestions = history.length;
  const correctCount = history.filter(e => e.correct).length;
  const overallAccuracy = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const summaryText = document.createElement("p");
  summaryText.textContent = `正解率 ${overallAccuracy}％（${correctCount}/${totalQuestions}）`;
  summaryDiv.appendChild(summaryText);
  const table = document.createElement("table");
  table.innerHTML = `<tr><th>音</th><th>正解数</th><th>出題数</th><th>正答率</th></tr>`;

  Object.keys(summary).sort().forEach(note => {
    const data = summary[note];
    const accuracy = ((data.correct / data.total) * 100).toFixed(1);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${note}</td>
      <td>${data.correct}</td>
      <td>${data.total}</td>
      <td>${accuracy}%</td>
    `;
    table.appendChild(row);
  });

  summaryDiv.appendChild(table);

  document.getElementById("back-btn").onclick = () => {
    switchScreen("settings", user);
  };
}
