"use client";

// src/components/dialogs/EditPlaylistDialog.tsx
import React, { useState, useContext } from "react";
import CommonDialog from "@/components/dialog/CommonDialog";
import TextField from "@/components/TextField";
import { updatePlaylistNameInDatabase } from "@/utils/playlists";
import { MainStoreContext } from "@/context/MainStoreContext";
import invariant from "tiny-invariant";

const EditPlaylistDialog: React.FC = () => {
  const main = useContext(MainStoreContext);
  if (main == undefined || main == null)
    throw new Error("No context found, main is null");
  const data = main.editPlaylistDialogOpen;
  const [name, setName] = useState(data?.name || "");

  const onSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    invariant(data !== null, "Playlist to edit is not set");

    await updatePlaylistNameInDatabase(data.id, name);
    if (main && typeof main.setEditPlaylistDialogOpen === "function") {
      main.setEditPlaylistDialogOpen({ id: 0, name: "" });
    }
  };

  return (
    <CommonDialog
      open={!!main.editPlaylistDialogOpen}
      onClose={() => main.setEditPlaylistDialogOpen({ id: 0, name: "" })}
      icon="addPlaylist"
      title="Edit Playlist Name"
      buttons={[{ title: "Cancel" }, { title: "Save", type: "submit" }]}
      onSubmit={onSubmitHandler}
      renderChildren={(props) => <p>EditPlaylistDialog renderChildren</p>}
    >
      <TextField
        value={name}
        name="name"
        placeholder="Playlist name"
        required
        minLength={4}
        maxLength={40}
        // onChange={(e) => setName(e.target.value)}
      />
    </CommonDialog>
  );
};

export default EditPlaylistDialog;
