import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MOCK_BATCHES, getBatchColor } from "@/utils/mockData";

interface MapPickerProps {
  className?: string;
}

const ICON_SIZE = 36;

function createIcon(index: number, label: string): L.DivIcon {
  const color = getBatchColor(index);
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;width:${ICON_SIZE}px;height:${ICON_SIZE}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer">${label.slice(0, 1)}</div>`,
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
  });
}

export default function MapPicker({ className = "" }: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [40.758, -73.985],
      zoom: 12,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    MOCK_BATCHES.filter((b) => b.active).forEach((batch, i) => {
      const marker = L.marker([batch.gps.lat, batch.gps.lng], {
        icon: createIcon(i, batch.title),
      }).addTo(map);

      marker.bindPopup(
        `<div style="font-family:sans-serif;min-width:160px">
          <strong style="font-size:14px">${batch.title}</strong><br/>
          <span style="color:#666;font-size:12px">$${batch.price} ${batch.paymentAsset}</span><br/>
          <span style="font-size:11px;color:#999">${batch.condition} · ${batch.category}</span>
        </div>`
      );
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className={`w-full h-full rounded-xl overflow-hidden ${className}`} />;
}
