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
    <p>二宮 晴奈（個人事業主）</p>
    <h2>運営責任者</h2>
    <p>二宮 晴奈</p>
    <h2>所在地</h2>
    <p>
      〒227-0051 神奈川県横浜市青葉区千草台38ー9<br />
      ※詳細はご請求があれば遅滞なく開示いたします。
    </p>
    <h2>お問い合わせ先</h2>
    <p>
      <a href="mailto:support@playotoron.com">support@playotoron.com</a><br />
      受付時間：平日 10:00～17:00<br />
      ※通常2営業日以内にご返信いたします。
    </p>
    <h2>販売価格</h2>
    <p>各プランごとに税込価格を表示しています（例：1ヶ月プラン 1,490円 等）。</p>
    <h2>商品以外の必要料金</h2>
    <p>インターネット接続にかかる通信料等はお客様のご負担となります。</p>
    <h2>支払方法</h2>
    <p>クレジットカードによる決済（Stripe）</p>
    <h2>支払時期</h2>
    <p>お申込み時点で即時決済。期間終了後は契約内容に応じて自動更新されます。</p>
    <h2>引渡し時期</h2>
    <p>決済完了後、すぐにご利用いただけます。</p>
    <h2>返品・キャンセル</h2>
    <p>
      サービスの性質上、原則として返品・キャンセルには対応しておりません。<br />
      ただし、法令により認められる場合はこの限りではありません。
    </p>
    <h2>動作環境</h2>
    <p>iOS / Android / Windows / macOS 各最新版ブラウザ（Google Chrome推奨）</p>
    <hr />
    <p>公開日 2025年6月22日</p>
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
