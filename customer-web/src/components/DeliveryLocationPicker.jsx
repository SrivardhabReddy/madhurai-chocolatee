import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Compass, Search, CheckCircle, AlertCircle, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function DeliveryLocationPicker({ onLocationSelect, currentPincode, initialCity }) {
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedAddressPreview, setSelectedAddressPreview] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Default fallback coords: Nellore / Andhra Pradesh express hub
  const defaultCoords = [14.4426, 79.9865];

  // Custom chocolate & gold Pin Icon
  const createPinIcon = () => {
    return L.divIcon({
      className: 'madhurai-custom-pin',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: #2D150B;
          border: 3px solid #D97706;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(45, 21, 11, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 10px; height: 10px; background: #FFFBEB; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  // Reverse geocode lat/lng to Indian Address & Pincode
  const reverseGeocode = async (lat, lng) => {
    setReverseLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: { 'User-Agent': 'MadhuraiChocolateDelivery/1.0' }
      });
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const pincode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : '';
        const city = addr.city || addr.town || addr.county || addr.district || '';
        const district = addr.state_district || addr.county || city;
        const state = addr.state || 'Andhra Pradesh';
        const area = addr.suburb || addr.neighbourhood || addr.village || '';
        const street = addr.road || addr.residential || area;

        const info = {
          pincode,
          city,
          district,
          state,
          area,
          street,
          displayName: data.display_name,
          lat,
          lng
        };

        setSelectedAddressPreview(info);
        return info;
      }
    } catch (err) {
      console.warn('Reverse geocode note:', err);
    } finally {
      setReverseLoading(false);
    }
    return null;
  };

  // Handle GPS / Current Location Detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setStatusMsg({ text: 'Geolocation is not supported by your browser.', type: 'error' });
      return;
    }

    setLocating(true);
    setStatusMsg({ text: 'Accessing GPS location...', type: 'info' });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const addrInfo = await reverseGeocode(latitude, longitude);

        if (addrInfo && addrInfo.pincode) {
          onLocationSelect(addrInfo);
          setStatusMsg({
            text: `📍 Located: ${addrInfo.city || 'Location'}, ${addrInfo.state} (${addrInfo.pincode})`,
            type: 'success'
          });

          // If map is open, pan to new location
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 16);
            markerRef.current.setLatLng([latitude, longitude]);
          }
        } else {
          setStatusMsg({
            text: 'Location detected. Please review/enter your 6-digit delivery pincode.',
            type: 'info'
          });
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        let errorText = 'Unable to retrieve location. Please select on the map or type address manually.';
        if (err.code === 1) {
          errorText = 'Location permission denied. You can pin your location on the map below.';
        } else if (err.code === 2) {
          errorText = 'Location unavailable. Please select your location on the map.';
        }
        setStatusMsg({ text: errorText, type: 'error' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Initialize or re-center Leaflet Map when toggled open
  useEffect(() => {
    if (!mapOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCoords,
        zoom: 14,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      const marker = L.marker(defaultCoords, {
        draggable: true,
        icon: createPinIcon()
      }).addTo(map);

      // On pin drag
      marker.on('dragend', async (e) => {
        const pos = e.target.getLatLng();
        await reverseGeocode(pos.lat, pos.lng);
      });

      // On click anywhere on map
      map.on('click', async (e) => {
        marker.setLatLng(e.latlng);
        await reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Trigger initial reverse geocode
      reverseGeocode(defaultCoords[0], defaultCoords[1]);
    }

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [mapOpen]);

  // Clean up map instance on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Search locality / area on map
  const handleMapSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(searchQuery.trim())}`, {
        headers: { 'User-Agent': 'MadhuraiChocolateDelivery/1.0' }
      });
      const results = await res.json();
      if (results && results.length > 0) {
        const first = results[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
          await reverseGeocode(lat, lng);
        }
      } else {
        alert('Area or landmark not found. Please try another nearby location.');
      }
    } catch (err) {
      console.warn('Map search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Confirm selected map pin
  const handleConfirmMapLocation = () => {
    if (selectedAddressPreview) {
      onLocationSelect(selectedAddressPreview);
      setStatusMsg({
        text: `📍 Location set: ${selectedAddressPreview.city || 'Selected Area'}, ${selectedAddressPreview.state} (${selectedAddressPreview.pincode || 'Pincode'})`,
        type: 'success'
      });
      setMapOpen(false);
    }
  };

  return (
    <div style={{ marginBottom: '18px' }}>
      {/* Action Bar: Detect Location & Pin on Map Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={locating}
          className="btn btn-outline btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#FFFBEB',
            borderColor: '#FDE68A',
            color: '#B45309',
            fontWeight: '700',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <Navigation size={15} className={locating ? 'spin' : ''} />
          <span>{locating ? 'Detecting GPS...' : '📍 Use My Current Location'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMapOpen(prev => !prev)}
          className="btn btn-outline btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: mapOpen ? '#EFF6FF' : '#FFFFFF',
            borderColor: mapOpen ? '#93C5FD' : 'var(--border-medium)',
            color: mapOpen ? '#1D4ED8' : 'var(--cacao-950)',
            fontWeight: '600',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <MapPin size={15} color={mapOpen ? '#1D4ED8' : 'var(--peanut-gold-700)'} />
          <span>{mapOpen ? 'Hide Interactive Map' : '🗺️ Pin on Map / Manual Mapping'}</span>
        </button>
      </div>

      {/* Status Notice Banner */}
      {statusMsg.text && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: statusMsg.type === 'error' ? '#FEE2E2' : statusMsg.type === 'success' ? '#DCFCE7' : '#EFF6FF',
          color: statusMsg.type === 'error' ? '#B91C1C' : statusMsg.type === 'success' ? '#15803D' : '#1D4ED8',
          border: `1px solid ${statusMsg.type === 'error' ? '#FCA5A5' : statusMsg.type === 'success' ? '#86EFAC' : '#BFDBFE'}`
        }}>
          {statusMsg.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
          <span style={{ flex: 1 }}>{statusMsg.text}</span>
          <button type="button" onClick={() => setStatusMsg({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Interactive Map Section */}
      {mapOpen && (
        <div style={{
          marginTop: '14px',
          padding: '14px',
          backgroundColor: '#F8FAFC',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid #CBD5E1',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--cacao-950)' }}>
              🎯 Click or drag the pin to your exact delivery location:
            </span>

            {/* Quick search input */}
            <form onSubmit={handleMapSearch} style={{ display: 'flex', gap: '6px', width: '100%', maxWidth: '320px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area, road, landmark..."
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={searching}
                className="btn btn-sm btn-dark"
                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
              >
                {searching ? '...' : <Search size={13} />}
              </button>
            </form>
          </div>

          {/* Leaflet Map Mount Point */}
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '280px',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              border: '1px solid var(--border-medium)',
              zIndex: 10
            }}
          />

          {/* Selected Location Details & Confirmation */}
          <div style={{
            marginTop: '10px',
            padding: '10px 12px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-medium)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>
                Selected Pin Location:
              </span>
              <span style={{ fontSize: '0.84rem', color: 'var(--cacao-950)', fontWeight: '600' }}>
                {reverseLoading
                  ? 'Fetching address coordinates...'
                  : selectedAddressPreview?.displayName || 'Move pin to your address'}
              </span>
              {selectedAddressPreview?.pincode && (
                <span style={{ display: 'inline-block', marginLeft: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#166534', backgroundColor: '#DCFCE7', padding: '1px 6px', borderRadius: '4px' }}>
                  Pincode: {selectedAddressPreview.pincode}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleConfirmMapLocation}
              disabled={reverseLoading || !selectedAddressPreview}
              className="btn btn-sm btn-gold"
              style={{ padding: '7px 14px', fontWeight: '700', fontSize: '0.82rem' }}
            >
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
