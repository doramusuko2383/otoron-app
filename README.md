# Otoron App

このリポジトリは絶対音感トレーニングアプリのソースコードです。Firebase での認証を利用しつつ、Supabase とも連携しています。

## Firebase の ID トークンを Supabase で利用する

Supabase の認証に Firebase の ID トークンを使用するため、Supabase 側でカスタム OIDC プロバイダ `firebase` を追加する必要があります。以下はその設定手順です。

1. Supabase ダッシュボードでプロジェクトを開き **Auth** → **Settings** → **External OAuth Providers** の順に移動します。
2. **Custom OIDC** セクションで新しいプロバイダを追加します。`Slug` を `firebase` とし、`Issuer` には `https://securetoken.google.com/<Firebase プロジェクト ID>` を入力します。
3. `JWKs URL` には `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com` を指定し、保存します。

これで Firebase で取得した ID トークンを利用して Supabase にログインできるようになります。

## `main.js` での認証処理

Firebase でログイン後、取得した ID トークンを用いて Supabase にサインインする処理は `main.js` に実装されています。設定が完了すると、以下のコードが正常に動作します。

```javascript
const idToken = await firebaseUser.getIdToken();
const { error: signInError } = await supabase.auth.signInWithIdToken({
  provider: "firebase",
  token: idToken,
});
```

`signInError` が返らなければ、Firebase ユーザーに対応する Supabase のセッションが生成され、アプリの各機能で Supabase の API を利用できるようになります。
