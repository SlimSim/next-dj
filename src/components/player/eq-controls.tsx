import { Slider } from '../ui/slider'
import { usePlayerStore } from '@/lib/store'
import { Label } from '../ui/label'
import { MusicMetadata } from '@/lib/types/types'
import { EQValues } from '@/lib/types/player'
import { cn } from '@/lib/utils/common'
import { Button } from '../ui/button'
import { RotateCcw } from 'lucide-react'
import { updateEQBand } from '@/features/audio/eq'

interface EQControlsProps {
  track?: MusicMetadata;
  onTrackChange?: (changes: Partial<MusicMetadata>) => void;
}

type SliderKey = keyof EQValues;

export function EQControls({ track, onTrackChange }: EQControlsProps) {
  const { eqValues, setEQValue, eqMode, currentTrack } = usePlayerStore()

  const calculateIntermediateValue = (value1: number, value2: number) => {
    return Math.round((value1 + value2) / 2);
  }

  const calculateFinalEQ = (songEQ: number, globalEQ: number): number => {
    const clampedSongEQ = Math.max(0, Math.min(100, songEQ));
    const clampedGlobalEQ = Math.max(0, Math.min(100, globalEQ));
    return Math.round((clampedSongEQ * clampedGlobalEQ) / 100);
  }

  const handleValueChange = (sliderId: SliderKey, value: number) => {
    if (track && onTrackChange) {
      // For 3-band mode, calculate B and D values
      const newEq = {
        a: track.eq?.a ?? 70,
        b: track.eq?.b ?? 70,
        c: track.eq?.c ?? 70,
        d: track.eq?.d ?? 70,
        e: track.eq?.e ?? 70,
        [sliderId]: value,
      }

      if (eqMode === '3-band') {
        if (sliderId === 'a' || sliderId === 'c') {
          newEq.b = calculateIntermediateValue(newEq.a, newEq.c);
        }
        if (sliderId === 'c' || sliderId === 'e') {
          newEq.d = calculateIntermediateValue(newEq.c, newEq.e);
        }
      }

      onTrackChange({ eq: newEq })
      
      // Apply EQ changes in real-time if this is the currently playing track
      if (currentTrack && track.id === currentTrack.id) {
        const bands = ['a', 'b', 'c', 'd', 'e'] as const;
        bands.forEach((band, index) => {
          // Only update the band that changed and any calculated intermediate bands
          if (band === sliderId || 
              (eqMode === '3-band' && band === 'b' && (sliderId === 'a' || sliderId === 'c')) ||
              (eqMode === '3-band' && band === 'd' && (sliderId === 'c' || sliderId === 'e'))) {
            const globalValue = eqValues[band];
            const songValue = newEq[band];
            const finalValue = calculateFinalEQ(songValue, globalValue);
            updateEQBand(index, finalValue);
          }
        });
      }
    } else {
      // For global EQ values
      setEQValue(sliderId, value)
      
      if (eqMode === '3-band') {
        if (sliderId === 'a' || sliderId === 'c') {
          setEQValue('b', calculateIntermediateValue(eqValues.a, eqValues.c));
        }
        if (sliderId === 'c' || sliderId === 'e') {
          setEQValue('d', calculateIntermediateValue(eqValues.c, eqValues.e));
        }
      }
    }
  }

  const handleEQChange = (sliderId: SliderKey, value: number) => {
    handleValueChange(sliderId, value)
  }

  const getValue = (sliderId: SliderKey): number => {
    if (track) {
      return track.eq?.[sliderId] ?? 70
    }
    return eqValues[sliderId]
  }

  const sliders = [
    { id: 'a' as const, label: '60Hz', freq: 60 },
    { id: 'b' as const, label: '250Hz', freq: 250, hideIn3Band: true },
    { id: 'c' as const, label: '1kHz', freq: 1000 },
    { id: 'd' as const, label: '4kHz', freq: 4000, hideIn3Band: true },
    { id: 'e' as const, label: '12kHz', freq: 12000 },
  ]

  const visibleSliders = sliders.filter(
    slider => eqMode === '5-band' || !slider.hideIn3Band
  )

  return (
    <div className={cn("grid gap-1 items-center", eqMode === '3-band' ? 'grid-cols-3' : 'grid-cols-5',)}>
      {visibleSliders.map((slider) => (
        <div key={slider.id} className='flex-col flex items-center'>
          <div className="text-center mb-2 flex items-center gap-2">
            {getValue(slider.id)}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleEQChange(slider.id, 70)}
              title={`Reset ${slider.label} to 70`}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative h-24 w-8 flex items-center justify-center">
            <Slider
              min={0}
              max={100}
              step={1}
              value={[getValue(slider.id)]}
              onValueChange={([value]) => handleValueChange(slider.id, value)}
              orientation="vertical"
              className="relative h-full w-4"
              disabled={eqMode === '3-band' && slider.hideIn3Band}
            />
          </div>
          <Label className="text-center block mt-2">{slider.label}</Label>
        </div>
      ))}
    </div>
  )
}
