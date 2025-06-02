export const isAudioFile = jest.fn((file) => {
  if (!file) return false;
  // Prioritize type, then name, similar to the original function but simplified for mocking.
  if (file.type) {
    return file.type === 'audio/mpeg' ||
           file.type === 'audio/wav' ||
           file.type === 'audio/mp4' ||
           file.type === 'audio/aac' ||
           file.type === 'audio/flac' ||
           file.type === 'audio/ogg' ||
           file.type === 'audio/opus';
  }
  if (file.name) {
    const name = file.name.toLowerCase();
    return name.endsWith('.mp3') ||
           name.endsWith('.wav') ||
           name.endsWith('.m4a') ||
           name.endsWith('.aac') ||
           name.endsWith('.flac') ||
           name.endsWith('.ogg') ||
           name.endsWith('.opus');
  }
  return false;
});
