-- Create table to store processed Stripe webhook events
create table if not exists stripe_events (
  event_id text primary key,
  received_at timestamp with time zone default current_timestamp
);
