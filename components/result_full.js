// components/result_full.js

import { Flow } from "https://unpkg.com/vexflow@4.1.0/build/esm/entry/vexflow.js";

const noteLabels = {
  "C": "ド",
  "D": "レ",
  "E": "ミ",
  "F": "ファ",
  "G": "ソ",
  "A": "ラ",
  "B": "シ",
  "C#": "チス",
  "D#": "エス",
  "F#": "フィス",
  "G#": "ジス",
  "A#": "ベー",
};

export function renderTrainingFullResultScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = `<h2>単音テスト（本気） 結果</h2><div id="summary"></div><button id="back-btn">設定に戻る</button>`;

  const history = JSON.parse(sessionStorage.getItem("noteHistory") || "[]");
  const summary = {};

  const validNotes = new Set([
    "A-1","A#-1",
    "A0","A#0","B-1","B0",
    "C0","C#0","D0","D#0","E0","F0","F#0","G0","G#0",
    "A1","A#1","B1","C1","C#1","D1","D#1","E1","F1","F#1","G1","G#1",
    "A2","A#2","B2","C2","C#2","D2","D#2","E2","F2","F#2","G2","G#2",
    "A3","A#3","B3","C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3",
    "A4","A#4","B4","C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4",
    "A5","A#5","B5","C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5",
    "A6","A#6","B6","C6","C#6","D6","D#6","E6","F6","F#6","G6","G#6",
    "C7"
  ]);

  const staffDiv = document.createElement("div");
  staffDiv.innerHTML = "<h3>出題された音</h3>";
  const staffNotes = document.createElement("div");
  staffNotes.style.margin = "1em 0";
  staffNotes.style.display = "flex";
  staffNotes.style.flexWrap = "wrap";
  staffNotes.style.gap = "6px";

  const vexDiv = document.createElement("div");
  vexDiv.id = "vexflow-staff";
  vexDiv.style.margin = "2em 0";
  app.insertBefore(vexDiv, document.getElementById("summary"));

  const vexNotes = [];
  const VF = Flow;

  function convertForStaff(note) {
    const m = note.match(/^([A-G]#?)(-?\d)$/);
    if (!m) return { key: "c/4", shift: 0, accidental: null };
    let [_, base, octaveStr] = m;
    let octave = parseInt(octaveStr, 10);
    const accidental = base.includes("#") ? "#" : null;
    const pitch = base.replace("#", "");

    const noteToValue = { C:0,D:2,E:4,F:5,G:7,A:9,B:11 };
    let midi = (octave + 1) * 12 + noteToValue[pitch] + (accidental ? 1 : 0);
    let shift = 0;
    while (midi > 84) { midi -= 12; octave--; shift++; }
    while (midi < 60) { midi += 12; octave++; shift--; }
    const key = `${pitch.toLowerCase()}${accidental ? "#" : ""}/${octave}`;
    return { key, accidental, shift };
  }

  history.forEach(entry => {
    if (!validNotes.has(entry.question)) return;

    const shortNote = entry.question.replace(/[0-9-]/g, "");
    const label = noteLabels[shortNote] || shortNote;

    const noteSpan = document.createElement("span");
    noteSpan.textContent = `🎵 ${label}`;
    noteSpan.style.padding = "4px";
    noteSpan.style.background = entry.correct ? "#c8facc" : "#ffe0e0";
    noteSpan.style.border = "1px solid #ccc";
    noteSpan.style.borderRadius = "4px";
    staffNotes.appendChild(noteSpan);

    if (!summary[shortNote]) summary[shortNote] = { correct: 0, total: 0 };
    summary[shortNote].total++;
    if (entry.correct) summary[shortNote].correct++;

    const conv = convertForStaff(entry.question);
    const vNote = new VF.StaveNote({ clef: "treble", keys: [conv.key], duration: "q" })
      .setStyle({ fillStyle: entry.correct ? "black" : "red", strokeStyle: entry.correct ? "black" : "red" });
    if (conv.accidental) vNote.addAccidental(0, new VF.Accidental(conv.accidental));
    if (conv.shift > 0) {
      vNote.addModifier(0, new VF.Annotation("8va").setVerticalJustification(VF.Annotation.VerticalJustify.TOP));
    } else if (conv.shift < 0) {
      vNote.addModifier(0, new VF.Annotation("8vb").setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM));
    }
    vNote.addModifier(0, new VF.Annotation(entry.correct ? "◯" : "×").setVerticalJustification(VF.Annotation.VerticalJustify.ABOVE));
    vexNotes.push(vNote);
  });

  staffDiv.appendChild(staffNotes);
  app.insertBefore(staffDiv, document.getElementById("summary"));

  const summaryDiv = document.getElementById("summary");
  const table = document.createElement("table");
  table.innerHTML = `<tr><th>音</th><th>正解数</th><th>出題数</th><th>正答率</th></tr>`;

  Object.keys(summary).sort().forEach(note => {
    const data = summary[note];
    const accuracy = ((data.correct / data.total) * 100).toFixed(1);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${noteLabels[note] || note}</td>
      <td>${data.correct}</td>
      <td>${data.total}</td>
      <td>${accuracy}%</td>
    `;
    table.appendChild(row);
  });

  summaryDiv.appendChild(table);

  if (VF && vexNotes.length > 0) {
    const renderer = new VF.Renderer("vexflow-staff", VF.Renderer.Backends.SVG);
    renderer.resize(800, 180);
    const context = renderer.getContext();
    const stave = new VF.Stave(10, 40, 780);
    stave.addClef("treble").setContext(context).draw();
    VF.Formatter.FormatAndDraw(context, stave, vexNotes);
  }

  document.getElementById("back-btn").onclick = () => {
    location.reload();
  };
}
