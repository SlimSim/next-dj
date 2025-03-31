export function isAudioFile(file: File): boolean {
  // Check by MIME type first
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
    'audio/x-wav',       // WAV (alternative MIME type)
    'audio/x-ms-wma',    // WMA
    'audio/vnd.wav'      // Another WAV variant
  ];
  
  // If MIME type is recognized as audio, return true
  if (audioTypes.includes(file.type)) {
    console.log(`File ${file.name} recognized as audio by MIME type: ${file.type}`);
    return true;
  }
  
  // If MIME type check fails, check by file extension
  const audioExtensions = [
    '.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg', '.oga', 
    '.opus', '.webm', '.aiff', '.wma', '.mp4'
  ];
  
  const fileName = file.name.toLowerCase();
  const hasAudioExtension = audioExtensions.some(ext => fileName.endsWith(ext));
  
  if (hasAudioExtension) {
    console.log(`File ${file.name} recognized as audio by extension, despite MIME type: ${file.type}`);
    return true;
  }
  
  console.log(`File ${file.name} not recognized as audio. MIME type: ${file.type}`);
  return false;
}