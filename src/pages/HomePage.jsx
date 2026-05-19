import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

const DEFAULT_CENTER = [24.714, 46.6755];

export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [zones, setZones] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
  }, []);

  const loadMapZones = useCallback(async () => {
    try {
      const data = await apiFetch('/api/map-zones');
      const list = data?.zones || [];
      setZones(list);
      setSelectedId(null);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر تحميل المناطق');
    }
  }, []);

  useEffect(() => {
    loadMapZones();
  }, [loadMapZones]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') loadMapZones();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [loadMapZones]);

  const selected = useMemo(() => zones.find((z) => z.id === selectedId), [zones, selectedId]);

  const center = useMemo(() => {
    if (selected) return [selected.latitude, selected.longitude];
    return DEFAULT_CENTER;
  }, [selected]);

  const goReserve = () => {
    if (!selected) return;
    if (!isLoggedIn) {
      navigate('/auth', { state: { from: '/reservation' } });
      return;
    }
    navigate('/reservation', { state: { preselectedZone: selected.name, fromMap: true } });
  };

  return (
    <div>
      <section className="hero">
        <div className="card">
          <div className="cardBody">
            <h1 className="title">احجز موقفك قبل الوصول</h1>
            <p className="subtitle">
              <strong>صفَّة</strong> يساعدك تختار منطقة المواقف من الخريطة، ثم تحجز وتستلم تذكرتك.
              <br />
              التجربة هنا ويب بروفيشنل — والباك إند هو نفس الـ API.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <button type="button" className="btn btnPrimary" onClick={goReserve} disabled={!selected}>
                احجز الآن
              </button>
              <span className="chip">
                المنطقة المختارة: <strong style={{ color: 'var(--text)' }}>{selected?.name || '—'}</strong>
              </span>
            </div>
            {!selected ? (
              <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
                اختر منطقة من الخريطة أولًا لفتح زر الحجز.
              </p>
            ) : null}

            {error ? <p className="danger" style={{ marginTop: 12, marginBottom: 0 }}>{error}</p> : null}
          </div>
        </div>

        <div className="card">
          <div className="cardBody">
            <h2 className="sectionTitle">كيف يشتغل؟</h2>
            <p className="muted" style={{ lineHeight: 1.9, marginTop: 0 }}>
              1) اختر المنطقة من الخريطة
              <br />
              2) أدخل بيانات الحجز والسيارة
              <br />
              3) تأكيد — يتم إنشاء الحجز في السيرفر
              <br />
              4) من صفحة «حجزي النشط» تقدر تبدأ/تمدّد/تنهي
            </p>
            {!isLoggedIn ? (
              <div style={{ marginTop: 14 }}>
                <button type="button" className="btn" onClick={() => navigate('/auth', { state: { from: '/reservation' } })}>
                  سجل دخولك للمتابعة
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="cardBody">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <h2 className="sectionTitle" style={{ margin: 0 }}>الخريطة</h2>
            <div className="pillRow">
              {zones.slice(0, 4).map((z) => (
                <button key={z.id} type="button" className={`pill ${selectedId === z.id ? 'pillActive' : ''}`} onClick={() => setSelectedId(z.id)}>
                  {z.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mapWrap">
        <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} key={`${center[0]}-${center[1]}`}>
          <MapQuickControls selected={selected} />
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {zones.map((z) => (
            <Fragment key={z.id}>
              <Marker
                position={[z.latitude, z.longitude]}
                eventHandlers={{
                  click: () => setSelectedId(z.id),
                }}
              >
                <Popup>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <strong>{z.name}</strong>
                    <div>المواقف المتاحة: {z.availableSpots}</div>
                    <button type="button" className="btn btnPrimary" onClick={() => setSelectedId(z.id)}>
                      اختيار هذه المنطقة
                    </button>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[z.latitude, z.longitude]}
                radius={z.radiusMeters || 120}
                pathOptions={{
                  color: z.isReserved ? '#ef4444' : '#22d3ee',
                  fillColor: z.isReserved ? '#ef4444' : '#22d3ee',
                  fillOpacity: 0.08,
                  weight: 2,
                }}
              />
            </Fragment>
          ))}
        </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapQuickControls({ selected }) {
  const map = useMap();

  const goSelected = () => {
    if (!selected) return;
    map.setView([selected.latitude, selected.longitude], Math.max(map.getZoom(), 15), { animate: true });
  };

  const goMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 16, { animate: true });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'grid', gap: 8 }}>
      <button type="button" className="btn" onClick={goSelected} disabled={!selected}>
        ركّز على المنطقة
      </button>
      <button type="button" className="btn" onClick={goMyLocation}>
        موقعي
      </button>
    </div>
  );
}
