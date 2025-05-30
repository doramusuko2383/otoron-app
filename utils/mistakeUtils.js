export function convertMistakesJsonToStructuredForm(mistakesRaw = {}, answers = []) {
  const structured = {
    initial_mistake: false,
    inversion_confusions: [],
    top_bottom_confusions: [],
    frequent_pairs: []
  };

  if (
    Array.isArray(answers) &&
    answers.length > 1 &&
    !answers[0].correct &&
    answers.slice(1).every(a => a.correct)
  ) {
    structured.initial_mistake = true;
  }

  const normalize = str => str.split("-").sort().join("-");
  const getTop = chord => chord.split("-").slice(-1)[0];
  const getBottom = chord => chord.split("-")[0];

  const pairCounter = {};

  Object.entries(mistakesRaw).forEach(([question, mistakes]) => {
    Object.entries(mistakes).forEach(([answer, count]) => {
      if (answer === "わからない") return;

      if (normalize(question) === normalize(answer) && question !== answer) {
        structured.inversion_confusions.push({ question, answer, count });
      }

      if (getTop(question) === getTop(answer) || getBottom(question) === getBottom(answer)) {
        structured.top_bottom_confusions.push({ question, answer, count });
      }

      const key = [question, answer].sort().join(" ⇄ ");
      pairCounter[key] = (pairCounter[key] || 0) + count;
    });
  });

  Object.entries(pairCounter).forEach(([key, count]) => {
    if (count >= 2) {
      structured.frequent_pairs.push({ pair: key.split(" ⇄ "), count });
    }
  });

  return structured;
}
