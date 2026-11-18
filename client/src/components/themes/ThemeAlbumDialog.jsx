import React, { Suspense, useState } from 'react';
// Hooks
import useThemeAlbum from '@/hooks/useThemeAlbum';
// Components
import Modal from '@/components/common/Modal';
import PhotoGrid from '@/components/photos/PhotoGrid';
import { PhotoViewer } from '@/components/map/lazyMapPanels';
// Utils
import { monthLabel } from '@/utils/themes/themeWords';

/**
 * One monthly theme's album on a map (docs/API.md, "Photo themes"): the photos its people
 * entered, newest first, each opening in the photo viewer, where an editor takes one out
 * (it then leaves the album). Viewers and share links (`shareCode`) see the album without
 * hidden photos. `onChanged` after a photo goes in or out.
 */
function ThemeAlbumDialog({ theme, mapId = null, shareCode = null, canEdit = false, locked = false, onChanged, onClose }) {
  const album = useThemeAlbum({ mapId, shareCode, themeId: theme.id });
  const [openId, setOpenId] = useState(null);

  return (
    <Modal title={`${theme.title}: ${monthLabel(theme.month)}`} onClose={onClose} wide>
      {theme.blurb ? <p className='text-sm'>{theme.blurb}</p> : null}
      <PhotoGrid
        photos={album.photos}
        loading={album.loading}
        error={album.error}
        hasMore={Boolean(album.nextCursor)}
        onLoadMore={album.loadMore}
        onOpen={(photo) => setOpenId(photo.id)}
        emptyText='No photos in this album.'
      />
      {openId ? (
        <Suspense fallback={null}>
          <PhotoViewer
            photoId={openId}
            photo={album.photos.find((p) => p.id === openId) || null}
            list={{ photos: album.photos }}
            shareCode={shareCode}
            canEdit={(canEdit || locked) && !shareCode}
            locked={locked}
            onChanged={(changed) => {
              // Taken out of this theme: it leaves the album
              if (changed?.themes && !changed.themes.some((t) => t.id === theme.id)) album.removePhoto(changed.id);
              else if (changed?.id) album.replacePhoto(changed);
              onChanged?.();
            }}
            onDeleted={() => {
              album.removePhoto(openId);
              setOpenId(null);
              onChanged?.();
            }}
            onClose={() => setOpenId(null)}
          />
        </Suspense>
      ) : null}
    </Modal>
  );
}

export default ThemeAlbumDialog;
