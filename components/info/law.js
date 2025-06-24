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
    <h2>販売事業者名</h2>
    <p>二宮 晴奈（屋号：オトロン）</p>
    <h2>運営責任者</h2>
    <p>二宮 晴奈</p>
    <h2>所在地</h2>
    <p>〒227-0051 神奈川県横浜市青葉区千草台38-9 エクセレントシティ藤が丘501</p>
    <h2>電話番号</h2>
    <p>
      090-1461-5908（受付時間：平日 10:00～17:00）<br />
      ※お電話での対応が難しい場合は、メールまたはフォームよりご連絡ください。
    </p>
    <h2>メールアドレス</h2>
    <p><a href="mailto:support@playotoron.com">support@playotoron.com</a></p>
    <h2>販売価格</h2>
    <p>各プランごとに税込価格を表示しております（例：1ヶ月プラン 1,490円 など）。</p>
    <h2>商品以外の必要料金</h2>
    <p>インターネット接続にかかる通信料はお客様のご負担となります。</p>
    <h2>支払方法</h2>
    <p>クレジットカード決済（Stripe）</p>
    <h2>支払時期</h2>
    <p>お申込み時点で即時決済が行われます。以降の課金は購入プランの期間終了後、自動更新される場合があります。</p>
    <h2>契約期間・自動更新について</h2>
    <ul>
      <li>1ヶ月プラン：購入日から起算して30日間</li>
      <li>6ヶ月プラン：購入日から起算して180日間</li>
      <li>12ヶ月プラン：購入日から起算して360日間</li>
    </ul>
    <p>本サービスは買い切り型の有料プラン制となっており、プランに応じた期間中ご利用いただけます。自動更新は行われません。</p>
    <h2>解約方法</h2>
    <p>購入後のキャンセルは原則できませんが、問題が発生した場合は <a href="mailto:support@playotoron.com">support@playotoron.com</a> までご連絡ください。</p>
    <h2>商品の引渡時期</h2>
    <p>決済完了後、即時ご利用いただけます。</p>
    <h2>返品・キャンセルについて</h2>
    <p>
      デジタルコンテンツの性質上、サービス開始後の返金・キャンセルは原則お受けしておりません。<br />
      ただし、法令により認められる場合を除きます。<br />
      本サービスは特定商取引法におけるクーリングオフの適用対象外です。
    </p>
    <h2>動作環境</h2>
    <p>スマートフォン：iOS / Android 最新版ブラウザ<br />PC：Windows10 以上 / macOS 最新 / Google Chrome 最新版</p>
    <hr />
    <p>公開日 2025年6月更新</p>
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
