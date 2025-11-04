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
  const speeds = [0.5, 1, 1.5, 2];

  return (
    <div className="border-t bg-card p-4 space-y-4">
      {/* Timeline Scrubber */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-medium">Step {state.currentIndex + 1} of {state.events.length}</span>
          <span>{state.speed}× speed</span>
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
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onJumpTo(0)}
          disabled={state.currentIndex === 0}
          title="Restart"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onStepBackward}
          disabled={state.currentIndex === 0}
          title="Previous Step"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          onClick={state.isPlaying ? onPause : onPlay}
          className="h-14 w-14"
          title={state.isPlaying ? "Pause" : "Play"}
        >
          {state.isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-0.5" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onStepForward}
          disabled={state.currentIndex >= state.events.length - 1}
          title="Next Step"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onJumpTo(state.events.length - 1)}
          disabled={state.currentIndex >= state.events.length - 1}
          title="Skip to End"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Speed Control - Simplified Buttons */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Speed:</span>
        {speeds.map(speed => (
          <Button
            key={speed}
            variant={state.speed === speed ? "default" : "outline"}
            size="sm"
            onClick={() => onSpeedChange(speed)}
            className="min-w-[60px]"
          >
            {speed}×
          </Button>
        ))}
      </div>
    </div>
  );
}
