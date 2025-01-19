import { StateCreator } from 'zustand';
import { MusicMetadata } from '@/lib/types/types';

export interface DeviceState {
  audioDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  prelistenDeviceId: string;
  prelistenTrack: MusicMetadata | null;
  isPrelistening: boolean;
  prelistenDuration: number;
  showPreListenButtons: boolean;
}

export interface DeviceActions {
  setAudioDevices: (devices: MediaDeviceInfo[]) => void;
  setSelectedDeviceId: (deviceId: string) => void;
  setPrelistenDeviceId: (deviceId: string) => void;
  setPrelistenTrack: (track: MusicMetadata | null) => void;
  setIsPrelistening: (isPrelistening: boolean) => void;
  setPrelistenDuration: (duration: number) => void;
  setShowPreListenButtons: (show: boolean) => void;
}

export type DeviceSlice = DeviceState & DeviceActions;

const initialDeviceState: DeviceState = {
  audioDevices: [],
  selectedDeviceId: "",
  prelistenDeviceId: "",
  prelistenTrack: null,
  isPrelistening: false,
  prelistenDuration: 0,
  showPreListenButtons: true,
};

export const createDeviceSlice: StateCreator<DeviceSlice> = (set) => ({
  ...initialDeviceState,
  setAudioDevices: (devices) => set({ audioDevices: devices }),
  setSelectedDeviceId: (deviceId) => set({ selectedDeviceId: deviceId }),
  setPrelistenDeviceId: (deviceId) => set({ prelistenDeviceId: deviceId }),
  setPrelistenTrack: (track) => set({ prelistenTrack: track }),
  setIsPrelistening: (isPrelistening) => set({ isPrelistening }),
  setPrelistenDuration: (duration) => set({ prelistenDuration: duration }),
  setShowPreListenButtons: (show) => set({ showPreListenButtons: show }),
});
