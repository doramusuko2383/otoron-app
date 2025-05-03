import { renderHomeScreen } from "./components/home.js";
import { renderTrainingScreen } from "./components/training.js";
import { renderSettingsScreen } from "./components/settings.js";
import { renderSummaryScreen } from "./components/summary.js";
import { renderGrowthScreen } from "./logic/growth.js";

export const switchScreen = (screen) => {
  const app = document.getElementById("app");
  app.innerHTML = "";

  if (screen === "home") renderHomeScreen();
  else if (screen === "training") renderTrainingScreen();
  else if (screen === "settings") renderSettingsScreen();
  else if (screen === "summary") renderSummaryScreen();
  else if (screen === "growth") renderGrowthScreen();
};

// 初期表示
window.addEventListener("DOMContentLoaded", () => {
  switchScreen("home");
});
