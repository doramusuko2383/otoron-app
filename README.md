# Otoron App

このリポジトリは絶対音感トレーニングアプリのソースコードです。Firebase での認証を利用しつつ、Supabase とも連携しています。

## Firebase の ID トークンを Supabase で利用する

Supabase の認証に Firebase の ID トークンを使用するため、Supabase 側でカスタム OIDC プロバイダ `firebase` を追加する必要があります。以下はその設定手順です。

1. Supabase ダッシュボードでプロジェクトを開き **Auth** → **Settings** → **External OAuth Providers** の順に移動します。
2. **Custom OIDC** セクションで新しいプロバイダを追加します。`Slug` を `firebase` とし、`Issuer` には `https://securetoken.google.com/<Firebase プロジェクト ID>` を入力します。
3. `JWKs URL` には `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com` を指定し、保存します。

これで Firebase で取得した ID トークンを利用して Supabase にログインできるようになります。

## `main.js` での認証処理

Firebase でログイン後、取得した ID トークンを用いて Supabase にサインインします。Supabase ではカスタム OIDC プロバイダー `firebase` を使用するため、`main.js` ではそのプロバイダーを指定してサインインします.

```javascript
const idToken = await firebaseUser.getIdToken(true);
const { error } = await supabase.auth.signInWithIdToken({
  provider: "firebase",
  token: idToken,
});
if (error) {
  console.error("❌ Supabase sign-in failed:", error.message);
}
```

## Supabase Configuration

アプリが利用する標準の Supabase プロジェクトは下記の URL とキーです。誤って別の DB に切り替えた場合は `utils/supabaseClient.js` をこの設定に戻してください。

```javascript
const supabaseUrl = 'https://flnqyramgddjcbbaispx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbnF5cmFtZ2RkamNiYmFpc3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjEwMDcsImV4cCI6MjA2MzgzNzAwN30.ARtrCplVHw7Q0gdDjsaoHp6__CNulye_IMWIqFmacqc';
```

以前の DB (`https://xnccwydcesyvqvyqafbg.supabase.co`) を使用するとトレーニング画面や育成画面が正しく動作しないため、上記の設定を推奨します。

