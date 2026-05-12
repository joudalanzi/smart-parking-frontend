export function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'كلمة المرور يجب أن لا تقل عن 8 أحرف' };
  }
  const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z\u0600-\u06FF0-9\s]/.test(password);
  if (!hasLetter) return { valid: false, message: 'كلمة المرور يجب أن تحتوي على حروف' };
  if (!hasNumber) return { valid: false, message: 'كلمة المرور يجب أن تحتوي على أرقام' };
  if (!hasSymbol) return { valid: false, message: 'كلمة المرور يجب أن تحتوي على رموز (مثل @ # $)' };
  return { valid: true };
}
