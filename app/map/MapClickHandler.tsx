"use client";

import { useMapEvents } from "react-leaflet";
import type { LatLngLiteral } from "leaflet";

type Props = {
  addMarker: (pos: LatLngLiteral) => void;
};

const MapClickHandler = ({ addMarker }: Props) => {
  useMapEvents({
    click(e) {
      addMarker(e.latlng);
    },
  });
  return null;
};

export default MapClickHandler;
