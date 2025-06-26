import { renderIntroHeader } from "../introHeader.js";
import { switchScreen } from "../../main.js";

export function renderLawScreen(user) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  renderIntroHeader(app);

  const main = document.createElement("main");
  main.className = "info-page full-page";
  main.innerHTML = `
    <h1>特定商取引法に基づく表示</h1>
    <h2>販売事業者名</h2>
    <p>二宮 晴奈（屋号：オトロン）</p>
    <h2>運営統括責任者</h2>
    <p>二宮 晴奈</p>
    <h2>所在地</h2>
    <p>〒227-0051 神奈川県横浜市青葉区千草台38-9 エクセレントシティ藤が丘501</p>
    <h2>電話番号</h2>
    <p>
      090-1461-5908（受付時間：平日 10:00～17:00）<br />
      ※お電話での対応が難しい場合は、メールまたはお問い合わせフォームよりご連絡ください。
    </p>
    <h2>メールアドレス</h2>
    <p><a href="mailto:support@playotoron.com">support@playotoron.com</a></p>
    <h2>追加手数料等の追加料金</h2>
    <p>インターネット接続にかかる通信料は、お客様のご負担となります。その他、決済手数料や配送費等は発生しません。</p>
    <h2>販売価格</h2>
    <p>各プランページに税込価格を表示しております。例：</p>
    <ul>
      <li>1ヶ月プラン：¥1,490（税込）</li>
      <li>6ヶ月プラン：¥7,800（税込）</li>
      <li>12ヶ月プラン：¥13,800（税込）</li>
    </ul>
    <h2>引渡時期</h2>
    <p>クレジットカードによる決済完了後、即時にご利用いただけます。</p>
    <h2>受け付け可能な決済手段</h2>
    <p>クレジットカード決済（Visa / MasterCard / American Express など）</p>
    <h2>決済期間</h2>
    <p>ご注文時点で即時決済されます。</p>
    <h2>返品・キャンセル（返金ポリシー）</h2>
    <p>
      デジタルコンテンツの性質上、サービス開始後の返金・キャンセルは原則お受けしておりません。<br />
      ただし、法令に基づく場合や、システム不具合等による提供不能時には適切に対応いたします。<br />
      ※本サービスは特定商取引法におけるクーリングオフの対象外です。
    </p>
    <h2>契約期間について</h2>
    <p>本サービスは買い切り型の有料プラン制であり、プランに応じた利用期間内でご利用いただけます。自動更新は行われません。</p>
    <ul>
      <li>1ヶ月プラン：決済日から30日間</li>
      <li>6ヶ月プラン：決済日から180日間</li>
      <li>12ヶ月プラン：決済日から360日間</li>
    </ul>
    <h2>解約方法</h2>
    <p>マイページまたは設定画面より手動で解約申請が可能です。<br />何らかの理由により操作できない場合は、<a href="mailto:support@playotoron.com">support@playotoron.com</a> までご連絡ください。</p>
    <h2>動作環境</h2>
    <p>スマートフォン：iOS / Android 最新版ブラウザ<br />PC：Windows10 以上 / macOS 最新版 / Google Chrome 最新版推奨</p>
    <h2>申込期間の制限</h2>
    <p>現在、申込期間に制限は設けておりません。</p>
    <h2>販売数量の制限</h2>
    <p>販売数量に制限は設けておりません。</p>
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
