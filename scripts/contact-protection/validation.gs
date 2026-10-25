/** Call before any MailApp.sendEmail / GmailApp.sendEmail / sheet append. */
function validateCustomerInquiry_(e) {
  var p = (e && e.parameter) || {};
  var content = String(p.inquiry_content || '').trim();
  var allowed = ['電子黒板の無料相談','ショールーム・オンラインデモについて','デモ機レンタルについて','購入・リースについて','導入サポート・研修について','その他'];
  if (String(p.website_url || '').trim()) return false;
  if (p.customer_inquiry !== 'yes') return false;
  if (allowed.indexOf(String(p.inquiry_type || '')) < 0) return false;
  if (!content || content.length > 2000 || !/[ぁ-んァ-ヶ一-龯]/.test(content)) return false;
  if (!String(p.company_name || '').trim() || !String(p.person_name || '').trim()) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.email || ''))) return false;
  var started = Number(p.form_started_at);
  if (!isFinite(started) || started <= 0 || Date.now() - started < 3000 || Date.now() - started > 86400000) return false;
  return true;
}
