export function isAudioFile(file: File): boolean {
    const audioTypes = [
      'audio/mpeg',        // MP3
      'audio/wav',         // WAV
      'audio/mp4',         // M4A, MP4 Audio
      'audio/aac',         // AAC
      'audio/flac',        // FLAC
      'audio/ogg',         // OGG, OGA
      'audio/opus',        // OPUS
      'audio/webm',        // WEBM Audio
      'audio/x-m4a',       // M4A (alternative MIME type)
      'audio/x-aiff',      // AIFF
      'audio/x-wav'        // WAV (alternative MIME type)
    ]
    return audioTypes.includes(file.type)
  }