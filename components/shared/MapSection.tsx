'use client';

import 'leaflet/dist/leaflet.css';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false }
);

export default function MapSection() {
  const [mounted, setMounted] = useState(false);
  const [icon, setIcon] = useState<any>(null);

  // Your office/location coordinates
  const officeLocation: [number, number] = [
    26.722204573665024,
    85.92817980822076,
  ];

  // User location (optional)
  const [userLocation, setUserLocation] =
    useState<[number, number]>(officeLocation);

  useEffect(() => {
    setMounted(true);

    let mountedFlag = true;

    async function init() {
      const L = await import('leaflet');

      if (!mountedFlag) return;

      const customIcon = new L.Icon({
        iconUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      setIcon(customIcon);
    }

    init();

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (loc) => {
          setUserLocation([
            loc.coords.latitude,
            loc.coords.longitude,
          ]);
        },
        () => {
          console.log('Location access denied');
        }
      );
    }

    return () => {
      mountedFlag = false;
    };
  }, []);

  const handleGetDirection = () => {
    const [lat, lng] = officeLocation;

    // Open Google Maps directions
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank'
    );
  };

  if (!mounted || !icon) {
    return (
      <div className="h-[500px] bg-gray-100 animate-pulse rounded-2xl" />
    );
  }

  return (
    <section className="bg-white py-20 relative z-0">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

        {/* MAP */}
        <div className="h-[500px] rounded-3xl overflow-hidden border shadow-md">
          <MapContainer
            center={officeLocation}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <Marker position={officeLocation} icon={icon}>
              <Popup>
                Our Office 📍
                <br />
                Visit us anytime.
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* TEXT */}
        <div>
          <h2 className="text-4xl font-bold">
            Visit Our Location
          </h2>

          <p className="mt-6 text-gray-600 leading-7">
            We are located in Janakpur, Nepal. Come visit us or
            contact us anytime.
          </p>

          <div className="mt-6 space-y-2 text-gray-700">
            <p>📍 Janakpur, Nepal</p>
            <p>🕒 Open Sunday - Friday</p>
            <p>📞 +977-9817840154</p>
          </div>

          <button
            onClick={handleGetDirection}
            className="mt-8 bg-red-600 hover:bg-red-700 transition text-white px-6 py-3 rounded-xl font-medium"
          >
            Get Direction
          </button>
        </div>

      </div>
    </section>
  );
}