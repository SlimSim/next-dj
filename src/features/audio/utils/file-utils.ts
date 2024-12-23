export function isAudioFile(file: File): boolean {
    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac']
    return audioTypes.includes(file.type)
  }