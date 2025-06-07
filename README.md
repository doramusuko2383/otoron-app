# Otoron App

このリポジトリは絶対音感トレーニングアプリのソースコードです。Firebase での認証を利用しつつ、Supabase とも連携しています。

## Firebase の ID トークンを Supabase で利用する

Supabase の認証に Firebase の ID トークンを使用するため、Supabase 側でカスタム OIDC プロバイダを登録します。**ここで設定する `Slug` は必ず `firebase` としてください。** `supabase.auth.signInWithIdToken` で指定するプロバイダー名と一致しない場合、サインインは失敗します。以下に詳しい設定手順を示します。

Firebase が発行する ID トークンを Supabase で検証するには、トークンの発行元 (`Issuer`) と公開鍵 (`JWKs URL`) を Supabase に登録する必要があります。これにより Supabase は Firebase の署名を検証できるようになります。

1. Supabase ダッシュボードでプロジェクトを開き **Auth** → **Settings** → **External OAuth Providers** の順に移動します。
2. **Custom OIDC** セクションで新しいプロバイダを追加します。**`Slug` は必ず `firebase` と指定**し、`Issuer` には `https://securetoken.google.com/<Firebase プロジェクト ID>` を入力します。
3. `JWKs URL` には `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com` を指定し、保存します。

これで Firebase で取得した ID トークンを利用して Supabase にログインできるようになります。もしカスタムプロバイダーを登録していない場合、サインイン時に `Custom OIDC provider 'firebase' not allowed` と表示され、ログインに失敗するので注意してください。

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
const supabaseUrl = 'https://xnccwydcesyvqvyqafbg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuY2N3eWRjZXN5dnF2eXFhZmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDExMTEsImV4cCI6MjA2MjM3NzExMX0.84ELOFGZFJaBNaiHM4roAVmw4o4JMEj4mHnxox1k7Gs';
```

以前使用していた `https://flnqyramgddjcbbaispx.supabase.co` プロジェクトは削除済みのため、必ず上記の URL を利用してください。


## Environment Variables

Vercel などの環境でデプロイする際は次の環境変数を設定してください。

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

これらは `.env.example` にも記載しているので参考にしてください。

## Supabase Database Schema

`training_records` テーブルには日ごとの成績を保存します。新機能に合わせ、解放したコードのキーを保持する `chords_required` カラムを追加してください。

```sql
ALTER TABLE training_records ADD COLUMN chords_required jsonb NOT NULL DEFAULT '[]';
```

`chords_required` にはアンロックされたコードキーを JSON 配列として保存します。既存の行は `UPDATE training_records SET chords_required = '[]';` で空配列に更新してください。

