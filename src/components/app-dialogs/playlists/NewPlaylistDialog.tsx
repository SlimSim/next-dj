"use client";

import React, { useState } from "react";
import CommonDialog from "@/components/dialog/CommonDialog";
import { createPlaylist } from "@/utils/playlists";
import { useMainStore } from "@/context/MainStoreContext";
// import { useMainStore } from "../../stores/main-store";

const NewPlaylistDialog = () => {
  const main = useMainStore();
  if (!main) {
    throw new Error("No context found, main is null");
  }
  const [open, setOpen] = useState(main.createNewPlaylistDialogOpen);

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;

    await createPlaylist(name);
    setOpen(false);
  };

  return (
    <CommonDialog
      open={open}
      icon={<span>Add Playlist Icon</span>}
      title="Create New Playlist"
      buttons={[{ title: "Cancel" }, { title: "Create", type: "submit" }]}
      onSubmit={onSubmitHandler}
      renderChildren={(props) => <p>NewPlaylistDialog renderChildren</p>}
    >
      {/* {() => ( */}
      <input
        name="name"
        placeholder="New playlist name"
        required
        minLength={4}
        maxLength={40}
      />
      {/* )} */}
    </CommonDialog>
  );
};

export default NewPlaylistDialog;
