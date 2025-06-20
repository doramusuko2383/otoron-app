import { renderHeader } from "../header.js";
import { switchScreen } from "../../main.js";

export function renderLawScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app, user);

  const main = document.createElement("main");
  main.className = "info-page full-page";
  main.innerHTML = `
    <h1>特定商取引法に基づく表示</h1>
    <h2>事業者</h2>
    <p>個人運営（氏名・住所は取引時に請求があれば開示いたします）</p>
    <h2>運営責任者</h2>
    <p>オトロン運営者</p>
    <h2>お問い合わせ</h2>
    <p>ご質問やご要望は、以下のフォームからご連絡ください。<br>
    通常、2〜3営業日以内にご返信いたします。</p>
    <p><a href="#" id="contact-link">お問い合わせフォームはこちら</a></p>
    <p>※セキュリティ保護とスムーズな対応のため、メールアドレスでの直接対応は行っておりません。</p>
    <h2>販売価格</h2>
    <p>有料プランを導入した場合、価格はアプリ内またはWebサイト上の各サービス紹介ページに表示されます。</p>
    <h2>商品以外の必要料金</h2>
    <p>インターネット接続費・通信料などはお客様のご負担となります。</p>
    <h2>支払方法</h2>
    <p>クレジットカード決済、またはアプリ内課金（予定）</p>
    <h2>支払時期</h2>
    <p>初回申込み時に即時決済。次回以降は契約内容に応じて自動更新されます。</p>
    <h2>サービス提供時期</h2>
    <p>決済完了後、すぐにご利用いただけます。</p>
    <h2>返品・キャンセルについて</h2>
    <p>サービスの性質上、原則としてキャンセル・返金には対応しておりません。ただし、法令に定めがある場合はこの限りではありません。</p>
    <h2>動作環境（推奨）</h2>
    <p>本サービスはスマートフォンまたはPCでの利用を想定しています。<br>
    推奨環境は以下のとおりです。</p>
    <ul>
      <li><strong>スマートフォン：</strong> iOS / Android 最新版ブラウザ</li>
      <li><strong>PC：</strong> Windows10 以上 / macOS 最新 / Google Chrome 最新</li>
    </ul>
    <hr />
    <p>2025年6月 作成</p>
  `;

  const contactLink = main.querySelector("#contact-link");
  if (contactLink) {
    contactLink.addEventListener("click", (e) => {
      e.preventDefault();
      switchScreen("contact");
    });
  }
  app.appendChild(main);
}
