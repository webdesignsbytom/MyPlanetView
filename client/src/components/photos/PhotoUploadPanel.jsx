import React from 'react';
// Components
import MapPanel from '@/components/map/MapPanel';
import PhotoUploader from './PhotoUploader';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
// Utils
import { countryName } from '@/utils/map/countries';

// Adding photos from the map page (optionally starting from one country). `locked`: the
// email address isn't verified yet, so it says that instead of offering the uploader.
// `uploadRules`, `photoCounts` and `videoCounts` are the map's (its owner's plan: a map
// that isn't paid for takes no photos, Economy keeps print copies, each country has a cap,
// and First Class takes videos, with a cap of their own).
// `onBatchDone` runs once each batch of photos has finished (the map then checks badges and goals).
function PhotoUploadPanel({
  mapId,
  countryCode,
  locked = false,
  uploadRules = null,
  photoCounts = null,
  videoCounts = null,
  isOwner = false,
  onUploaded,
  onBatchDone,
  onClose,
}) {
  return (
    <MapPanel title={countryCode ? `Add photos: ${countryName(countryCode)}` : 'Add photos'} onClose={onClose}>
      {locked ? (
        <VerifyFirstNote action='add photos' />
      ) : (
        <PhotoUploader
          mapId={mapId}
          defaultCountryCode={countryCode}
          uploadRules={uploadRules}
          photoCounts={photoCounts}
          videoCounts={videoCounts}
          isOwner={isOwner}
          onUploaded={onUploaded}
          onBatchDone={onBatchDone}
        />
      )}
    </MapPanel>
  );
}

export default PhotoUploadPanel;
