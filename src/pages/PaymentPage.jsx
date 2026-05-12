import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';

const ARABIC_NUMS = '٠١٢٣٤٥٦٧٨٩';
function toArabicNum(str) {
  return String(str).replace(/\d/g, (d) => ARABIC_NUMS[parseInt(d, 10)]);
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const summary = location.state?.summary;

  const [step, setStep] = useState('payment');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [paymentSnapshot, setPaymentSnapshot] = useState(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  if (!summary) {
    return (
      <div className="card" style={{ maxWidth: 720, marginInline: 'auto' }}>
        <div className="cardBody">
          <h1 className="title" style={{ fontSize: 26 }}>
            لا يوجد ملخص حجز
          </h1>
          <p className="subtitle">ارجع لصفحة الحجز واختر البيانات ثم تابع.</p>
          <div style={{ marginTop: 14 }}>
            <button type="button" onClick={() => navigate('/reservation')} className="btn btnPrimary">
              العودة للحجز
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    zone,
    floor,
    column,
    date,
    time,
    duration,
    durationMinutes,
    expectedArrivalTime,
    amount,
    carType,
    plateNumber,
    carColor,
  } = summary;

  const goToReview = () => {
    setMsg('');
    const err = validatePaymentForm(cardHolder, cardNumber, expiry, cvv);
    if (err) {
      setMsg(err);
      return;
    }
    const digits = onlyDigits(cardNumber);
    const expDigits = onlyDigits(expiry);
    const mm = parseInt(expDigits.slice(0, 2), 10);
    const yy = parseInt(expDigits.slice(2, 4), 10);
    const displayExpiry = `${String(mm).padStart(2, '0')}/${String(yy).padStart(2, '0')}`;
    setPaymentSnapshot({
      holderName: cardHolder.trim(),
      last4: digits.slice(-4),
      expiryDisplay: displayExpiry,
    });
    setCardNumber('');
    setCvv('');
    setStep('review');
  };

  const confirmPay = async () => {
    if (!paymentSnapshot) {
      setMsg('أكمل خطوة الدفع أولًا');
      return;
    }
    setMsg('');
    setLoading(true);
    try {
      await apiFetch('/api/reservations', {
        method: 'POST',
        body: JSON.stringify({
          zone,
          floor,
          columnLabel: column || undefined,
          spot: column || null,
          date,
          time,
          duration,
          durationMinutes: parseInt(String(durationMinutes), 10),
          expectedArrivalTime,
          amount: Number(amount),
          carType,
          plateNumber,
          carColor,
          paymentHolderName: paymentSnapshot.holderName,
          paymentCardLast4: paymentSnapshot.last4,
          paymentExpiry: paymentSnapshot.expiryDisplay,
        }),
      });
      navigate('/booking', { replace: true });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ');
    } finally {
      setLoading(false);
    }
  };

  const maskedLine = paymentSnapshot
    ? `•••• •••• •••• ${toArabicNum(paymentSnapshot.last4)} — ${paymentSnapshot.expiryDisplay} — ${paymentSnapshot.holderName}`
    : '';

  return (
    <div className="twoCol">
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="payStepTrack" role="navigation" aria-label="خطوات الدفع">
          <span className={`payStep ${step === 'payment' ? 'payStepActive' : 'payStepDone'}`}>١ الدفع</span>
          <span className="payStepSep" aria-hidden>
            ·
          </span>
          <span className={`payStep ${step === 'review' ? 'payStepActive' : ''}`}>٢ المراجعة والتأكيد</span>
        </div>

        <div className="pageHeader">
          <div>
            <h1>{step === 'payment' ? 'الدفع' : 'تأكيد الحجز'}</h1>
            <p>
              {step === 'payment'
                ? 'أدخل بيانات البطاقة. لا يُرسل الرقم الكامل للخادم — يُخزَّن اسم الحامل وآخر ٤ أرقام وتاريخ الانتهاء فقط (وضع تجريبي).'
                : 'راجع كل التفاصيل ثم أكّد لإنشاء الحجز في السيرفر.'}
            </p>
          </div>
          <span className="chip">
            الإجمالي:{' '}
            <strong style={{ color: 'var(--text)' }}>
              {toArabicNum(amount)} ر.س
            </strong>
          </span>
        </div>

        {step === 'payment' ? (
          <div className="card">
            <div className="cardBody">
              <h2 className="sectionTitle">بيانات البطاقة</h2>
              <p className="muted" style={{ marginTop: 0, lineHeight: 1.7 }}>
                للتجربة فقط: يكفي إدخال <strong>١٦ رقماً</strong> لرقم البطاقة (بدون التحقق البنكي Luhn). لا تستخدم بطاقة حقيقية على بيئة غير موثوقة. رمز الأمان (CVV)
                للتحقق المحلي فقط ولا يُخزَّن ولا يُرسل.
              </p>
              <div className="field" style={{ marginTop: 14 }}>
                <div className="label">الاسم على البطاقة</div>
                <input
                  className="input"
                  autoComplete="cc-name"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="مثلًا: جود العنزي"
                />
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <div className="label">رقم البطاقة</div>
                <input
                  className="input"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={formatCardGroups(cardNumber)}
                  onChange={(e) => {
                    const d = onlyDigits(e.target.value).slice(0, 16);
                    setCardNumber(d);
                  }}
                  placeholder="0000 0000 0000 0000"
                />
              </div>
              <div className="grid2" style={{ marginTop: 14 }}>
                <div className="field">
                  <div className="label">تاريخ الانتهاء</div>
                  <input
                    className="input"
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={formatExpiryInput(expiry)}
                    onChange={(e) => setExpiry(onlyDigits(e.target.value).slice(0, 4))}
                    placeholder="MM/YY"
                  />
                </div>
                <div className="field">
                  <div className="label">رمز الأمان (CVV)</div>
                  <input
                    className="input"
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={cvv}
                    onChange={(e) => setCvv(onlyDigits(e.target.value).slice(0, 4))}
                    placeholder="•••"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 'review' ? (
          <>
            <div className="card">
              <div className="cardBody">
                <div className="kpi noticeDanger">
                  <div className="kpiLabel">تنبيه الغرامة</div>
                  <div className="kpiValue" style={{ fontWeight: 800, lineHeight: 1.7 }}>
                    إذا تجاوزت الوقت المحدد ولم تقم بالتمديد أو الإنهاء، قد تتعرض <strong>لغرامة</strong>.
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardBody">
                <h2 className="sectionTitle">تفاصيل الحجز</h2>
                <div className="grid2">
                  <div className="kpi">
                    <div className="kpiLabel">المنطقة</div>
                    <div className="kpiValue">{zone}</div>
                  </div>
                  <div className="kpi">
                    <div className="kpiLabel">الدور</div>
                    <div className="kpiValue">{floor}</div>
                  </div>
                  <div className="kpi">
                    <div className="kpiLabel">الموقف</div>
                    <div className="kpiValue">{column || '—'}</div>
                  </div>
                  <div className="kpi">
                    <div className="kpiLabel">التاريخ والوقت</div>
                    <div className="kpiValue">
                      {date} — {time}
                    </div>
                  </div>
                  <div className="kpi">
                    <div className="kpiLabel">المدة</div>
                    <div className="kpiValue">{duration}</div>
                  </div>
                  <div className="kpi">
                    <div className="kpiLabel">المبلغ</div>
                    <div className="kpiValue">{toArabicNum(amount)} ر.س</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardBody">
                <h2 className="sectionTitle">بيانات السيارة</h2>
                <div className="grid2">
                  <div className="kpi">
                    <div className="kpiLabel">نوع السيارة</div>
                    <div className="kpiValue">{carType}</div>
                  </div>
                  <div className="kpi">
                    <div className="kpiLabel">رقم اللوحة</div>
                    <div className="kpiValue">{plateNumber}</div>
                  </div>
                  <div className="kpi" style={{ gridColumn: '1 / -1' }}>
                    <div className="kpiLabel">لون السيارة</div>
                    <div className="kpiValue">{carColor}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardBody">
                <h2 className="sectionTitle">ملخص الدفع</h2>
                <div className="kpi">
                  <div className="kpiLabel">البطاقة</div>
                  <div className="kpiValue" style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.65 }}>
                    {maskedLine}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card">
            <div className="cardBody">
              <div className="kpi noticeDanger">
                <div className="kpiLabel">تنبيه الغرامة</div>
                <div className="kpiValue" style={{ fontWeight: 800, lineHeight: 1.7 }}>
                  إذا تجاوزت الوقت المحدد ولم تقم بالتمديد أو الإنهاء، قد تتعرض <strong>لغرامة</strong>.
                </div>
              </div>
            </div>
          </div>
        )}

        {msg ? (
          <div className="card">
            <div className="cardBody">
              <p className="danger" style={{ margin: 0 }}>
                {msg}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <aside className="stickyCard">
        <div className="card">
          <div className="cardBody">
            <h2 className="sectionTitle">{step === 'payment' ? 'الخطوة التالية' : 'تأكيد نهائي'}</h2>
            {step === 'payment' ? (
              <>
                <button type="button" className="btn btnPrimary" style={{ width: '100%' }} onClick={goToReview}>
                  متابعة للمراجعة والتأكيد
                </button>
                <button type="button" onClick={() => navigate('/reservation')} className="btn" style={{ width: '100%', marginTop: 10 }}>
                  تعديل الحجز
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={confirmPay}
                  className="btn btnPrimary"
                  style={{ width: '100%', opacity: loading ? 0.75 : 1 }}
                >
                  {loading ? 'جاري التأكيد...' : 'تأكيد وإنشاء الحجز'}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setStep('payment');
                    setPaymentSnapshot(null);
                    setMsg('');
                  }}
                  className="btn"
                  style={{ width: '100%', marginTop: 10 }}
                >
                  تعديل بيانات الدفع
                </button>
                <button type="button" disabled={loading} onClick={() => navigate('/reservation')} className="btn" style={{ width: '100%', marginTop: 10 }}>
                  تعديل الحجز
                </button>
              </>
            )}
            <p className="muted" style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7 }}>
              بعد التأكيد يمكنك إدارة الحجز من صفحة «حجزي النشط» مع كل التفاصيل المحفوظة.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function onlyDigits(s) {
  return String(s || '').replace(/\D/g, '');
}

function formatCardGroups(digitsRaw) {
  const d = onlyDigits(digitsRaw);
  return d.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiryInput(digitsRaw) {
  const d = onlyDigits(digitsRaw).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

function validatePaymentForm(holder, numberRaw, expiryRaw, cvvRaw) {
  const name = holder.trim();
  if (name.length < 3) return 'أدخل الاسم كما يظهر على البطاقة';
  const digits = onlyDigits(numberRaw);
  /** وضع تجريبي: قبول أي ١٦ رقماً دون خوارزمية Luhn (الحقيقية تستخدمها بوابات الدفع) */
  if (digits.length !== 16) return 'أدخل ١٦ رقماً لرقم البطاقة';
  const expDigits = onlyDigits(expiryRaw);
  if (expDigits.length !== 4) return 'أدخل تاريخ الانتهاء كاملًا (شهر وسنتين)';
  const mm = parseInt(expDigits.slice(0, 2), 10);
  const yy = parseInt(expDigits.slice(2, 4), 10);
  if (mm < 1 || mm > 12) return 'شهر الانتهاء غير صحيح';
  const expEnd = new Date(2000 + yy, mm, 0, 23, 59, 59, 999).getTime();
  if (expEnd < Date.now()) return 'البطاقة منتهية';
  const cv = onlyDigits(cvvRaw);
  if (cv.length < 3 || cv.length > 4) return 'رمز الأمان يجب أن يكون ٣ أو ٤ أرقام';
  return '';
}
