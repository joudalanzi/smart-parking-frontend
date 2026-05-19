import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  buildSpotsFromColumns,
  durationToMinutes,
  ensureColumnsHaveSpotsCount,
  estimateAmountRiyals,
  formatSpotGridCaption,
  partitionSpotsByFloors,
  validateCarInfo,
} from '../lib/parkingHelpers';

const DEFAULT_ZONES = ['مواقف البوابة الشمالية', 'مواقف المبنى الرئيسي', 'مواقف الزوار أ', 'مواقف شركة العثيم'];

const DEFAULT_ZONE_FLOORS = {
  'مواقف البوابة الشمالية': [
    { id: 'f1', name: 'الدور الأول', available: true },
    { id: 'f2', name: 'الدور الثاني', available: false },
  ],
  'مواقف المبنى الرئيسي': [
    { id: 'f1', name: 'الدور الأول', available: true },
    { id: 'f2', name: 'الدور الثاني', available: true },
  ],
  'مواقف الزوار أ': [{ id: 'f1', name: 'الدور الأول', available: true }],
  'مواقف شركة العثيم': [{ id: 'f1', name: 'الدور الأول', available: true }],
};

const DEFAULT_COLUMNS = [
  { id: 'c1', name: 'عمود ١', available: true, spotsCount: 10 },
  { id: 'c2', name: 'عمود ٢', available: true, spotsCount: 10 },
];

const DURATIONS = ['دقيقة واحدة', 'ربع ساعة', 'ساعة واحدة', 'ساعتان', '٣ ساعات', '٤ ساعات', 'يوم كامل'];

