let audioContext: AudioContext | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
const filters: BiquadFilterNode[] = [];

const frequencies = [60, 250, 1000, 4000, 12000];

export async function initializeEQ(audioElement: HTMLAudioElement) {
  try {

    // Create new audio context if it doesn't exist or is closed
    if (!audioContext || audioContext.state === 'closed') {
      audioContext = new AudioContext();
    }

    // If we already have a source node connected to this audio element, no need to recreate
    if (sourceNode?.mediaElement === audioElement) {
      // Only try to resume if we're keeping the existing setup
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      return;
    }

    // Disconnect and clean up old source node if it exists
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode = null;
    }

    // Clean up existing filters
    filters.forEach(filter => {
      filter.disconnect();
    });
    filters.length = 0;

    // Create a new source node
    sourceNode = audioContext.createMediaElementSource(audioElement);

    // Create filters for each frequency band
    frequencies.forEach((freq, index) => {
      if (!audioContext || !sourceNode) return;

      const filter = audioContext.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1;
      filter.gain.value = 0;

      // Connect filters in series
      if (index === 0) {
        sourceNode.connect(filter);
      } else {
        filters[index - 1].connect(filter);
      }

      filters.push(filter);
    });

    // Connect last filter to destination
    if (filters.length > 0) {
      filters[filters.length - 1].connect(audioContext.destination);
      
      // Try to resume the context after setup is complete
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
    }
  } catch (error) {
    console.error('Failed to initialize EQ:', error);
    cleanupEQ();
  }
}

export function updateEQBand(band: number, value: number) {
  if (!filters[band]) return;
  
  // Convert 0-100 range to -12 to +12 dB
  const gain = ((value - 50) / 50) * 12;
  filters[band].gain.value = gain;
}

export function cleanupEQ() {
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }
  
  filters.forEach(filter => {
    try {
      filter.disconnect();
    } catch (error) {
      console.error('Error disconnecting filter:', error);
    }
  });
  filters.length = 0;

  if (audioContext) {
    try {
      audioContext.close();
    } catch (error) {
      console.error('Error closing audio context:', error);
    }
    audioContext = null;
  }
}
