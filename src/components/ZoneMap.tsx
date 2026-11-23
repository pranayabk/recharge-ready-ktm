import type { PathOptions } from 'leaflet';
import { useEffect } from 'react';
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Polygon,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { KTM_ZONES, type ZoneMetadata } from '../engine/zoneLookup';

const KTM_CENTER: [number, number] = [27.7, 85.35];

interface Props {
  lat: number;
  lng: number;
  /** Changes whenever the map should fly to the current point (e.g. preset selected). */
  focusKey: number;
  roofPolygon: [number, number][] | null;
  onPick: (lat: number, lng: number) => void;
}

function ClickHandler({ onPick }: { onPick: Props['onPick'] }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FlyTo({ lat, lng, focusKey }: { lat: number; lng: number; focusKey: number }) {
  const map = useMap();
  useEffect(() => {
    if (focusKey > 0) map.flyTo([lat, lng], 17, { duration: 1.2 });
    // only react to explicit focus requests, not every click
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);
  return null;
}

const zoneStyle = (feature?: { properties?: ZoneMetadata }): PathOptions => ({
  color: feature?.properties?.color ?? '#64748b',
  fillColor: feature?.properties?.color ?? '#64748b',
  weight: 1.5,
  fillOpacity: 0.18,
});

export function ZoneMap({ lat, lng, focusKey, roofPolygon, onPick }: Props) {
  return (
    <div className="relative h-full w-full">
      <MapContainer center={KTM_CENTER} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          data={KTM_ZONES}
          style={zoneStyle}
          onEachFeature={(f, layer) => layer.bindTooltip(f.properties.zoneName, { sticky: true })}
        />
        {roofPolygon && (
          <Polygon positions={roofPolygon} pathOptions={{ color: '#0f172a', weight: 2, fillOpacity: 0.35 }} />
        )}
        <CircleMarker
          center={[lat, lng]}
          radius={8}
          pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#0284c7', fillOpacity: 1 }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            Property
          </Tooltip>
        </CircleMarker>
        <ClickHandler onPick={onPick} />
        <FlyTo lat={lat} lng={lng} focusKey={focusKey} />
      </MapContainer>

      <div className="pointer-events-none absolute bottom-6 left-3 z-[1000] rounded-md bg-white/95 p-2 text-xs shadow-md">
        <p className="mb-1 font-semibold text-slate-700">Hydrogeological zones</p>
        {[...KTM_ZONES.features.map((f) => f.properties), KTM_ZONES.fallback].map((z) => (
          <div key={z.zoneId} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: z.color }} />
            <span className="text-slate-600">
              {z.zoneName.replace(/\s*\(.*\)/, '')} ×{z.infiltrationMultiplier}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
