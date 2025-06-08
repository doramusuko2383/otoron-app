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

## Troubleshooting

Supabase へのサインインに失敗し `Custom OIDC provider "firebase" not allowed` と表示される場合は、過去のコードを利用している可能性があります。現在の実装では Firebase ユーザーのメールアドレスを用いて次のようにダミーパスワードでサインアップ・サインインする方式に切り替えています。

```javascript
const firebaseUser = firebase.auth().currentUser;
const dummyPassword = 'secure_dummy_password';

await supabase.auth.signUp({ email: firebaseUser.email, password: dummyPassword });
await supabase.auth.signInWithPassword({ email: firebaseUser.email, password: dummyPassword });
```

古いコードを利用している場合は、`main.js` などを最新の内容に更新してください。