const ARABIC_NUMS = '٠١٢٣٤٥٦٧٨٩';
function toArabicNum(n) {
  return String(n).replace(/\d/g, (d) => ARABIC_NUMS[parseInt(d, 10)]);
}
function formatDate(d) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${toArabicNum(day)}/${toArabicNum(m)}/${toArabicNum(y)}`;
}
function formatTime(d) {
  const h = d.getHours();
  const m = d.getMinutes();
  return `${toArabicNum(h.toString().padStart(2, '0'))}:${toArabicNum(m.toString().padStart(2, '0'))}`;
}

export default function ReservationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselected = location.state?.preselectedZone;
  const fromMap = location.state?.fromMap === true;
  const { user } = useAuth();

  const accessibleApproved = !!user?.isDisabledPerson;

  if (!preselected || !fromMap) {
    return (
      <div className="card" style={{ maxWidth: 820, marginInline: 'auto' }}>
        <div className="cardBody">
          <h1 className="title" style={{ fontSize: 26 }}>
            اختر منطقة من الخريطة أولًا
          </h1>
          <p className="subtitle">
            عشان يكون الحجز واقعي، لازم تختار منطقة المواقف من الخريطة في الصفحة الرئيسية ثم تنتقل للحجز.
          </p>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btnPrimary" onClick={() => navigate('/')}>
              الذهاب للخريطة
            </button>
            <button type="button" className="btn" onClick={() => navigate('/booking')}>
              حجزي النشط
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [zonesConfig, setZonesConfig] = useState({
    zones: DEFAULT_ZONES,
    zoneFloors: DEFAULT_ZONE_FLOORS,
    columns: DEFAULT_COLUMNS,
    zoneColumns: {},
  });

  const zones = zonesConfig.zones;
  const zoneFloorsMap = zonesConfig.zoneFloors;

  const [zone, setZone] = useState(() => (preselected ? preselected : DEFAULT_ZONES[0]));

  const columnsList = useMemo(() => {
    const perZone = zonesConfig.zoneColumns?.[zone];
    const cols = perZone?.length ? perZone : zonesConfig.columns;
    return ensureColumnsHaveSpotsCount(cols);
  }, [zonesConfig.zoneColumns, zonesConfig.columns, zone]);
  const zoneFloors = zoneFloorsMap[zone] || [];
  const firstAvailableFloor = zoneFloors.find((f) => f.available);
  const [floor, setFloor] = useState(firstAvailableFloor ? firstAvailableFloor.name : zoneFloors[0]?.name || 'الدور الأول');
  const [column, setColumn] = useState('');
  const [accessibleParking, setAccessibleParking] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(() => new Date());
  const [duration, setDuration] = useState('ساعة واحدة');
  const [carType, setCarType] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [carColor, setCarColor] = useState('');
  const [error, setError] = useState('');

  const fetchZonesConfig = useCallback(async () => {
    try {
      const data = await apiFetch('/api/zones/config');
      if (data?.zones?.length && data.zoneFloors && data.columns?.length) {
        const cols = ensureColumnsHaveSpotsCount(data.columns);
        setZonesConfig({
          zones: data.zones,
          zoneFloors: data.zoneFloors,
          columns: cols,
          zoneColumns: data.zoneColumns || {},
        });
        if (preselected && data.zones.includes(preselected)) {
          setZone(preselected);
        }
      }
    } catch {
      /* defaults */
    }
  }, [preselected]);

  useEffect(() => {
    fetchZonesConfig();
  }, [fetchZonesConfig]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchZonesConfig();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [fetchZonesConfig]);

  useEffect(() => {
    if (!zones.includes(zone)) {
      setZone(zones[0] || zone);
      setColumn('');
    }
    const nextFloors = zoneFloorsMap[zone] || [];
    const nextAvail = nextFloors.find((f) => f.available);
    setFloor(nextAvail ? nextAvail.name : nextFloors[0]?.name || 'الدور الأول');
  }, [zone, zones, zoneFloorsMap]);

  useEffect(() => {
    setColumn('');
  }, [floor]);

  const allSpots = useMemo(
    () => buildSpotsFromColumns(columnsList, accessibleApproved),
    [columnsList, accessibleApproved]
  );

  const spotsByFloor = useMemo(
    () => partitionSpotsByFloors(allSpots, zoneFloors),
    [allSpots, zoneFloors]
  );

  const spotsForFloor = spotsByFloor.get(floor) ?? [];

  const goPayment = () => {
    setError('');
    const useAccessible = accessibleParking && accessibleApproved;
    if (!useAccessible && !column) {
      setError('اختر رقم الموقف من القائمة');
      return;
    }
    const validation = validateCarInfo(carType, plateNumber, carColor);
    if (!validation.ok) {
      setError(validation.msg);
      return;
    }
    const { carType: t, plateNumber: p, carColor: c } = validation;
    const durationMinutes = durationToMinutes(duration);
    const amount = estimateAmountRiyals(durationMinutes);
    const summary = {
      zone,
      floor,
      column,
      date: formatDate(selectedDateTime),
      time: formatTime(selectedDateTime),
      duration,
      durationMinutes,
      expectedArrivalTime: selectedDateTime.toISOString(),
      amount,
      carType: t,
      plateNumber: p,
      carColor: c,
    };
    navigate('/payment', { state: { summary } });
  };

  const durationMinutes = durationToMinutes(duration);
  const amount = estimateAmountRiyals(durationMinutes);
  const dateStr = formatDate(selectedDateTime);
  const timeStr = formatTime(selectedDateTime);
  const isoDate = selectedDateTime.toISOString().slice(0, 10);
  const isoTime = `${String(selectedDateTime.getHours()).padStart(2, '0')}:${String(selectedDateTime.getMinutes()).padStart(2, '0')}`;

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1>الحجز</h1>
          <p>اختر الموقع والوقت وبيانات السيارة. بعدها ستُكمّل الدفع ثم المراجعة قبل إنشاء الحجز.</p>
        </div>
        <span className="chip">
          المنطقة: <strong style={{ color: 'var(--text)' }}>{zone}</strong>
        </span>
      </div>

      <div className="twoCol">
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card">
            <div className="cardBody">
              <h2 className="sectionTitle">الموقع</h2>
              <div className="field">
                <div className="label">المنطقة</div>
                <select className="input" value={zone} onChange={(e) => setZone(e.target.value)}>
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          <div className="card">
            <div className="cardBody">
              <h2 className="sectionTitle">اختر الموقف</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                اختر الدور أولًا، ثم الموقف ضمن العمود في هذا الدور. المواقع تُقسَّم بين الأدوار المتاحة بالتساوي.
                {accessibleApproved ? ' مواقف ذوي الهمم تظهر لك إذا كانت ضمن المسموح.' : ' مواقف ذوي الهمم لا تظهر إلا للمستخدم المعتمد.'}
              </p>

              <div className="resSpotSection">
                <div className="label" style={{ marginBottom: 8 }}>
                  ١ — الدور
                </div>
                <div className="pillRow">
                  {zoneFloors.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      disabled={!f.available}
                      onClick={() => f.available && setFloor(f.name)}
                      className={`pill ${floor === f.name ? 'pillActive' : ''}`}
                      title={!f.available ? 'غير متوفر' : 'متوفر'}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {spotsForFloor.length > 0 ? (
                <div className="resSpotSection resSpotSectionSpots">
                  <div className="label" style={{ marginBottom: 10 }}>
                    ٢ — العمود ثم الموقف في «{floor}»
                  </div>
                  {columnsList.map((col) => {
                    const colSpots = spotsForFloor.filter((s) => s.columnId === col.id);
                    if (!colSpots.length) return null;
                    return (
                      <div key={col.id} className="resSpotColumnBlock">
                        <div className="resSpotColumnTitle">{col.name}</div>
                        <div className="spotsGrid" role="list">
                          {colSpots.map((spot) => (
                            <button
                              key={spot.id}
                              type="button"
                              onClick={() => {
                                setColumn(spot.label);
                                setAccessibleParking(spot.isAccessibleOnly);
                              }}
                              className={`spotBtn ${column === spot.label ? 'spotBtnActive' : ''}`}
                              role="listitem"
                            >
                              {formatSpotGridCaption(spot)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
                  لا توجد مواقف مرتبطة بهذا الدور ضمن الإعدادات الحالية.
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="cardBody">
              <h2 className="sectionTitle">الوقت والمدة</h2>
              <div className="grid2">
                <div className="field">
                  <div className="label">التاريخ</div>
                  <input
                    className="input"
                    type="date"
                    value={isoDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) return;
                      const d = new Date(selectedDateTime);
                      const [y, m, day] = v.split('-').map(Number);
                      d.setFullYear(y, m - 1, day);
                      setSelectedDateTime(d);
                    }}
                  />
                </div>
                <div className="field">
                  <div className="label">الوقت</div>
                  <input
                    className="input"
                    type="time"
                    value={isoTime}
                    onChange={(e) => {
                      const [hh, mm] = e.target.value.split(':').map(Number);
                      const d = new Date(selectedDateTime);
                      d.setHours(hh, mm, 0, 0);
                      setSelectedDateTime(d);
                    }}
                  />
                </div>
              </div>

              <div className="field" style={{ marginTop: 14 }}>
                <div className="label">المدة</div>
                <select className="input" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardBody">
              <h2 className="sectionTitle">بيانات السيارة</h2>
              <div className="grid2">
                <div className="field">
                  <div className="label">نوع السيارة</div>
                  <input className="input" value={carType} onChange={(e) => setCarType(e.target.value)} />
                </div>
                <div className="field">
                  <div className="label">رقم اللوحة</div>
                  <input className="input" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
                </div>
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <div className="label">لون السيارة</div>
                <input className="input" value={carColor} onChange={(e) => setCarColor(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <aside className="stickyCard">
          <div className="card">
            <div className="cardBody">
              <h2 className="sectionTitle">ملخص الحجز</h2>
              <div className="kpi noticeDanger" style={{ marginBottom: 12 }}>
                <div className="kpiLabel">تنبيه</div>
                <div className="kpiValue" style={{ fontWeight: 800, lineHeight: 1.7 }}>
                  عند تجاوز الوقت المسموح قد تتعرض <strong>لغرامة</strong>. يُرجى إنهاء الحجز أو التمديد قبل انتهاء الوقت.
                </div>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
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
                  <div className="kpiLabel">الوقت</div>
                  <div className="kpiValue">
                    {dateStr} — {timeStr}
                  </div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">المدة</div>
                  <div className="kpiValue">{duration}</div>
                </div>
                <div className="kpi">
                  <div className="kpiLabel">التكلفة</div>
                  <div className="kpiValue">{amount} ر.س</div>
                </div>
              </div>

              {error ? (
                <p className="danger" style={{ marginTop: 12, marginBottom: 0 }}>
                  {error}
                </p>
              ) : null}

              <button type="button" className="btn btnPrimary" style={{ width: '100%', marginTop: 14 }} onClick={goPayment}>
                متابعة للدفع
              </button>
              <p className="muted" style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7 }}>
                بعد التحقق من الموقف وبيانات السيارة ستنتقل لصفحة الدفع ثم مراجعة كل التفاصيل.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
