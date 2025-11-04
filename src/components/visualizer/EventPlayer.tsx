import { PlaybackState } from '@/lib/visualizationEngine';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { SkipBack, Play, Pause, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';

interface EventPlayerProps {
  state: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSpeedChange: (speed: number) => void;
  onJumpTo: (index: number) => void;
}

export function EventPlayer({
  state,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onSpeedChange,
  onJumpTo
}: EventPlayerProps) {
  return (
    <div className="border-t bg-card p-4 space-y-4">
      {/* Timeline Scrubber */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Event {state.currentIndex + 1} of {state.events.length}</span>
          <span>{state.speed}x speed</span>
        </div>
        <Slider
          value={[state.currentIndex]}
          max={Math.max(0, state.events.length - 1)}
          step={1}
          onValueChange={([value]) => onJumpTo(value)}
          className="cursor-pointer"
        />
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onStepBackward}
          disabled={state.currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onJumpTo(0)}
          disabled={state.currentIndex === 0}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={state.isPlaying ? onPause : onPlay}
          className="h-12 w-12"
        >
          {state.isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onJumpTo(state.events.length - 1)}
          disabled={state.currentIndex >= state.events.length - 1}
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onStepForward}
          disabled={state.currentIndex >= state.events.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Speed Control */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground min-w-[60px]">Speed:</span>
        <Slider
          value={[state.speed]}
          min={0.25}
          max={2}
          step={0.25}
          onValueChange={([value]) => onSpeedChange(value)}
          className="flex-1"
        />
        <span className="text-sm font-medium min-w-[40px] text-right">{state.speed}x</span>
      </div>
    </div>
  );
}
