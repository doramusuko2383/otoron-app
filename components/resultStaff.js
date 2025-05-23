const VF = Vex.Flow;

export function drawStaffFromNotes(notes, containerId) {
  const div = document.getElementById(containerId);
  div.innerHTML = "";

  const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
  renderer.resize(300, 120);
  const context = renderer.getContext();
  context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");

  const stave = new VF.Stave(10, 40, 280);
  stave.addClef("treble").setContext(context).draw();

  const staveNotes = notes.map(note => new VF.StaveNote({ clef: "treble", keys: [note], duration: "q" }));
  VF.Formatter.FormatAndDraw(context, stave, staveNotes);
}
