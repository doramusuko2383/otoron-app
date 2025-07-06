# Otoron App

このリポジトリは絶対音感トレーニングアプリのソースコードです。Firebase での認証を利用しつつ、Supabase とも連携しています。

## Firebase ユーザーを Supabase でミラー作成する

Firebase 認証でログインしたユーザーのメールアドレスを利用し、Supabase 側にも同じアドレスのユーザーを作成します。ID トークンは使用せず、固定のダミーパスワードでサインアップ・ログインを行います。

```javascript
const firebaseUser = firebase.auth().currentUser;
const dummyPassword = 'secure_dummy_password';

const { error: signUpError } = await supabase.auth.signUp({
  email: firebaseUser.email,
  password: dummyPassword
});
if (signUpError && signUpError.message !== 'User already registered') {
  console.error('❌ Supabaseユーザー作成失敗:', signUpError.message);
}

const { error: signInError } = await supabase.auth.signInWithPassword({
  email: firebaseUser.email,
  password: dummyPassword
});
if (signInError) {
  console.error('❌ Supabaseログイン失敗:', signInError.message);
}
```

この処理を実行することで Supabase の API を利用できるようになります。

## `main.js` での認証処理

`main.js` では上記のサインアップ・サインイン処理を行った後、ユーザー情報の登録や画面遷移を行います。

## Supabase Configuration

アプリが利用する標準の Supabase プロジェクトは下記の URL とキーです。誤って別の DB に切り替えた場合は `utils/supabaseClient.js` をこの設定に戻してください。

```javascript
const supabaseUrl = 'https://xnccwydcesyvqvyqafbg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuY2N3eWRjZXN5dnF2eXFhZmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDExMTEsImV4cCI6MjA2MjM3NzExMX0.84ELOFGZFJaBNaiHM4roAVmw4o4JMEj4mHnxox1k7Gs';
```

以前使用していた `https://flnqyramgddjcbbaispx.supabase.co` プロジェクトは削除済みのため、必ず上記の URL を利用してください。


## Environment Variables

Vercel などの環境でデプロイする際は次の環境変数を設定してください。

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BASE_URL`
- `PRICE_ID_1M`
- `PRICE_ID_6M`
- `PRICE_ID_12M`

`PRICE_ID_*` は Stripe で発行した各プラン(1ヶ月/6ヶ月/12ヶ月)の価格IDです。
これらは `.env.example` にも記載しているので参考にしてください。

## Supabase Database Schema

`training_records` テーブルには日ごとの成績を保存します。和音の解放状況は
`user_chord_progress` テーブルで管理しており、各行に `status` と `unlocked_date`
を持たせています。

以前は `training_records` に `chords_required` カラムを追加する案がありましたが、
現在の構成では使用していません。

## Premium Management

Stripe Checkout 完了時の Webhook では `users` テーブルの `is_premium` を `true`
に更新します。また有効期限が切れたユーザーを定期的にチェックし、
`is_premium` を `false` に戻すバッチスクリプト
`scripts/resetExpiredPremiums.js` を用意しています。

```bash
npm run reset-expired-premiums
```

このスクリプトは日次ジョブ等で実行してください。

## Troubleshooting

Supabase へのサインインに失敗し `Custom OIDC provider "firebase" not allowed` と表示される場合は、過去のコードを利用している可能性があります。現在の実装では Firebase ユーザーのメールアドレスを用いて次のようにダミーパスワードでサインアップ・サインインする方式に切り替えています。

```javascript
const firebaseUser = firebase.auth().currentUser;
const dummyPassword = 'secure_dummy_password';

let { error } = await supabase.auth.signInWithPassword({
  email: firebaseUser.email,
  password: dummyPassword,
});
if (error && error.message.includes('Invalid login credentials')) {
  const { error: signUpError } = await supabase.auth.signUp({
    email: firebaseUser.email,
    password: dummyPassword,
  });
  if (!signUpError || signUpError.message.includes('User already registered')) {
    ({ error } = await supabase.auth.signInWithPassword({
      email: firebaseUser.email,
      password: dummyPassword,
    }));
  }
}
```

古いコードを利用している場合は、`main.js` などを最新の内容に更新してください。

