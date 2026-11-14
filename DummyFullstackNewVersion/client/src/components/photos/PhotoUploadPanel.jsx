import React from 'react';
// Components
import MapPanel from '@/components/map/MapPanel';
import PhotoUploader from './PhotoUploader';
// Utils
import { countryName } from '@/utils/map/countries';

// Adding photos from the map page (optionally starting from one country).
function PhotoUploadPanel({ mapId, countryCode, onUploaded, onClose }) {
  return (
    <MapPanel title={countryCode ? `Add photos: ${countryName(countryCode)}` : 'Add photos'} onClose={onClose}>
      <PhotoUploader mapId={mapId} defaultCountryCode={countryCode} onUploaded={onUploaded} />
    </MapPanel>
  );
}

export default PhotoUploadPanel;
