// src/components/dialogs/ConfirmRemovePlaylistDialog.tsx
import React, { useContext } from "react";
// import CommonDialog from '../dialog/CommonDialog';
import CommonDialog from "@/components/dialog/CommonDialog";
import { truncate } from "@/utils/truncate";
import { removePlaylist } from "@/utils/playlists";
import { MainStoreContext, useMainStore } from "@/context/MainStoreContext";
import invariant from "tiny-invariant";

const ConfirmRemovePlaylistDialog: React.FC = () => {
  const { removePlaylistDialogOpen, setRemovePlaylistDialogOpen } =
    useMainStore();
  // const main = useContext(MainStoreContext);

  const onSubmitHandler = () => {
    invariant(
      removePlaylistDialogOpen !== null,
      "Playlist to remove is not set"
    );

    // Data will be defined here, no need to check for null
    // removePlaylist(removePlaylistDialog.id, removePlaylistDialogOpen.name);
    setRemovePlaylistDialogOpen(null);
  };

  return (
    <CommonDialog
      open={!!removePlaylistDialogOpen}
      onClose={() => setRemovePlaylistDialogOpen(null)}
      title={`Are you sure you want to remove the playlist?`}
      buttons={[{ title: "Cancel" }, { title: "Remove", type: "submit" }]}
      onSubmit={onSubmitHandler}
      renderChildren={(props) => (
        <p>confirmRemovePlaylistDialog renderChildren :)</p>
      )}
    ></CommonDialog>
  );
};

export default ConfirmRemovePlaylistDialog;
