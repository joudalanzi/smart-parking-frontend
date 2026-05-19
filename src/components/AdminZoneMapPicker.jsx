import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [24.714, 46.6755];

function MapClickHandler({ onPick, interactive }) {
  useMapEvents({
    click(e) {
      if (interactive) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * خريطة: انقر لوضع أو نقل العلامة.
 * @param {object} props
 * @param {boolean} [props.interactive=true] — إن false تُستخدم معاينة فقط (لا نقرة).
 * @param {number} [props.radiusMeters] — عرض دائرة نصف القطر بالأمتار عند وجود نقطة.
 */
export default function AdminZoneMapPicker({
  latitude,
  longitude,
  onPick,
  height = 240,
  radiusMeters,
  interactive = true,
  hintText = 'انقر على الخريطة لتحديد مركز المنطقة',
}) {
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
  }, []);

  const pos =
    latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude)
      ? [latitude, longitude]
      : null;
  const center = pos || DEFAULT_CENTER;

  const r = Number(radiusMeters);
  const showCircle = Boolean(pos && Number.isFinite(r) && r > 0);

  return (
    <div
      className={`adminMapPicker ${interactive ? 'adminMapPicker--interactive' : 'adminMapPicker--preview'}`}
      style={{ height, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}
    >
      {interactive && !pos ? (
        <div className="adminMapPickerHint" role="status">
          {hintText}
        </div>
      ) : null}
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={interactive}
        dragging
        doubleClickZoom={interactive}
      >
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler onPick={onPick} interactive={interactive} />
        {showCircle ? (
          <Circle
            center={pos}
            radius={r}
            pathOptions={{
              color: '#47e6ff',
              fillColor: '#47e6ff',
              fillOpacity: 0.11,
              weight: 2,
              opacity: 0.9,
            }}
          />
        ) : null}
        {pos ? <Marker position={pos} /> : null}
      </MapContainer>
    </div>
  );
}
