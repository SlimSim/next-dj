// src/components/PlayerOverlay.tsx

import React from "react";
import { useMainStore } from "@/context/MainStoreContext";
import Button from "./Button";
import Icon from "./icon/Icon";
import MainControls from "./player/MainControls";
import PlayerArtwork from "./player/PlayerArtwork";
import Timeline from "./player/Timeline";
import VolumeSlider from "./player/VolumeSlider";
import FavoriteButton from "./player/buttons/FavoriteButton";
import PlayNextButton from "./player/buttons/PlayNextButton";
import PlayToggleButton from "./player/buttons/PlayToggleButton";
import { cn } from "../utils/clx";
import { usePlayer } from "@/context/PlayerContext";

const PlayerOverlay: React.FC<{ className?: string }> = ({ className }) => {
  const mainStore = useMainStore();
  const player = usePlayer();
  const track = player.activeTrack;

  return (
    <div
      className={cn(
        "view-transition-pl-container border border-primary/10 overflow-hidden max-w-900px mx-auto justify-between sm:h-auto rounded-16px sm:rounded-24px bg-secondaryContainer text-onSecondaryContainer",
        className
      )}
    >
      <div className="player-content h-full justify-between gap-16px flex flex-col items-center w-full sm:px-16px sm:pt-8px sm:pb-16px">
        <Timeline className="max-sm:hidden" />
        <div className="flex sm:grid items-center w-full h-min grow grid-cols-[1fr_max-content_1fr]">
          <div className="flex items-center grow">
            <Button
              as="a"
              href="/player"
              kind="blank"
              tooltip={"m.playerOpenFullPlayer()"}
              className="flex items-center max-sm:p-8px max-sm:rounded-r-16px rounded-8px grow sm:h-44px pr-8px sm:max-w-180px group"
            >
              <div className="player-artwork bg-surfaceContainerHighest rounded-8px overflow-hidden shrink-0 relative h-44px w-44px">
                {track && <PlayerArtwork className="size-full" />}
                <Icon
                  type="chevronUp"
                  className={cn(
                    "m-auto shrink-0 absolute inset-0",
                    track &&
                      "bg-tertiary text-onTertiary rounded-full scale-0 transition-transform transition-opacity transition-200 [.group:hover_&]:scale-100"
                  )}
                />
              </div>
              {track && (
                <div className="min-w-0 ml-16px mr-4px">
                  <div className="truncate text-body-md">{track.name}</div>
                  <div className="truncate text-body-sm">{track.artists}</div>
                </div>
              )}
            </Button>
            <FavoriteButton />
          </div>
          <div className="ml-auto flex gap-8px sm:hidden pr-8px">
            ptb1: <PlayToggleButton />
            <PlayNextButton className="max-xss:hidden" />
          </div>
          <MainControls className="max-sm:hidden" />
          <div className="flex items-center gap-8px ml-auto max-sm:hidden pr-8px">
            {mainStore.volumeSliderEnabled && <VolumeSlider />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerOverlay;
