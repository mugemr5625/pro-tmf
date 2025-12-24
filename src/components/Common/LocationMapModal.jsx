import React, { useState, useEffect } from 'react';
import { Modal, Button, notification } from 'antd';
import { EnvironmentOutlined, ReloadOutlined } from '@ant-design/icons';
import { GoogleMap, LoadScript, Marker, Circle } from '@react-google-maps/api';

const mapContainerStyle = {
    width: '100%',
    height: '400px'
};

const GOOGLE_MAPS_API_KEY = "AIzaSyBqZO5W2UKl7m5gPxh0_KIjaRckuJ7VUsE";

/**
 * LocationMapModal - Reusable Google Maps component
 * 
 * @param {boolean} visible - Control modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onConfirm - Callback with selected location (only in editable mode)
 * @param {object} initialLocation - Initial location to display { lat, lng }
 * @param {boolean} editable - Whether user can select/change location (default: true)
 * @param {boolean} showCurrentLocation - Show "Use Current Location" button (default: true)
 */
const LocationMapModal = ({
    visible = false,
    onClose,
    onConfirm,
    initialLocation = null,
    editable = true,
    showCurrentLocation = true,
    title = "Select Customer Location"
}) => {
    const [mapCenter, setMapCenter] = useState(
        initialLocation || { lat: 20.5937, lng: 78.9629 }
    );
    const [selectedLocation, setSelectedLocation] = useState(initialLocation);
    const [currentAccuracy, setCurrentAccuracy] = useState(null);

    // Update map when initialLocation changes
    useEffect(() => {
        if (initialLocation) {
            setMapCenter(initialLocation);
            setSelectedLocation(initialLocation);
        }
    }, [initialLocation]);

    // Reset map center when modal opens
    useEffect(() => {
        if (visible && selectedLocation) {
            const lat = parseFloat(selectedLocation.lat);
            const lng = parseFloat(selectedLocation.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                setMapCenter({ lat, lng });
            }
        } else if (visible && !selectedLocation) {
            setMapCenter({ lat: 20.5937, lng: 78.9629 });
        }
    }, [visible, selectedLocation]);


const getUserCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ message: "Geolocation not supported" });
      return;
    }

    const highAccuracyOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    const lowAccuracyOptions = {
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 10000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        // 🔁 Fallback (Firefox & Android safe)
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (err) => reject(err),
          lowAccuracyOptions
        );
      },
      highAccuracyOptions
    );
  });
};


const handleGetCurrentLocation = async () => {
  notification.info({
    message: "Getting Location",
    description: "Please allow location access…",
    duration: 3,
  });

  try {
    const { lat, lng, accuracy } = await getUserCurrentLocation();

    setSelectedLocation({
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });

    setMapCenter({ lat, lng });
    setCurrentAccuracy(accuracy);

    notification.success({
      message: "Location Found ✅",
      description: `Accuracy: ${accuracy.toFixed(1)} meters`,
      duration: 3,
    });
  } catch (error) {
    let msg = "Unable to get location";
    if (error.code === 1) msg = "Location permission denied";
    if (error.code === 2) msg = "Location unavailable";
    if (error.code === 3) msg = "Location request timeout";

    notification.error({
      message: "Location Error",
      description: msg,
    });
  }
};


 
    const handleMapClick = (e) => {
        if (!editable) return;

        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        setSelectedLocation({
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        });

        setMapCenter({ lat, lng });
    };

    const handleConfirm = () => {
        if (selectedLocation && onConfirm) {
            onConfirm(selectedLocation);
        } else if (!selectedLocation) {
            notification.error({
                message: 'No Location Selected',
                description: 'Please select a location on the map or use current location',
                duration: 3,
            });
        }
    };

    const handleClose = () => {
        setCurrentAccuracy(null);
        if (onClose) onClose();
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <EnvironmentOutlined style={{ color: '#1890ff' }} />
                    <span>{title}</span>
                </div>
            }
            open={visible}
            onCancel={handleClose}
            width={900}
            footer={
                editable ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            {selectedLocation && (
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={() => setSelectedLocation(null)}
                                />
                            )}
                            {showCurrentLocation && (
                                <Button
                                    type="default"
                                    icon={<EnvironmentOutlined />}
                                    onClick={handleGetCurrentLocation}
                                >
                                    Use Current Location
                                </Button>
                            )}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <Button onClick={handleClose}>Cancel</Button>
                            <Button
                                type="primary"
                                onClick={handleConfirm}
                                disabled={!selectedLocation}
                            >
                                Confirm Location
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button onClick={handleClose}>Close</Button>
                )
            }
        >
            {editable && (
                <div style={{ marginBottom: '12px', padding: '10px', background: '#e6f7ff', borderRadius: '4px' }}>
                    <span>! Click Anywhere on the map (or) Click "Use Current Location" button</span>
                </div>
            )}

            {!editable && (
                <div style={{ marginBottom: '12px', padding: '10px', background: '#fff7e6', borderRadius: '4px',alignItems:'center' }}>
                    <span>📍 Viewing customer's saved location</span>
                </div>
            )}

            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={15}
                    onClick={handleMapClick}
                    options={{
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: true,
                        fullscreenControl: true,
                        gestureHandling: 'greedy',
                    }}
                >
                    {selectedLocation && (
                        <Marker
                            position={{
                                lat: parseFloat(selectedLocation.lat),
                                lng: parseFloat(selectedLocation.lng)
                            }}
                            animation={window.google?.maps?.Animation?.DROP}
                        />
                    )}
                    {selectedLocation && currentAccuracy && editable && (
                        <Circle
                            center={{
                                lat: parseFloat(selectedLocation.lat),
                                lng: parseFloat(selectedLocation.lng),
                            }}
                            radius={currentAccuracy}
                            options={{
                                fillOpacity: 0.15,
                                strokeOpacity: 0.4,
                            }}
                        />
                    )}
                </GoogleMap>
            </LoadScript>
        </Modal>
    );
};

export default LocationMapModal;
