export function getLockType(user) {
  if (!user) return null;
  const now = new Date();

  if (!user.is_premium && user.trial_active && user.trial_end_date) {
    const end = new Date(user.trial_end_date);
    if (end <= now) {
      return "trial_expired";
    }
  }

  if (!user.is_premium && !user.trial_active) {
    return "premium_expired";
  }

  return null;
}

export function isAccessAllowed(user) {
  return !getLockType(user);
}
