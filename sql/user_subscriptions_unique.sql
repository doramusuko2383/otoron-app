-- Ensure duplicate subscription rows cannot be inserted manually
alter table user_subscriptions
  add constraint user_subscriptions_user_started_at_key unique (user_id, started_at);
