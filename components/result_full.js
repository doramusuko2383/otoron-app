// components/result_full.js
// Uses global VexFlow loaded in index.html

import { switchScreen } from "../main.js";

export function renderTrainingFullResultScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>単音テスト（全88鍵）結果</h2>
    <div class="score-wrapper">
      <img id="score-image" class="score-image" alt="絶対音感トレーニングアプリ『オトロン』単音テスト結果の画像" />
    </div>
    <div id="score-modal" class="modal hidden">
      <img id="full-score-image" alt="絶対音感トレーニングアプリ『オトロン』単音テスト全スコアの画像" />
    </div>
    <div id="summary"></div>
    <button id="back-btn">設定に戻る</button>`;

  const history = JSON.parse(sessionStorage.getItem("noteHistory") || "[]");
  const summary = {};

  const resultNotes = history.map(entry => entry.noteQuestion);
  console.log('resultNotes', resultNotes);

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


  const vexDiv = document.createElement("div");
  vexDiv.id = "vexflow-staff";
  vexDiv.style.margin = "2em 0";
  app.insertBefore(vexDiv, document.getElementById("summary"));

  // VexFlow が読み込まれていない環境も考慮する
  const VF = (typeof Vex !== "undefined" && Vex.Flow) ? Vex.Flow : null; // use global VexFlow 3.x loaded in index.html

  function convertForStaff(note) {
    if (!note || typeof note !== 'string') {
      console.warn('convertForStaff: invalid note', note);
      return { clef: "treble", key: "c/4", shift: 0, accidental: null };
    }
    const m = note.match(/^([A-G]#?)(-?\d)$/);
    if (!m) return { clef: "treble", key: "c/4", shift: 0, accidental: null };
    let [_, base, octaveStr] = m;
    let octave = parseInt(octaveStr, 10);
    const accidental = base.includes("#") ? "#" : null;
    const pitch = base.replace("#", "");

    const noteToValue = { C:0,D:2,E:4,F:5,G:7,A:9,B:11 };
    const midi = (octave + 1) * 12 + noteToValue[pitch] + (accidental ? 1 : 0);
    const clef = midi < 60 ? "bass" : "treble";

    let shift = 0;
    if (midi <= 28) {
      shift = -2; // A0-E1 -> 16vb
    } else if (midi <= 47) {
      shift = -1; // F1-B2 -> 8vb
    } else if (midi >= 96) {
      shift = 2; // C7-C8 -> 16va
    } else if (midi >= 84) {
      shift = 1; // C6-B6 -> 8va
    }

    const displayOctave = octave - shift;
    const key = `${pitch.toLowerCase()}${accidental ? "#" : ""}/${displayOctave}`;

    return { key, accidental, shift, clef };
  }

  const entries = history.slice(0, 30).filter(e => validNotes.has(e.noteQuestion));
  const measures = Array.from({ length: Math.max(1, Math.ceil(entries.length / 5)) }, () => ({ treble: [], bass: [] }));

  entries.forEach((entry, idx) => {
    console.log('processing:', entry.noteQuestion);

    if (!summary[entry.noteQuestion]) summary[entry.noteQuestion] = { correct: 0, total: 0 };
    summary[entry.noteQuestion].total++;
    if (entry.correct) summary[entry.noteQuestion].correct++;

    if (VF) {
      const conv = convertForStaff(entry.noteQuestion);
      const vNote = new VF.StaveNote({ clef: conv.clef, keys: [conv.key], duration: "q" });
      if (typeof vNote.setStyle === "function") {
        vNote.setStyle({
          fillStyle: entry.correct ? "black" : "red",
          strokeStyle: entry.correct ? "black" : "red",
        });
      }
      if (conv.accidental && typeof vNote.addAccidental === "function") {
        vNote.addAccidental(0, new VF.Accidental(conv.accidental));
      }
      if (typeof vNote.addModifier === "function") {
        if (conv.shift > 1) {
          vNote.addModifier(
            0,
            new VF.Annotation("16va").setVerticalJustification(VF.Annotation.VerticalJustify.TOP)
          );
        } else if (conv.shift === 1) {
          vNote.addModifier(
            0,
            new VF.Annotation("8va").setVerticalJustification(VF.Annotation.VerticalJustify.TOP)
          );
        } else if (conv.shift === -1) {
          vNote.addModifier(
            0,
            new VF.Annotation("8vb").setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM)
          );
        } else if (conv.shift <= -2) {
          vNote.addModifier(
            0,
            new VF.Annotation("16vb").setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM)
          );
        }
        vNote.addModifier(
          0,
          new VF.Annotation(entry.correct ? "◯" : "").setVerticalJustification(VF.Annotation.VerticalJustify.ABOVE)
        );
      }

      const measureIndex = Math.floor(idx / 5);
      const ghost = new VF.GhostNote("q");
      if (conv.clef === "treble") {
        measures[measureIndex].treble.push(vNote);
        measures[measureIndex].bass.push(ghost);
      } else {
        measures[measureIndex].treble.push(ghost);
        measures[measureIndex].bass.push(vNote);
      }
    }
  });



  const summaryDiv = document.getElementById("summary");
  const totalQuestions = entries.length;
  const correctCount = entries.filter(e => e.correct).length;
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

  if (VF) {
    const measureWidth = 200;
    const lineHeight = 180;
    const measuresPerLine = 3;
    const numLines = Math.ceil(measures.length / measuresPerLine);
    const renderer = new VF.Renderer("vexflow-staff", VF.Renderer.Backends.SVG);
    const width = Math.min(measures.length, measuresPerLine) * measureWidth + 40;
    renderer.resize(width, lineHeight * numLines + 40);
    const context = renderer.getContext();
    if (context.svg && context.svg.style) context.svg.style.background = "#ffffff";

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
    const imgElem = document.getElementById("score-image");
    imgElem.src = base64;
    document.getElementById("full-score-image").src = base64;
    vexDiv.innerHTML = "";

    imgElem.addEventListener("click", () => {
      document.getElementById("score-modal").classList.remove("hidden");
    });
    document.getElementById("score-modal").addEventListener("click", () => {
      document.getElementById("score-modal").classList.add("hidden");
    });
  }

  document.getElementById("back-btn").onclick = () => {
    switchScreen("settings", user);
  };
}
