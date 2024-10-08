import type { TrackImportCount, TrackImportMessage, TrackImportOptions } from "@/types/tarckImport"

export type TrackParsedFn = (totalParsedCount: number) => void

export const startImportingTracks = async (
	options: TrackImportOptions,
	progress: (data: TrackImportCount) => void,
): Promise<TrackImportCount> => {
	const { promise, reject, resolve } = Promise.withResolvers<TrackImportCount>()

	const worker = new Worker(new URL('@/workers/importTracksWorker', import.meta.url), {
		type: 'module',
	})

	worker.addEventListener('error', reject)
	worker.addEventListener('message', ({ data }: MessageEvent<TrackImportMessage>) => {
		if (data.finished) {
			resolve(data.count)
		} else {
			progress(data.count)
		}
	})

	worker.postMessage(options)

	return promise
}
