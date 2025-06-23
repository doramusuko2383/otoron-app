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
      question: "初回登録時の和音の選択を間違えてしまいました。選びなおせますか？",
      answer:
        "はい、やり直すことができます。\n\nこのアプリでは、和音を決まった順番で1つずつ増やして練習していく『育成モード』を採用しています。\n初回に『どの和音から練習を始めるか』を選んでいただきますが、これはどこから順番に進めていくかのスタート地点を決めるためのものです。\n\nもし、和音の選択を間違えてしまった場合は、以下のボタンから和音の選び直しができます。\n白鍵の和音はもちろん、黒鍵の転回形（白ボタン）もすべて自由に選び直すことができます。",
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
    const detail = document.createElement("details");
    detail.id = faq.id;
    detail.classList.add("collapsible");

    const summary = document.createElement("summary");
    summary.textContent = `Q. ${faq.question}`;
    detail.appendChild(summary);

    const contentWrapper = document.createElement("div");
    contentWrapper.className = "detail-content";

    const aEl = document.createElement("p");
    aEl.innerText = faq.answer;
    contentWrapper.appendChild(aEl);

    if (faq.button) {
      const btn = document.createElement("button");
      btn.id = faq.button.id;
      btn.className = "link-btn";
      btn.textContent = faq.button.label;
      btn.addEventListener("click", faq.button.action);
      const p = document.createElement("p");
      p.appendChild(btn);
      contentWrapper.appendChild(p);
    }

    detail.appendChild(contentWrapper);
    main.appendChild(detail);
  });

  const detailsList = main.querySelectorAll("details.collapsible");
  detailsList.forEach((detail) => {
    const summary = detail.querySelector("summary");
    summary.addEventListener("click", (e) => {
      e.preventDefault();
      const isOpen = detail.hasAttribute("open");
      if (isOpen) {
        detail.classList.add("closing");
        setTimeout(() => {
          detail.removeAttribute("open");
          detail.classList.remove("closing");
        }, 400);
      } else {
        detailsList.forEach((d) => {
          if (d !== detail) d.removeAttribute("open");
        });
        detail.setAttribute("open", "");
      }
    });
  });

  app.appendChild(main);
}
