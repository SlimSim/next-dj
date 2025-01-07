"use client";

import { useEffect, useImperativeHandle, forwardRef } from "react";
import { usePlayerStore } from "@/lib/store";
import { useAudioPlayer } from "../../features/audio/hooks/useAudioPlayer";
import { useAudioControls } from "../../features/audio/hooks/useAudioControls";
import { useAudioDevice } from "../../features/audio/hooks/useAudioDevice";

export interface PrelistenAudioRef {
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

export const PrelistenAudioPlayer = forwardRef<PrelistenAudioRef>(
  (props, ref) => {
    const {
      prelistenTrack,
      isPrelistening,
      prelistenDeviceId,
      setIsPrelistening,
      setPrelistenTrack,
      prelistenDuration,
    } = usePlayerStore();

    const {
      audioRef,
      isLoading,
      handleTimeUpdate,
      handleLoadedMetadata,
      initAudio,
      mountedRef,
    } = useAudioPlayer("prelistenTrack");

    const { togglePlay } = useAudioControls(audioRef, isLoading);

    useAudioDevice(audioRef, prelistenDeviceId);

    useImperativeHandle(ref, () => ({
      seek: (time: number) => {
        if (audioRef.current) {
          audioRef.current.currentTime = time;
        }
      },
      getCurrentTime: () => {
        return audioRef.current?.currentTime || 0;
      },
      getDuration: () => {
        return audioRef.current?.duration || 0;
      }
    }));

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleEnded = () => setIsPrelistening(false);
      audio.addEventListener("ended", handleEnded);
      return () => audio.removeEventListener("ended", handleEnded);
    }, [setIsPrelistening]);

    useEffect(() => {
      const updateTrackInfo = () => {
        if (!audioRef.current || !prelistenTrack) return;

        const newCurrentTime = audioRef.current.currentTime;
        const newDuration = prelistenDuration;

        if (
          Math.abs(newCurrentTime - (prelistenTrack.currentTime || 0)) > 0.1 ||
          newDuration !== prelistenTrack.duration
        ) {
          setPrelistenTrack({
            ...prelistenTrack,
            currentTime: newCurrentTime,
            duration: newDuration,
          });
        }
      };

      const audio = audioRef.current;
      if (!audio) return;

      audio.addEventListener("timeupdate", updateTrackInfo);
      audio.addEventListener("loadedmetadata", updateTrackInfo);

      return () => {
        audio.removeEventListener("timeupdate", updateTrackInfo);
        audio.removeEventListener("loadedmetadata", updateTrackInfo);
      };
    }, [prelistenTrack, setPrelistenTrack, prelistenDuration]);

    useEffect(() => {
      initAudio();
    }, [prelistenTrack?.id]);

    useEffect(() => {
      if (!audioRef.current || isLoading) return;

      if (isPrelistening) {
        audioRef.current.play().catch((error) => {
          console.error("Error playing prelisten audio:", error);
          setIsPrelistening(false);
        });
      } else {
        audioRef.current.pause();
      }
    }, [isPrelistening, isLoading, setIsPrelistening]);

    return <audio ref={audioRef} id="prelisten-audio" preload="auto" />;
  }
);
