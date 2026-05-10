import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import AdminZoneMapPicker from '../components/AdminZoneMapPicker.jsx';
import { ensureColumnsHaveSpotsCount } from '../lib/parkingHelpers';

const DEFAULT_PIN = { latitude: 24.714, longitude: 46.6755, radiusMeters: 120 };

function sumColumnSpots(cols) {
  if (!cols?.length) return 0;
  return cols.reduce((s, c) => s + (Number(c.spotsCount) || 0), 0);
}

/** يحافظ على معرفات الأعمدة عند تغيير العدد الإجمالي */
function ensureZoneColumns(prevCols, total, zoneKey) {
  const n = Math.max(4, Math.min(200, Number(total) || 20));
  const c1 = Math.ceil(n / 2);
  const c2 = n - c1;
  if (prevCols?.length >= 2) {
    return [
      { ...prevCols[0], spotsCount: c1 },
      { ...prevCols[1], spotsCount: c2 },
    ];
  }
  const safe = String(zoneKey).replace(/\s+/g, '-').slice(0, 60);
  return [
    { id: `zc-${safe}-col-1`, name: 'عمود ١', available: true, spotsCount: c1 },
    { id: `zc-${safe}-col-2`, name: 'عمود ٢', available: true, spotsCount: c2 },
  ];
}

