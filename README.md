# صفَّة — واجهة الويب (React + Vite)

واجهة حجز مواقف **صفَّة** تتصل بـ REST API للباك إند.

## المتطلبات

- Node.js 18+
- باك إند يعمل (افتراضياً `http://localhost:4000`) — راجع [smart-parking-backend](https://github.com/joudalanzi/smart-parking-backend)

## التشغيل

```bash
npm install
copy .env.example .env
npm run dev
```

عدّل `VITE_API_URL` في `.env` إذا كان عنوان الباك إند مختلفاً.

## البناء

```bash
npm run build
npm run preview
```

## الفرع `v2`

نسخة الواجهة المربوطة بالباك إند (Supabase عبر الـ API).
