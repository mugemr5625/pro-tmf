import React, { useState } from 'react';
import { Modal, Button, Tag } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import locationsData from './locations.json';

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const GOOGLE_MAPS_API_KEY = "AIzaSyBqZO5W2UKl7m5gPxh0_KIjaRckuJ7VUsE";

// Marker colors and labels based on location_type
const getMarkerConfig = (locationType) => {
  const configs = {
    tiffin: {
      color: '#FFD700',
      label: '🌅 Breakfast',
      tagColor: 'gold',
      icon: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
    },
    lunch: {
      color: '#FF6347',
      label: '☀️ Lunch',
      tagColor: 'orange',
      icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
    },
    dinner: {
      color: '#4169E1',
      label: '🌙 Dinner',
      tagColor: 'blue',
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    },
    all: {
      color: '#32CD32',
      label: '🍽️ All Meals',
      tagColor: 'green',
      icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
    }
  };
  return configs[locationType] || configs.all;
};

const LocationsMapModal = ({ visible, onClose, locations }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Calculate center based on all locations
  const center = {
    lat: locations.reduce((sum, loc) => sum + loc.loc_coordinates[0], 0) / locations.length,
    lng: locations.reduce((sum, loc) => sum + loc.loc_coordinates[1], 0) / locations.length
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EnvironmentOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
          <span style={{ fontSize: '18px' }}>Hotel Locations Map</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>
      ]}
    >
      

      <LoadScript 
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        onLoad={() => setIsMapLoaded(true)}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
        >
          {isMapLoaded && locations.map((location) => {
            const config = getMarkerConfig(location.location_type);
            const position = {
              lat: location.loc_coordinates[0],
              lng: location.loc_coordinates[1]
            };

            return (
              <React.Fragment key={location['seq.id']}>
                <Marker
                  position={position}
                  icon={{
                    url: config.icon,
                    scaledSize: window.google?.maps ? new window.google.maps.Size(40, 40) : undefined
                  }}
                  onClick={() => setSelectedMarker(location)}
                  title={location.location_name}
                />
                
                {selectedMarker && selectedMarker['seq.id'] === location['seq.id'] && (
                 <InfoWindow
  position={position}
  onCloseClick={() => setSelectedMarker(null)}
>
  <div style={{ padding: '8px', minWidth: '220px' }}>
    <h3 style={{ margin: '0 0 8px 0', color: '#1890ff' }}>
      {location.location_name || 'NA'}
    </h3>

    <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
      <p style={{ margin: '4px 0' }}>
        <strong>Seq ID:</strong> {location['seq.id'] ?? 'NA'}
      </p>

      <p style={{ margin: '4px 0' }}>
        <strong>Type:</strong>{' '}
        <Tag color={config.tagColor}>
          {config.label || 'NA'}
        </Tag>
      </p>

      <p style={{ margin: '4px 0' }}>
        <strong>District:</strong> {location.District || 'NA'}
      </p>

      <p style={{ margin: '4px 0' }}>
        <strong>Coordinates:</strong><br />
        {location.loc_coordinates?.[0] ?? 'NA'},
        {' '}
        {location.loc_coordinates?.[1] ?? 'NA'}
      </p>

      <p style={{ margin: '4px 0' }}>
        <strong>Commencement Year:</strong>{' '}
        {location.commencement_year ?? 'NA'}
      </p>

      <p style={{ margin: '4px 0' }}>
        <strong>Created By:</strong>{' '}
        {Array.isArray(location.created_by) && location.created_by.length > 0
          ? location.created_by.join(', ')
          : 'NA'}
      </p>
    </div>
  </div>
</InfoWindow>

                )}
              </React.Fragment>
            );
          })}
        </GoogleMap>
      </LoadScript>
    </Modal>
  );
};

const LandingPage = () => {
  const [mapModalVisible, setMapModalVisible] = useState(false);

  return (
    <div style={{ 
     
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
       
      }}>
       
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Button
            type="primary"
            size="medium"
            icon={<EnvironmentOutlined />}
            onClick={() => setMapModalVisible(true)}
            style={{
              height: '60px',
              fontSize: '18px',
            }}
          >
            View Map
          </Button>
        </div>

       
       
      </div>

      {/* Map Modal */}
      <LocationsMapModal
        visible={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        locations={locationsData}
      />
    </div>
  );
};

export default LandingPage;