import { renderHeader } from "../header.js";
import { switchScreen } from "../../main.js";

export function renderFaqScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app, user);

  const faqs = [
    {
      id: "q1",
      question: "初めて使います。どうやって始めればいいですか？",
      answer:
        "最初に『和音を選んでスタート』します。その後は出題に答えていくだけで練習が進みます。",
      button: {
        id: "guide-link",
        label: "▶️ 必ずお読みください",
        action: () => switchScreen("help"),
      },
    },
    {
      id: "q2",
      question: "和音の選択を間違えてしまいました。最初からやり直せますか？",
      answer: "はい、できます。以下のボタンから和音を選び直すことができます。",
      button: {
        id: "reselect-btn",
        label: "和音の選び直しボタン",
        action: () => switchScreen("chord_reset"),
      },
    },
    {
      id: "q3",
      question: "音が鳴らないのですが？",
      answer:
        "ブラウザや端末の音量設定をご確認ください。iPhone/iPadでは『消音スイッチ』がONだと音が出ません。",
    },
    {
      id: "q4",
      question: "今日のトレーニングが記録されていないように見えます。",
      answer:
        "通信状態やページの閉じ方によって記録が反映されない場合があります。\nトレーニング中にページを閉じたり、『やめる』ボタンを使った場合は記録されません。",
    },
    {
      id: "q5",
      question: "和音の順番を自分で変えられますか？",
      answer:
        "和音の進捗の順番はこれが最適解となり決まっており、変更はできません。\nただし、設定画面で出題和音を柔軟にコントロールできますのでそちらでご活用下さい。",
    },
  ];

  const main = document.createElement("main");
  main.className = "info-page";
  const heading = document.createElement("h1");
  heading.textContent = "よくある質問";
  main.appendChild(heading);

  faqs.forEach((faq) => {
    const section = document.createElement("section");
    section.id = faq.id;

    const qEl = document.createElement("h2");
    qEl.textContent = `Q. ${faq.question}`;

    const aEl = document.createElement("p");
    aEl.innerText = faq.answer;

    section.appendChild(qEl);
    section.appendChild(aEl);

    if (faq.button) {
      const btn = document.createElement("button");
      btn.id = faq.button.id;
      btn.className = "link-btn";
      btn.textContent = faq.button.label;
      btn.addEventListener("click", faq.button.action);
      const p = document.createElement("p");
      p.appendChild(btn);
      section.appendChild(p);
    }

    main.appendChild(section);
  });

  app.appendChild(main);
}
