import React from 'react';
import NewPlaylistDialog from './playlists/NewPlaylistDialog';
import ConfirmRemovePlaylistDialog from './playlists/ConfirmRemovePlaylistDialog';
import EditPlaylistDialog from './playlists/EditPlaylistDialog';
import AddToPlaylistDialog from './playlists/AddToPlaylistDialog';

const PlaylistDialogs = () => {
  return (
    <>
      <NewPlaylistDialog />
      <EditPlaylistDialog />
      <ConfirmRemovePlaylistDialog />
      <AddToPlaylistDialog />
    </>
  );
};

export default PlaylistDialogs;