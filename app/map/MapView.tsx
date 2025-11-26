"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
// react-leaflet은 클라이언트 사이드에서만 로드해야 안전합니다.
import dynamic from "next/dynamic";
import type { Icon, LatLngLiteral } from "leaflet"; // 진짜 타입 가져오기

// 1. react-leaflet 컴포넌트들을 동적(Dynamic)으로 로딩해서 서버 사이드 렌더링(SSR) 에러 방지
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
const MapClickHandler = dynamic(
  () => import("./MapClickHandler"), // 아래에서 파일을 분리해야 함
  { ssr: false }
);

// 마커 정보 타입 정의
type MarkerInfo = {
  id: number;
  position: LatLngLiteral;
  note: string;
};

// 회색 타일 이미지 (Placeholder)
const placeholderTile =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Crect width='256' height='256' fill='%234a4a4a'/%3E%3C/svg%3E";

export default function MapView() {
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [redPinIcon, setRedPinIcon] = useState<Icon | null>(null);

  useEffect(() => {
    // Leaflet 라이브러리를 비동기로 가져와서 아이콘 생성
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

  // 아이콘이 로드되지 않았으면 로딩 화면 표시
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
            
            {/* 
               주의: MapClickHandler는 useMapEvents 훅을 사용하므로 
               반드시 별도 파일로 분리하거나, 아래 로직을 MapEvents 컴포넌트로 빼야 합니다.
               Vercel 빌드 오류를 피하기 위해 이번에는 인라인 컴포넌트로 처리합니다.
            */}
            <MapEventsHandler addMarker={addMarker} />

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

// 이 컴포넌트는 지도 이벤트를 처리합니다. 
// Leaflet이 로드된 후 실행되도록 Dynamic Import 안에서 사용되어야 합니다.
// 하지만 편의상 여기서 정의하고, 아래에서 dynamic import 없이 사용하되
// MapContainer 내부에서만 렌더링되게 하여 에러를 피합니다.
import { useMapEvents } from "react-leaflet";

function MapEventsHandler({ addMarker }: { addMarker: (pos: LatLngLiteral) => void }) {
  useMapEvents({
    click(e) {
      addMarker(e.latlng);
    },
  });
  return null;
}
