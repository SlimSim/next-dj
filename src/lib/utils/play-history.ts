import { PlayHistoryEvent } from "../types/types";

export function getPlaysInLastHours(
  playHistory: PlayHistoryEvent[],
  hours: number = 18
): number {
  if (!playHistory) return 0;
  const now = new Date();
  const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
  return playHistory.filter((event) => new Date(event.timestamp) > cutoff).length;
}

export function getPlaysInCurrentMonth(
  playHistory: PlayHistoryEvent[],
  days: number = 42
): number {
  if (!playHistory) return 0;
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return playHistory.filter((event) => new Date(event.timestamp) > cutoff).length;
}

export const getTotalPlays = (playHistory: PlayHistoryEvent[]): number => {
  return playHistory.length;
};

export const addPlayEvent = (playHistory: PlayHistoryEvent[] = []): PlayHistoryEvent[] => {
  const newEvent: PlayHistoryEvent = {
    timestamp: new Date().toISOString(),
  };
  return [...playHistory, newEvent];
};
