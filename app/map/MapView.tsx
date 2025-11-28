"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic"; // 서버 에러 방지용 도구
import type { Icon, LatLngLiteral } from "leaflet"; // 진짜 타입 가져오기

// 1. 지도 부품들을 "나중에 로딩해줘(Dynamic)"라고 설정하기
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
// 방금 1단계에서 만든 파일을 여기서 가져오는 겁니다!
const MapClickHandler = dynamic(
  () => import("./MapClickHandler"), 
  { ssr: false }
);

// 마커 정보 타입 정의
type MarkerInfo = {
  id: number;
  position: LatLngLiteral;
  note: string;
};

const placeholderTile =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect width='256' height='256' fill='%234a4a4a'/%3E%3C/svg%3E";

export default function MapView() {
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [redPinIcon, setRedPinIcon] = useState<Icon | null>(null);

  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      const icon = L.icon({
        iconUrl:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 48'%3E%3Cpath fill='%23ff3b30' d='M16 0C7.16 0 0 7.16 0 16c0 10.62 16 32 16 32s16-21.38 16-32C32 7.16 24.84 0 16 0z'/%3E%3Ccircle cx='16' cy='16' r='6' fill='%23fff'/%3E%3C/svg%3E",
        iconSize: [32, 48],
        iconAnchor: [16, 48],
        popupAnchor: [0, -46],
      });
      setRedPinIcon(icon);
    })();
  }, []);

  const addMarker = (position: LatLngLiteral) => {
    setMarkers((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), position, note: "여기에 적 출현!" },
    ]);
  };

  const updateNote = (id: number, note: string) => {
    setMarkers((prev) =>
      prev.map((marker) => (marker.id === id ? { ...marker, note } : marker))
    );
  };

  if (!redPinIcon) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-gray-400">
        전장 데이터를 초기화하는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black px-6 py-16 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-yellow-400">
            Delta Ops
          </p>
          <h1 className="mt-2 text-4xl font-bold text-white">전략 지도 분석</h1>
          <p className="mt-3 text-sm text-gray-400">
            임시 회색 전장 위 아무 지점을 클릭해 적 위치를 기록하고, 마커를 눌러
            메모를 남겨 보세요.
          </p>
        </div>

        <div className="relative h-[70vh] w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
          <MapContainer
            center={{ lat: 37.57, lng: 126.98 }}
            zoom={5}
            zoomControl={false}
            scrollWheelZoom
            className="h-full w-full"
            style={{ backgroundColor: "#3f3f3f" }}
          >
            <TileLayer url={placeholderTile} />
            <MapClickHandler addMarker={addMarker} />
            {markers.map((marker) => (
              <Marker
                key={marker.id}
                position={marker.position}
                icon={redPinIcon}
              >
                <Popup>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-red-600">
                      적 출현 지점
                    </p>
                    <textarea
                      className="h-16 w-48 rounded-md border border-gray-200 p-2 text-xs text-black"
                      value={marker.note}
                      onChange={(e) => updateNote(marker.id, e.target.value)}
                    />
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
