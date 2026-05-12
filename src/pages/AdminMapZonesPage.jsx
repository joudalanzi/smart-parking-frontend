import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

export default function AdminMapZonesPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radiusMeters: '120',
    availableSpots: '10',
  });

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/api/map-zones');
      setZones(Array.isArray(data?.zones) ? data.zones : []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createZone = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await apiFetch('/api/map-zones', {
        method: 'POST',
        admin: true,
        body: JSON.stringify({
          name: form.name.trim(),
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          radiusMeters: parseInt(form.radiusMeters, 10) || 120,
          availableSpots: parseInt(form.availableSpots, 10) || 0,
        }),
      });
      setForm({ name: '', latitude: '', longitude: '', radiusMeters: '120', availableSpots: '10' });
      await load();
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'خطأ');
    }
  };

  const patchZone = async (id, body) => {
    setMsg('');
    try {
      await apiFetch(`/api/map-zones/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        admin: true,
        body: JSON.stringify(body),
      });
      await load();
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'خطأ');
    }
  };

  const deleteZone = async (id) => {
    if (!window.confirm('حذف هذه المنطقة من الخريطة؟')) return;
    setMsg('');
    try {
      await apiFetch(`/api/map-zones/${encodeURIComponent(id)}`, { method: 'DELETE', admin: true });
      await load();
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'خطأ');
    }
  };

  if (loading) return <p className="muted">جاري التحميل...</p>;

  return (
    <div>
      <h1 className="title" style={{ fontSize: 26, marginTop: 0 }}>
        مناطق الخريطة (GPS)
      </h1>
      <p className="subtitle">هذه المناطق تظهر على الخريطة في الصفحة الرئيسية للمستخدمين.</p>
      {msg ? <p className="danger">{msg}</p> : null}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="cardBody">
          <h2 className="sectionTitle">إضافة منطقة</h2>
          <form onSubmit={createZone} className="grid2">
            <div className="field">
              <div className="label">الاسم</div>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <div className="label">خط العرض (latitude)</div>
              <input className="input" dir="ltr" type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
            </div>
            <div className="field">
              <div className="label">خط الطول (longitude)</div>
              <input className="input" dir="ltr" type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
            </div>
            <div className="field">
              <div className="label">نصف القطر (متر)</div>
              <input className="input" type="number" value={form.radiusMeters} onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })} />
            </div>
            <div className="field">
              <div className="label">مواقف متاحة (عرض تقريبي)</div>
              <input className="input" type="number" value={form.availableSpots} onChange={(e) => setForm({ ...form, availableSpots: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btnPrimary">
                إنشاء
              </button>
            </div>
          </form>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {zones.map((z) => (
          <div key={z.id} className="card">
            <div className="cardBody">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: 18 }}>{z.name}</strong>
                  <div className="muted" style={{ marginTop: 8, fontSize: 13 }} dir="ltr">
                    {z.latitude}, {z.longitude} — نصف قطر {z.radiusMeters}م — مواقف ~{z.availableSpots}
                  </div>
                </div>
                <button type="button" className="btn btnDanger" onClick={() => deleteZone(z.id)}>
                  حذف
                </button>
              </div>
              <div className="grid2" style={{ marginTop: 14 }}>
                <button type="button" className="btn" onClick={() => patchZone(z.id, { availableSpots: Math.max(0, (z.availableSpots || 0) - 1) })}>
                  − موقف
                </button>
                <button type="button" className="btn" onClick={() => patchZone(z.id, { availableSpots: (z.availableSpots || 0) + 1 })}>
                  + موقف
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
