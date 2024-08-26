import React, { useContext } from "react";
import {
  useQuery,
  UseQueryResult,
  UseQueryOptions,
} from "@tanstack/react-query";
import ScrollContainer from "@/components/ScrollContainer";
import Separator from "@/components/Separator";
import Icon from "@/components/icon/Icon";
import PlaylistListContainer from "@/components/playlist/PlaylistListContainer";
import { snackbar } from "@/components/snackbar/snackbarLogic";
import { getDB } from "@/utils/db/get-db";
import { toggleTrackInPlaylistInDatabase } from "@/utils/playlists";
import { MainStoreContext } from "@/context/MainStoreContext";
import invariant from "tiny-invariant";
import { getEntityIds } from "@/utils/general";

interface AddToPlaylistDialogContentProps {
  trackId: number;
  onClose: () => void;
}

const AddToPlaylistDialogContent: React.FC<AddToPlaylistDialogContentProps> = ({
  trackId,
  onClose,
}) => {
  const main = useContext(MainStoreContext);

  const query = useQuery({
    queryKey: ["playlists"],
    queryFn: () => getEntityIds("playlists", { sort: "created" }),
    // onError: () => {
    //   snackbar({
    //     id: "playlists-loading",
    //     message: "Failed to load playlists",
    //   });
    //   onClose();
    // },
  });

  const trackPlaylists = useQuery({
    queryKey: ["playlists-track", trackId],
    queryFn: async () => {
      invariant(trackId);

      const db = await getDB();
      const items = await db.getAllFromIndex(
        "playlistsTracks",
        "trackId",
        trackId
      );

      return new Set(items.map((item) => item.playlistId));
    },
    enabled: Boolean(trackId), // Ensure query only runs if trackId is defined
  });

  const isTrackInPlaylist = (playlistId: number) =>
    trackPlaylists.data?.has(playlistId);

  const addToPlaylist = async (playlistId: number) => {
    invariant(trackId, "Track ID is not set");

    await toggleTrackInPlaylistInDatabase(
      !!isTrackInPlaylist(playlistId),
      playlistId,
      trackId
    );
  };

  return (
    <>
      <Separator className="mt-24px" />
      <ScrollContainer className="overflow-auto grow max-h-400px px-8px py-16px">
        {query.isSuccess ? (
          <PlaylistListContainer
            items={query.data}
            onItemClick={(item) => addToPlaylist(item.playlist.id)}
          >
            {query.data.map((playlist) => {
              // const isInPlaylist = isTrackInPlaylist(playlist.id);
              const isInPlaylist = isTrackInPlaylist(playlist);
              return (
                <div
                  // key={playlist.id}
                  key={playlist}
                  className={`rounded-full border-2 size-24px flex items-center justify-center ${
                    isInPlaylist
                      ? "border-primary bg-primary text-onPrimary"
                      : "border-neutral"
                  }`}
                >
                  {isInPlaylist && <Icon type="check" />}
                </div>
              );
            })}
          </PlaylistListContainer>
        ) : (
          "Loading or no data TODO"
        )}
      </ScrollContainer>
    </>
  );
};

export default AddToPlaylistDialogContent;