function buildFloorsForZone(count) {
  const n = Math.max(1, Math.min(20, parseInt(String(count), 10) || 2));
  const labels = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن'];
  const floors = [];
  for (let i = 0; i < n; i++) {
    floors.push({
      id: `f-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      name: i < labels.length ? `الدور ${labels[i]}` : `دور ${i + 1}`,
      available: i === 0,
    });
  }
  return floors;
}

export default function AdminZonesPage() {
  const [zones, setZones] = useState([]);
  const [zoneFloors, setZoneFloors] = useState({});
  const [columns, setColumns] = useState([]);
  const [zoneColumns, setZoneColumns] = useState({});
  const [zonePins, setZonePins] = useState({});
  const [bookingSpotsByZone, setBookingSpotsByZone] = useState({});

  const [newZoneName, setNewZoneName] = useState('');
  const [newFloorsCount, setNewFloorsCount] = useState(2);
  const [newBookingSpots, setNewBookingSpots] = useState(20);
  const [newRadius, setNewRadius] = useState(120);
  const [newPin, setNewPin] = useState({ latitude: null, longitude: null });
  const [newLocationMode, setNewLocationMode] = useState('map');
  const [manualLatStr, setManualLatStr] = useState('');
  const [manualLngStr, setManualLngStr] = useState('');
  /** لا تُعرض الخريطة إلا بعد طلب صريح — ثم تظهر نسخة مصغّرة */
  const [newZonePickerOpen, setNewZonePickerOpen] = useState(false);
  /** اسم المنطقة التي مفتوحة لها محرّك الخريطة المصغّرة، أو null */
  const [zoneMapEditorOpen, setZoneMapEditorOpen] = useState(null);

  const [renameDraft, setRenameDraft] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    setMsg('');
    try {
      const [cfg, mapData] = await Promise.all([apiFetch('/api/zones/config'), apiFetch('/api/map-zones')]);

      const zList = Array.isArray(cfg?.zones) ? cfg.zones : [];
      setZones(zList);
      setZoneFloors(cfg?.zoneFloors && typeof cfg.zoneFloors === 'object' ? cfg.zoneFloors : {});

      const cols = Array.isArray(cfg?.columns) ? cfg.columns : [];
      setColumns(
        cols.length
          ? ensureColumnsHaveSpotsCount(cols)
          : [
              { id: 'c1', name: 'عمود ١', available: true, spotsCount: 10 },
              { id: 'c2', name: 'عمود ٢', available: true, spotsCount: 10 },
            ]
      );

      const fromCfg = cfg?.zoneColumns && typeof cfg.zoneColumns === 'object' ? cfg.zoneColumns : {};
      const globalSum = sumColumnSpots(ensureColumnsHaveSpotsCount(cols)) || 20;

      const nextPins = {};
      const nextBooking = {};
      const nextZoneCols = {};

      const mapZones = Array.isArray(mapData?.zones) ? mapData.zones : [];
      const byName = new Map(mapZones.map((m) => [m.name, m]));

      for (const z of zList) {
        const mz = byName.get(z);
        if (mz) {
          nextPins[z] = {
            latitude: mz.latitude,
            longitude: mz.longitude,
            radiusMeters: mz.radiusMeters ?? 120,
          };
        } else {
          nextPins[z] = { ...DEFAULT_PIN };
        }

        if (fromCfg[z]?.length) {
          nextZoneCols[z] = ensureColumnsHaveSpotsCount(fromCfg[z]);
          nextBooking[z] = sumColumnSpots(nextZoneCols[z]);
        } else {
          nextBooking[z] = globalSum;
          nextZoneCols[z] = ensureZoneColumns(undefined, globalSum, z);
        }
      }

      setZonePins(nextPins);
      setBookingSpotsByZone(nextBooking);
      setZoneColumns(nextZoneCols);

      const rd = {};
      for (const z of zList) rd[z] = z;
      setRenameDraft(rd);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'خطأ في التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updatePinField = (zoneName, field, value) => {
    setZonePins((prev) => ({
      ...prev,
      [zoneName]: {
        ...DEFAULT_PIN,
        ...prev[zoneName],
        [field]: value,
      },
    }));
  };

  const setBookingSpotsForZone = (zoneName, total) => {
    const t = Number(total) || 20;
    setBookingSpotsByZone((prev) => ({ ...prev, [zoneName]: t }));
    setZoneColumns((prev) => ({
      ...prev,
      [zoneName]: ensureZoneColumns(prev[zoneName], t, zoneName),
    }));
  };

  const save = async () => {
    setOk('');
    setMsg('');
    setSaving(true);
    try {
      const cleanedColumns = columns.map((c) => ({
        ...c,
        spotsCount: Number(c.spotsCount) || 10,
      }));

      const mapPins = {};
      for (const z of zones) {
        const p = zonePins[z];
        if (p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)) {
          mapPins[z] = { latitude: p.latitude, longitude: p.longitude };
        }
      }

      const zcPayload = {};
      for (const z of zones) {
        if (zoneColumns[z]?.length) {
          zcPayload[z] = zoneColumns[z].map((c) => ({
            ...c,
            spotsCount: Number(c.spotsCount) || 10,
          }));
        }
      }

      await apiFetch('/api/zones/config', {
        method: 'PUT',
        admin: true,
        body: JSON.stringify({
          zones,
          zoneFloors,
          columns: cleanedColumns,
          zoneColumns: zcPayload,
          mapPins: Object.keys(mapPins).length ? mapPins : undefined,
        }),
      });

      const mapData = await apiFetch('/api/map-zones');
      const list = Array.isArray(mapData?.zones) ? mapData.zones : [];
      for (const z of zones) {
        const p = zonePins[z];
        const mz = list.find((m) => m.name === z);
        if (!mz || !p) continue;
        const radiusMeters = Number(p.radiusMeters) || 120;
        let availableSpots = Number(bookingSpotsByZone[z]);
        if (!Number.isFinite(availableSpots) || availableSpots < 0) {
          availableSpots = sumColumnSpots(zoneColumns[z]) || 0;
        }
        availableSpots = Math.max(0, Math.floor(availableSpots));
        if (mz.radiusMeters !== radiusMeters || mz.availableSpots !== availableSpots) {
          await apiFetch(`/api/map-zones/${encodeURIComponent(mz.id)}`, {
            method: 'PATCH',
            admin: true,
            body: JSON.stringify({ radiusMeters, availableSpots }),
          });
        }
      }

      setOk('تم حفظ الإعدادات وتحديث الخريطة.');
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

    const pin =
      newPin.latitude != null && newPin.longitude != null
        ? { latitude: newPin.latitude, longitude: newPin.longitude }
        : { ...DEFAULT_PIN };

    const total = Number(newBookingSpots) || 20;
    setZones((prev) => [...prev, name]);
    setZoneFloors((prev) => ({
      ...prev,
      [name]: buildFloorsForZone(newFloorsCount),
    }));
    setZoneColumns((prev) => ({
      ...prev,
      [name]: ensureZoneColumns(undefined, total, name),
    }));
    setBookingSpotsByZone((prev) => ({ ...prev, [name]: total }));
    setZonePins((prev) => ({
      ...prev,
      [name]: {
        latitude: pin.latitude,
        longitude: pin.longitude,
        radiusMeters: Number(newRadius) || 120,
      },
    }));
    setRenameDraft((prev) => ({ ...prev, [name]: name }));

    setNewZoneName('');
    setNewFloorsCount(2);
    setNewBookingSpots(20);
    setNewRadius(120);
    setNewPin({ latitude: null, longitude: null });
    setNewLocationMode('map');
    setManualLatStr('');
    setManualLngStr('');
    setNewZonePickerOpen(false);
  };

  const clearNewPin = () => {
    setNewPin({ latitude: null, longitude: null });
    setManualLatStr('');
    setManualLngStr('');
  };

  const goManualMode = () => {
    setManualLatStr(newPin.latitude != null ? String(newPin.latitude) : '');
    setManualLngStr(newPin.longitude != null ? String(newPin.longitude) : '');
    setNewLocationMode('manual');
  };

  const goMapMode = () => {
    const lat = parseFloat(String(manualLatStr).trim().replace(',', '.'));
    const lng = parseFloat(String(manualLngStr).trim().replace(',', '.'));
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setNewPin({ latitude: lat, longitude: lng });
      setMsg('');
    }
    setNewLocationMode('map');
  };

  const applyManualCoords = () => {
    const lat = parseFloat(String(manualLatStr).trim().replace(',', '.'));
    const lng = parseFloat(String(manualLngStr).trim().replace(',', '.'));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setMsg('أدخل خط عرض وخط طول صحيحين.');
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setMsg('الإحداثيات خارج النطاق المسموح.');
      return;
    }
    setMsg('');
    setNewPin({ latitude: lat, longitude: lng });
  };

  const removeZone = (name) => {
    if (!window.confirm(`حذف منطقة «${name}» من الحجز والخريطة؟`)) return;
    setZones((prev) => prev.filter((z) => z !== name));
    setZoneFloors((prev) => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
    setZoneColumns((prev) => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
    setBookingSpotsByZone((prev) => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
    setZonePins((prev) => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
    setRenameDraft((prev) => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
    if (zoneMapEditorOpen === name) setZoneMapEditorOpen(null);
  };

  const applyRename = (oldName) => {
    const newName = (renameDraft[oldName] || '').trim();
    if (!newName || newName === oldName) return;
    if (zones.includes(newName)) {
      setMsg('يوجد منطقة بنفس الاسم.');
      return;
    }

    setZones((prev) => prev.map((z) => (z === oldName ? newName : z)));
    setZoneFloors((prev) => {
      const n = { ...prev };
      if (n[oldName]) {
        n[newName] = n[oldName];
        delete n[oldName];
      }
      return n;
    });
    setZoneColumns((prev) => {
      const n = { ...prev };
      if (n[oldName]) {
        n[newName] = n[oldName];
        delete n[oldName];
      }
      return n;
    });
    setBookingSpotsByZone((prev) => {
      const n = { ...prev };
      if (oldName in n) {
        n[newName] = n[oldName];
        delete n[oldName];
      }
      return n;
    });
    setZonePins((prev) => {
      const n = { ...prev };
      if (n[oldName]) {
        n[newName] = { ...n[oldName] };
        delete n[oldName];
      }
      return n;
    });
    setRenameDraft((prev) => {
      const next = { ...prev };
      delete next[oldName];
      next[newName] = newName;
      return next;
    });
    if (zoneMapEditorOpen === oldName) setZoneMapEditorOpen(newName);
    setMsg('');
  };

  const updateFloors = (zoneName, floors) => {
    setZoneFloors((prev) => ({ ...prev, [zoneName]: floors }));
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
        إدارة المناطق
      </h1>
      <p className="subtitle">
        إضافة منطقة، تعديل الأدوار والموقع على الخريطة، عدد المواقف، ثم حفظ. للحذف استخدم «حذف المنطقة» داخل البطاقة.
      </p>

      {msg ? <p className="danger">{msg}</p> : null}
      {ok ? <p className="success">{ok}</p> : null}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="cardBody">
          <h2 className="sectionTitle">إضافة منطقة جديدة</h2>

          <h3 className="sectionTitle" style={{ fontSize: 17, marginTop: 4, marginBottom: 10 }}>
            الموقع على الخريطة
          </h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 12 }}>
            اضغط الزر أدناه لفتح خريطة مصغّرة أو إدخال الإحداثيات.
          </p>

          {!newZonePickerOpen ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <button
                type="button"
                className="btn btnPrimary"
                onClick={() => {
                  setNewLocationMode('map');
                  setNewZonePickerOpen(true);
                }}
              >
                تحديد المنطقة على الخريطة
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  goManualMode();
                  setNewZonePickerOpen(true);
                }}
              >
                إدخال الإحداثيات يدويًا
              </button>
              <span className="muted" style={{ fontSize: 13 }} dir="ltr">
                {newPin.latitude != null && newPin.longitude != null
                  ? `محدد مسبقًا: ${newPin.latitude.toFixed(5)}, ${newPin.longitude.toFixed(5)}`
                  : 'لم يُحدد موقع بعد'}
              </span>
            </div>
          ) : (
            <>
              <div className="segmented" style={{ marginBottom: 14 }}>
                <button
                  type="button"
                  className={`segBtn ${newLocationMode === 'map' ? 'segBtnActive' : ''}`}
                  onClick={goMapMode}
                >
                  من الخريطة
                </button>
                <button type="button" className={`segBtn ${newLocationMode === 'manual' ? 'segBtnActive' : ''}`} onClick={goManualMode}>
                  إدخال الإحداثيات يدويًا
                </button>
              </div>

              <div className="field" style={{ maxWidth: 220, marginBottom: 14 }}>
                <div className="label">نصف القطر (متر)</div>
                <input className="input" type="number" min={20} max={500} value={newRadius} onChange={(e) => setNewRadius(e.target.value)} />
              </div>

              {newLocationMode === 'manual' ? (
                <div style={{ marginBottom: 12 }}>
                  <div className="grid2" style={{ alignItems: 'flex-end' }}>
                    <div className="field">
                      <div className="label">خط العرض (latitude)</div>
                      <input
                        className="input"
                        dir="ltr"
                        placeholder="24.714"
                        value={manualLatStr}
                        onChange={(e) => setManualLatStr(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <div className="label">خط الطول (longitude)</div>
                      <input
                        className="input"
                        dir="ltr"
                        placeholder="46.6755"
                        value={manualLngStr}
                        onChange={(e) => setManualLngStr(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                    <button type="button" className="btn btnPrimary" onClick={applyManualCoords}>
                      تطبيق الإحداثيات على المعاينة
                    </button>
                    <button type="button" className="btn" onClick={goMapMode}>
                      التحديد بالنقر على المصغّرة
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="adminMapThumbWrap">
                <AdminZoneMapPicker
                  latitude={newPin.latitude}
                  longitude={newPin.longitude}
                  onPick={(lat, lng) => {
                    setMsg('');
                    setNewPin({ latitude: lat, longitude: lng });
                  }}
                  height={newLocationMode === 'map' ? 168 : 152}
                  radiusMeters={Number(newRadius) > 0 ? Number(newRadius) : 120}
                  interactive={newLocationMode === 'map'}
                  hintText="انقر على الخريطة المصغّرة لوضع النقطة"
                />
              </div>

              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div className="muted" style={{ fontSize: 13 }} dir="ltr">
                  {newPin.latitude != null && newPin.longitude != null ? (
                    <>
                      محدد: {newPin.latitude.toFixed(6)}, {newPin.longitude.toFixed(6)}
                    </>
                  ) : (
                    <>انقر على المصغّرة أو طبّق الإحداثيات — أو أخفِ لوحة الخريطة وأضِف بالموقع الافتراضي</>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(newPin.latitude != null || newPin.longitude != null) && (
                    <button type="button" className="btn" style={{ padding: '6px 12px', fontSize: 13 }} onClick={clearNewPin}>
                      مسح التحديد
                    </button>
                  )}
                  <button type="button" className="btn" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setNewZonePickerOpen(false)}>
                    إخفاء الخريطة
                  </button>
                </div>
              </div>
            </>
          )}

          <h3 className="sectionTitle" style={{ fontSize: 17, marginTop: 22, marginBottom: 12 }}>
            بيانات المنطقة
          </h3>
          <div className="grid2" style={{ alignItems: 'flex-end' }}>
            <div className="field">
              <div className="label">اسم المنطقة</div>
              <input className="input" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder="مثلاً: مواقف البوابة الجنوبية" />
            </div>
            <div className="field">
              <div className="label">عدد الأدوار (يبدأ الأول متاحًا)</div>
              <input className="input" type="number" min={1} max={20} value={newFloorsCount} onChange={(e) => setNewFloorsCount(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">عدد المواقف (الشبكة)</div>
              <input className="input" type="number" min={4} max={200} value={newBookingSpots} onChange={(e) => setNewBookingSpots(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button type="button" className="btn btnPrimary" onClick={addZone}>
              إضافة المنطقة
            </button>
          </div>
        </div>
      </div>

      {zones.map((zoneName) => (
        <div key={zoneName} className="card" style={{ marginBottom: 16 }}>
          <div className="cardBody">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <h2 className="sectionTitle" style={{ marginBottom: 0 }}>
                منطقة: {zoneName}
              </h2>
              <button type="button" className="btn btnDanger" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => removeZone(zoneName)}>
                حذف المنطقة
              </button>
            </div>

            <div className="grid2" style={{ marginTop: 12, alignItems: 'flex-end' }}>
              <div className="field">
                <div className="label">تعديل الاسم</div>
                <input
                  className="input"
                  value={renameDraft[zoneName] ?? zoneName}
                  onChange={(e) => setRenameDraft({ ...renameDraft, [zoneName]: e.target.value })}
                />
              </div>
              <div style={{ paddingBottom: 4 }}>
                <button type="button" className="btn" onClick={() => applyRename(zoneName)}>
                  تطبيق الاسم الجديد
                </button>
              </div>
            </div>
            <h3 className="sectionTitle" style={{ fontSize: 17, marginTop: 18 }}>
              الخريطة
            </h3>
            <div className="field" style={{ maxWidth: 220 }}>
              <div className="label">نصف القطر (متر)</div>
              <input
                className="input"
                type="number"
                min={20}
                max={500}
                value={zonePins[zoneName]?.radiusMeters ?? 120}
                onChange={(e) => updatePinField(zoneName, 'radiusMeters', Number(e.target.value) || 120)}
              />
            </div>

            {zoneMapEditorOpen !== zoneName ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 8 }}>
                <button type="button" className="btn btnPrimary" style={{ padding: '8px 14px', fontSize: 14 }} onClick={() => setZoneMapEditorOpen(zoneName)}>
                  تحديد الموقع على الخريطة
                </button>
                <span className="muted" style={{ fontSize: 13 }} dir="ltr">
                  {zonePins[zoneName]?.latitude != null && zonePins[zoneName]?.longitude != null
                    ? `الموقع الحالي: ${Number(zonePins[zoneName].latitude).toFixed(5)}, ${Number(zonePins[zoneName].longitude).toFixed(5)}`
                    : 'لم يُضبط موقع بعد'}
                </span>
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <div className="adminMapThumbWrap">
                  <AdminZoneMapPicker
                    latitude={zonePins[zoneName]?.latitude}
                    longitude={zonePins[zoneName]?.longitude}
                    onPick={(lat, lng) => {
                      setZonePins((prev) => ({
                        ...prev,
                        [zoneName]: {
                          ...DEFAULT_PIN,
                          ...prev[zoneName],
                          latitude: lat,
                          longitude: lng,
                        },
                      }));
                    }}
                    height={168}
                    radiusMeters={zonePins[zoneName]?.radiusMeters ?? 120}
                    hintText="انقر على الخريطة المصغّرة لنقل موقع المنطقة"
                  />
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button type="button" className="btn" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setZoneMapEditorOpen(null)}>
                    إخفاء الخريطة
                  </button>
                </div>
              </div>
            )}

            <h3 className="sectionTitle" style={{ fontSize: 17, marginTop: 18 }}>
              أدوار الحجز
            </h3>
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

            <h3 className="sectionTitle" style={{ fontSize: 17, marginTop: 18 }}>
              المواقف
            </h3>
            <div className="field" style={{ maxWidth: 280 }}>
              <div className="label">عدد المواقف</div>
              <input
                className="input"
                type="number"
                min={4}
                max={200}
                value={bookingSpotsByZone[zoneName] ?? 20}
                onChange={(e) => setBookingSpotsForZone(zoneName, e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="btn btnPrimary" disabled={saving} onClick={save}>
        {saving ? 'جاري الحفظ…' : 'حفظ كل الإعدادات'}
      </button>
    </div>
  );
}
