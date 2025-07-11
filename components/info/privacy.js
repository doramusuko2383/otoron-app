import { renderIntroHeader } from "../introHeader.js";
import { renderHeader } from "../header.js";
import { switchScreen } from "../../main.js";

export function renderPrivacyScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  if (user) {
    renderHeader(app, user);
  } else {
    renderIntroHeader(app);
  }

  const main = document.createElement("main");
  main.className = "info-page full-page";
  main.innerHTML = `
    <h1>プライバシーポリシー</h1>
    <p>本プライバシーポリシー（以下、「本ポリシー」といいます。）は、オトロン（以下、「本サービス」といいます。）の提供にあたり、ユーザーの個人情報を適切に取り扱う方針を定めたものです。個人運営者である当方は、関連する法令（個人情報保護法など）を遵守し、本サービスを利用するすべてのユーザー（以下、「ユーザー」といいます。）のプライバシーを尊重します。</p>
    <h2>第1条（個人情報の定義）</h2>
    <p>本ポリシーにおける「個人情報」とは、特定の個人を識別できる情報（例：氏名、メールアドレス、UIDなど）を指します。</p>
    <h2>第2条（取得する情報とその方法）</h2>
    <p>本サービスでは、FirebaseやSupabaseを通じて以下の情報を取得する場合があります：</p>
    <ul>
      <li>Firebase UID（ユーザー識別用）</li>
      <li>ニックネーム・学習履歴など、本人が入力した情報</li>
      <li>アクセス状況・端末情報（Google Analyticsを通じて）</li>
    </ul>
    <h2>第3条（利用目的）</h2>
    <p>取得した個人情報は、以下の目的の範囲内で利用されます：</p>
    <ul>
      <li>本サービスの提供および改善</li>
      <li>学習履歴の記録および進捗確認</li>
      <li>問い合わせ対応・トラブル対応</li>
      <li>サービス利用状況の分析（Google Analyticsを利用）</li>
    </ul>
    <h2>第4条（第三者提供の制限）</h2>
    <p>当方は、以下の場合を除き、取得した個人情報を第三者に提供しません：</p>
    <ul>
      <li>法令に基づく場合</li>
      <li>人命や財産の保護が必要な緊急時</li>
      <li>業務委託に伴う必要な範囲での情報共有（例：サーバー管理）</li>
    </ul>
    <h2>第5条（外部サービスの利用）</h2>
    <p>本サービスでは、以下の外部サービスを利用しています。これらサービスが収集する情報については、それぞれのポリシーをご確認ください。</p>
    <ul>
      <li><strong>Firebase / Supabase：</strong>ログイン・DB管理</li>
      <li><strong>Google Analytics：</strong>匿名の利用状況分析（Cookie利用）</li>
    </ul>
    <h2>第6条（安全管理措置）</h2>
    <p>ユーザーの個人情報は、適切なセキュリティ対策を講じて管理します。万一、漏えい、滅失、毀損が発生した場合には、速やかに通知し、再発防止策を講じます。</p>
    <h2>第7条（利用者の権利）</h2>
    <p>ユーザーは、自己の個人情報について、開示、訂正、利用停止、削除を求めることができます。お問い合わせは<a href="#" id="contact-link">お問い合わせフォーム</a>からご連絡ください。</p>
    <h2>第8条（未成年の利用）</h2>
    <p>20歳未満のユーザーは、保護者の同意を得た上で本サービスを利用してください。</p>
    <h2>第9条（問い合わせ窓口）</h2>
    <p>個人情報に関する問い合わせは、<a href="#" id="contact-link2">お問い合わせフォームはこちら</a>からお願いいたします。<br>
    ※セキュリティ保護とスムーズな対応のため、メールアドレスでの直接対応は行っておりません。</p>
    <h2>第10条（プライバシーポリシーの変更）</h2>
    <p>本ポリシーは、法令の改正などに応じて必要に応じて改定されます。重要な変更がある場合には、本サービス内またはWebサイト上でお知らせいたします。</p>
    <hr />
    <p>2025年6月 作成</p>
  `;

  const link1 = main.querySelector("#contact-link");
  if (link1) {
    link1.addEventListener("click", (e) => {
      e.preventDefault();
      switchScreen("contact");
    });
  }
  const link2 = main.querySelector("#contact-link2");
  if (link2) {
    link2.addEventListener("click", (e) => {
      e.preventDefault();
      switchScreen("contact");
    });
  }
  app.appendChild(main);
}
