export function isPasswordUser(user) {
  if (!user) return false;
  return user.providerData?.some(p => p.providerId === 'password');
}
