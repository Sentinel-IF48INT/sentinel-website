// components/demo.tsx
"use client";

import { Map, MapMarker, MarkerContent, MarkerTooltip, MarkerLabel } from "@/components/ui/mapcn-marker-content";
import { MapPin, Navigation } from "lucide-react";

const locations = [
  {
    id: 1,
    name: "Empire State Building",
    lng: -73.9857,
    lat: 40.7484,
    image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: 2,
    name: "Central Park",
    lng: -73.9654,
    lat: 40.7829,
    image: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: 3,
    name: "Times Square",
    lng: -73.9851,
    lat: 40.758,
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80",
  },
];

function MarkerContentDemo() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-8 text-foreground">
      <div className="h-[420px] w-full max-w-4xl overflow-hidden rounded-lg border shadow-sm">
        <Map center={[-73.9857, 40.7484]} zoom={11}>
          {locations.map((location) => (
            <MapMarker key={location.id} longitude={location.lng} latitude={location.lat}>
              <MarkerContent>
                <div
                  data-mapcn-marker={location.name}
                  className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-lg transition-transform hover:scale-110"
                >
                  <MapPin className="size-3.5" />
                </div>
                <MarkerLabel position="bottom" className="rounded bg-slate-900/80 px-1.5 py-0.5 text-white">
                  {location.name}
                </MarkerLabel>
              </MarkerContent>
              <MarkerTooltip className="p-2">
                <div className="flex items-center gap-2">
                  <img
                    src={location.image}
                    alt={location.name}
                    className="size-10 rounded object-cover"
                  />
                  <div>
                    <p className="font-bold">{location.name}</p>
                    <p className="flex items-center gap-1 text-[10px] opacity-80">
                      <Navigation className="size-2.5" /> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </MarkerTooltip>
            </MapMarker>
          ))}
        </Map>
      </div>
    </div>
  );
}

export default function MarkerContentDefaultDemo() {
  return <MarkerContentDemo />;
}

export { MarkerContentDefaultDemo };