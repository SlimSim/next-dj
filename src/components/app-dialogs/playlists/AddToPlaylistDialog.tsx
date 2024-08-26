import React from "react";
import Separator from "@/components/Separator";
import Dialog from "@/components/dialog/Dialog";
import DialogFooter from "@/components/dialog/DialogFooter";
import { useMainStore } from "@/context/MainStoreContext";
import AddToPlaylistDialogContent from "./AddToPlaylistDialogContent";

const AddToPlaylistDialog: React.FC = () => {
  const {
    state,
    setAddTrackToPlaylistDialogOpen,
    setCreateNewPlaylistDialogOpen,
  } = useMainStore();

  return (
    <Dialog
      open={!!state.addTrackToPlaylistDialogOpen}
      onClose={() => setAddTrackToPlaylistDialogOpen(null)}
      title="Add to playlist"
    >
      {state.addTrackToPlaylistDialogOpen && (
        <>
          <AddToPlaylistDialogContent
            trackId={Number(state.addTrackToPlaylistDialogOpen.trackId)}
            onClose={() => setAddTrackToPlaylistDialogOpen(null)}
          />
          <Separator />
        </>
      )}
      <DialogFooter
        buttons={[
          {
            title: "Create New Playlist",
            align: "left",
            type: "button",
            action: () => {
              setCreateNewPlaylistDialogOpen(true);
            },
          },
          { title: "Cancel" },
        ]}
        onClose={() => setAddTrackToPlaylistDialogOpen(null)}
      />
    </Dialog>
  );
};

export default AddToPlaylistDialog;
