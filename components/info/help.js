import { renderHeader } from "../header.js";

export function renderHelpScreen() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  renderHeader(app);

  const main = document.createElement("main");
  main.className = "info-page";
  main.innerHTML = `
    <section id="help-section" class="help-container">
      <h1>絶対音感トレーニング ガイド</h1>

      <details>
        <summary>対象年齢と基礎的な考え方</summary>
        <p>このアプリは2歳〜6歳半のお子さまを対象としています。これは、音を絶対的に記憶しやすい感覚の臨界期にあたるためです。それ以降の年齢では相対音感が強く育ちやすく、絶対音感の習得は難しくなる傾向があります。</p>
      </details>

      <details>
        <summary>相対音感との関係と注意点</summary>
        <p>音の高さを比べる相対音感が育つと、絶対音感の習得が難しくなります。和音を高さで聞き比べたり、移調して曲を練習したりすることは避けてください。本アプリでは、音の響きを「色」と結びつけて記憶するように設計しています。</p>
      </details>

      <details>
        <summary>トレーニング環境と頻度</summary>
        <p>静かな環境で行ってください。テレビ、掃除機、エアコンなどの音も避けます。トレーニングは1日4〜5回が理想で、1回ごとに15分以上空け、朝と夕方に分けて行うと効果的です。</p>
      </details>

      <details>
        <summary>回答方法と進行の流れ</summary>
        <p>和音を聴いたら、その和音に対応する色を声に出してボタンを押してください。最初は赤の和音1つから始め、順に和音を増やしていきます。2週間安定して回答できると、次の和音に進みます。オトロンでは一週間で次の和音に進める設計にしていますが、聞き分けが完璧でないと思えば日数を伸ばして下さい。</p>
      </details>

      <details>
        <summary>合格条件と推奨出題数</summary>
        <p>
          1日最低2回以上のトレーニングを行い、各和音の出題回数が推奨回数を満たし、正答率98%以上を達成した日を「合格日」とします。7日間連続で合格すると、次の和音の進捗ボタンが解放されます。
        </p>
        <ul>
          <li>1種（赤）：20回</li>
          <li>2種（赤・黄色）：各10回</li>
          <li>3種（赤～青）：各7回</li>
          <li>4種（赤～黒）：各6回</li>
          <li>5種（赤～緑）：各5回</li>
          <li>6種（赤～オレンジ）：各5回</li>
          <li>7種（赤～紫）：各4回</li>
          <li>8種（赤～ピンク）：各4回</li>
          <li>9種（赤～茶色）：各4回</li>
          <li>10〜14種（赤～水色）：各4回</li>
          <li>15〜19種：赤～水色は各2回、残りは各3回</li>
          <li>20〜24種：赤～水色は各2回、残りは各3回</li>
        </ul>
      </details>

      <details>
        <summary>音名表記と構成音の扱い</summary>
        <p>和音の構成音は最初は教えません。日本の慣習に合わせて白鍵はイタリア音名を、黒鍵はチス（C#）、エス（E♭）、フィス（F#）、ギス（G#）、ベー（B♭）といったドイツ音名を採用しています。</p>
      </details>

      <details>
        <summary>白鍵終了後の流れと単音テスト</summary>
        <p>白鍵が全て安定したら、色名から構成音へ読み上げ方式に変更し、単音テスト（白鍵）を行います。100%でなければ単音分化トレーニングに進みます。</p>
      </details>

      <details>
        <summary>単音分化トレーニングと移行条件</summary>
        <p>単音分化では和音の構成音の一番上を単音で出題し答えます。1週間ごとに白鍵の定着を確認し、2ヶ月以内に黒鍵へ移行します。</p>
      </details>

      <details>
        <summary>黒鍵トレーニングと転回形の扱い</summary>
        <p>黒鍵5つで混乱がなければ増やす必要はありません。混乱があれば白鍵と黒鍵を分けて練習し、それでも難しければ転回形を増やします。</p>
      </details>

      <details>
        <summary>最終テストと絶対音感の維持</summary>
        <p>単音テスト（3オクターブ、88鍵）で100%正解すれば習得完了です。ただし9歳までは維持のため継続練習をおすすめします。</p>
      </details>

      <details>
        <summary>このガイドについて</summary>
        <p>本ガイドは江口式絶対音感教育の考え方を参考に、オトロン独自の設計と実践に基づき再構成されたものです。</p>
      </details>
    </section>
  `;
  app.appendChild(main);

  const detailsList = main.querySelectorAll("#help-section details");
  detailsList.forEach((detail) => {
    detail.addEventListener("toggle", () => {
      if (detail.open) {
        detailsList.forEach((d) => {
          if (d !== detail) d.removeAttribute("open");
        });
      }
    });
  });
}

