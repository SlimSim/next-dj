import type { FileEntity } from '@/utils/file-system-copy';

export type PlayerRepeat = 'none' | 'one' | 'all';

const getTrackFile = async (track: FileEntity): Promise<File | null> => {
  if (track instanceof File) {
    return track;
  }

  let mode = await track.queryPermission({ mode: 'read' });
  if (mode !== 'granted') {
    try {
      if (mode === 'prompt') {
        mode = await track.requestPermission({ mode: 'read' });
      }
    } catch {
      // Handle permission error
    }

    if (mode !== 'granted') {
      return null;
    }
  }

  return track.getFile();
};

export const cleanupTrackAudio = (audio: HTMLAudioElement) => {
  audio.pause();
  audio.currentTime = 0;
  const currentSrc = audio.src;
  if (currentSrc) {
    URL.revokeObjectURL(currentSrc);
  }
};

export const loadTrackAudio = async (audio: HTMLAudioElement, entity: FileEntity) => {
  const file = await getTrackFile(entity);

  if (!file) {
    return;
  }

  cleanupTrackAudio(audio);

  audio.src = URL.createObjectURL(file);

  await audio.play();
};