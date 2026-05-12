import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

export default function AdminZonesPage() {
  const [zones, setZones] = useState([]);
  const [zoneFloors, setZoneFloors] = useState({});
  const [columns, setColumns] = useState([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    setMsg('');
    try {
      const data = await apiFetch('/api/zones/config');
      setZones(Array.isArray(data?.zones) ? data.zones : []);
      setZoneFloors(data?.zoneFloors && typeof data.zoneFloors === 'object' ? data.zoneFloors : {});
      const cols = Array.isArray(data?.columns) ? data.columns : [];
      setColumns(cols.length ? cols : [{ id: 'c1', name: 'عمود ١', available: true, spotsCount: 10 }]);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ في التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setOk('');
    setMsg('');
    setSaving(true);
    try {
      await apiFetch('/api/zones/config', {
        method: 'PUT',
        admin: true,
        body: JSON.stringify({
          zones,
          zoneFloors,
          columns: columns.map((c) => ({
            ...c,
            spotsCount: Number(c.spotsCount) || 10,
          })),
        }),
      });
      setOk('تم حفظ الإعدادات.');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const addZone = () => {
    const name = newZoneName.trim();
    if (!name || zones.includes(name)) return;
    setZones([...zones, name]);
    setZoneFloors({
      ...zoneFloors,
      [name]: [
        { id: `f-${Date.now()}`, name: 'الدور الأول', available: true },
        { id: `f-${Date.now()}-2`, name: 'الدور الثاني', available: false },
      ],
    });
    setNewZoneName('');
  };

  const removeZone = (name) => {
    setZones(zones.filter((z) => z !== name));
    const next = { ...zoneFloors };
    delete next[name];
    setZoneFloors(next);
  };

  const updateFloors = (zoneName, floors) => {
    setZoneFloors({ ...zoneFloors, [zoneName]: floors });
  };

  const addFloorRow = (zoneName) => {
    const cur = zoneFloors[zoneName] || [];
    updateFloors(zoneName, [
      ...cur,
      { id: `f-${Date.now()}`, name: `دور ${cur.length + 1}`, available: true },
    ]);
  };

  if (loading) return <p className="muted">جاري التحميل...</p>;

  return (
    <div>
      <h1 className="title" style={{ fontSize: 26, marginTop: 0 }}>
        المناطق والأدوار والأعمدة
      </h1>
      <p className="subtitle">
        الأعمدة هنا تُستخدم في شاشة اختيار الموقف. العمود الأول: أول ٦ مواقع في كل دور تُخصَّص لذوي الهمم بعد اعتماد الطلب.
      </p>

      {msg ? <p className="danger">{msg}</p> : null}
      {ok ? <p className="success">{ok}</p> : null}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="cardBody">
          <h2 className="sectionTitle">أسماء المناطق</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '1 1 220px', marginBottom: 0 }}>
              <div className="label">منطقة جديدة</div>
              <input className="input" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder="مثلاً: مواقف البوابة الجنوبية" />
            </div>
            <button type="button" className="btn btnPrimary" onClick={addZone}>
              إضافة
            </button>
          </div>
          <ul style={{ marginTop: 14, paddingInlineStart: 20 }}>
            {zones.map((z) => (
              <li key={z} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <strong>{z}</strong>
                <button type="button" className="btn" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => removeZone(z)}>
                  حذف من القائمة
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {zones.map((zoneName) => (
        <div key={zoneName} className="card" style={{ marginBottom: 16 }}>
          <div className="cardBody">
            <h2 className="sectionTitle">أدوار: {zoneName}</h2>
            {(zoneFloors[zoneName] || []).map((f, idx) => (
              <div key={f.id} className="grid2" style={{ marginBottom: 12, alignItems: 'flex-end' }}>
                <div className="field">
                  <div className="label">اسم الدور</div>
                  <input
                    className="input"
                    value={f.name}
                    onChange={(e) => {
                      const next = [...(zoneFloors[zoneName] || [])];
                      next[idx] = { ...f, name: e.target.value };
                      updateFloors(zoneName, next);
                    }}
                  />
                </div>
                <div className="field">
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={f.available}
                      onChange={(e) => {
                        const next = [...(zoneFloors[zoneName] || [])];
                        next[idx] = { ...f, available: e.target.checked };
                        updateFloors(zoneName, next);
                      }}
                    />
                    <span className="label" style={{ marginBottom: 0 }}>
                      متاح للحجز
                    </span>
                  </label>
                </div>
              </div>
            ))}
            <button type="button" className="btn" onClick={() => addFloorRow(zoneName)}>
              + دور
            </button>
          </div>
        </div>
      ))}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="cardBody">
          <h2 className="sectionTitle">الأعمدة (مواقف — عمود ١ يضم مواقف ذوي الهمم)</h2>
          {columns.map((col, idx) => (
            <div key={col.id} className="grid2" style={{ marginBottom: 14 }}>
              <div className="field">
                <div className="label">اسم العمود</div>
                <input
                  className="input"
                  value={col.name}
                  onChange={(e) => {
                    const next = [...columns];
                    next[idx] = { ...col, name: e.target.value };
                    setColumns(next);
                  }}
                />
              </div>
              <div className="field">
                <div className="label">عدد المواقف في العمود</div>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={99}
                  value={col.spotsCount ?? 10}
                  onChange={(e) => {
                    const next = [...columns];
                    next[idx] = { ...col, spotsCount: parseInt(e.target.value, 10) || 10 };
                    setColumns(next);
                  }}
                />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={col.available !== false}
                    onChange={(e) => {
                      const next = [...columns];
                      next[idx] = { ...col, available: e.target.checked };
                      setColumns(next);
                    }}
                  />
                  <span>العمود يظهر في الشبكة</span>
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn"
            onClick={() =>
              setColumns([
                ...columns,
                {
                  id: `c-${Date.now()}`,
                  name: `عمود ${columns.length + 1}`,
                  available: true,
                  spotsCount: 10,
                },
              ])
            }
          >
            + عمود
          </button>
        </div>
      </div>

      <button type="button" className="btn btnPrimary" disabled={saving} onClick={save}>
        {saving ? 'جاري الحفظ…' : 'حفظ كل الإعدادات'}
      </button>
    </div>
  );
}
