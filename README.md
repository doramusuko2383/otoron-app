# Otoron App

このリポジトリは絶対音感トレーニングアプリのソースコードです。Firebase での認証を利用しつつ、Supabase とも連携しています。

## Firebase の ID トークンを Supabase で利用する

Supabase の認証に Firebase の ID トークンを使用するため、Supabase 側でカスタム OIDC プロバイダ `firebase` を追加する必要があります。以下はその設定手順です。

1. Supabase ダッシュボードでプロジェクトを開き **Auth** → **Settings** → **External OAuth Providers** の順に移動します。
2. **Custom OIDC** セクションで新しいプロバイダを追加します。`Slug` を `firebase` とし、`Issuer` には `https://securetoken.google.com/<Firebase プロジェクト ID>` を入力します。
3. `JWKs URL` には `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com` を指定し、保存します。

これで Firebase で取得した ID トークンを利用して Supabase にログインできるようになります。

## `main.js` での認証処理

Firebase でログイン後、取得した ID トークンを用いて Supabase にサインインします。Supabase 側で登録したカスタム OIDC のスラッグが `firebase` とは限らないため、`main.js` では複数の候補を順番に試します。

```javascript
const idToken = await firebaseUser.getIdToken(true);
const saved = localStorage.getItem("supabaseProvider");
const providersToTry = saved ? [saved] : ["google", "firebase", "firebase-google", "custom"];
let signInError = null;
for (const provider of providersToTry) {
  const { error } = await supabase.auth.signInWithIdToken({ provider, token: idToken });
  if (error) {
    console.warn(`❌ Sign-in with "${provider}" failed:`, error.message);
    signInError = error;
  } else {
    console.log(`✅ Sign-in with "${provider}" succeeded`);
    localStorage.setItem("supabaseProvider", provider);
    signInError = null;
    break;
  }
}
if (signInError) {
  console.error("❌ Supabase sign-in failed:", signInError.message);
}
```

一度成功したプロバイダーは `localStorage` に保存され、次回以降はその値のみでサインインを試みます。
