import { renderIntroHeader } from "../introHeader.js";
import { renderHeader } from "../header.js";

export function renderExternalScreen(user) {
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
    <h1>外部送信ポリシー</h1>
    <p>この外部送信ポリシー（以下、「本ポリシー」といいます）は、オトロン（以下、「本サービス」といいます）をご利用いただく際に、ユーザーの端末から第三者に送信される情報とその目的・送信先等についてご案内するものです。</p>
    <h2>送信される情報の例</h2>
    <p>本サービスでは、主にアクセス解析のため、以下の情報がユーザーの端末から第三者に送信されることがあります。</p>
    <ul>
      <li>Cookie（端末識別子）</li>
      <li>IPアドレス</li>
      <li>アクセス日時</li>
      <li>ブラウザやデバイスの種類</li>
      <li>閲覧ページや遷移元URL</li>
      <li>画面サイズやOSなどの端末情報</li>
    </ul>
    <h2>主な外部送信先と利用目的</h2>
    <h3>Google Analytics（Google LLC）</h3>
    <p>アクセス解析およびサービス改善のために使用しています。収集された情報は個人を特定せず、Google社のポリシーに基づいて管理されます。</p>
    <ul>
      <li><a href="https://policies.google.com/privacy?hl=ja" target="_blank">Google プライバシーポリシー</a></li>
      <li><a href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank">オプトアウト（Google Analytics無効化）</a></li>
      <li><a href="https://policies.google.com/technologies/partner-sites?hl=ja" target="_blank">Googleによる情報の利用について</a></li>
    </ul>
    <h2>その他のサービス</h2>
    <p>現在、本サービスでは広告配信、マーケティングツール、その他の第三者トラッキングツールは使用していません。将来的に導入する場合は、本ポリシーを更新し、適切にお知らせいたします。</p>
    <h2>更新について</h2>
    <p>本ポリシーは必要に応じて変更されることがあります。重要な変更がある場合には、本サービス内またはWebサイト上でお知らせいたします。</p>
    <hr />
    <p>2025年6月 作成</p>
  `;
  app.appendChild(main);
}
