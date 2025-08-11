import { chords } from "../data/chords.js";
import { supabase } from "../utils/supabaseClient.js";
import { applyStartChordIndex } from "../utils/progressUtils.js";
import { showCustomAlert } from "./home.js";

export function renderInitialSetupScreen(user, onComplete) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "setup-wrapper";
  app.appendChild(wrapper);

  let nickname = "";

  function step1() {
    wrapper.innerHTML = `
      <h2>おなまえをおしえてね</h2>
      <input type="text" id="nickname" placeholder="にっくねーむ" />
      <button id="next-btn">つぎへ</button>
    `;
    wrapper.querySelector("#next-btn").onclick = () => {
      const value = wrapper.querySelector("#nickname").value.trim();
      if (!value) {
        showCustomAlert("おなまえをいれてね");
        return;
      }
      nickname = value;
      step2();
    };
  }

  function step2() {
    wrapper.innerHTML = `
      <h2>れんしゅう けいけんは ある？</h2>
      <p class="setup-note">はじめてのお子さんは赤からスタートしてください。<br>※間違えても「よくある質問」から選び直せます</p>
      <select id="start-chord"></select>
      <button id="start-btn">はじめる</button>
    `;
    const select = wrapper.querySelector("#start-chord");
    chords.forEach((ch, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = ch.label;
      select.appendChild(opt);
    });
    wrapper.querySelector("#start-btn").onclick = async () => {
      const idx = parseInt(select.value, 10);
      await supabase
        .from("users")
        .update({ name: nickname })
        .eq("id", user.id);
      await applyStartChordIndex(user.id, idx);
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      onComplete(data || user);
    };
  }

  step1();
}
