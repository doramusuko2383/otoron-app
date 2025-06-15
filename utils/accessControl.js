export function isAccessAllowed(user) {
  if (!user) return false;
  if (user.is_premium) return true;
  if (user.trial_active && user.trial_end_date) {
    const end = new Date(user.trial_end_date);
    if (end > new Date()) {
      return true;
    }
  }
  return false;
}
