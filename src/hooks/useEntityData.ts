import { useLoader } from './useLoader';
import type { Track, Album, Artist, Playlist } from '../types/entities';

export const useTrackData = (id: number) => {
  return useLoader<Track>('tracks', id);
};

export const useAlbumData = (id: number) => {
  return useLoader<Album>('albums', id);
};

export const useArtistData = (id: number) => {
  // return useLoader<Artist>('artists', id);
  return { data: useLoader<Artist>('artists', id), loading: false, error: null };
};

export const usePlaylistData = (id: number) => {
  return useLoader<Playlist>('playlists', id);
};