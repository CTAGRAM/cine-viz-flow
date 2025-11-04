import { VisualizationEvent } from './dataStructures';

export interface PlaybackState {
  events: VisualizationEvent[];
  currentIndex: number;
  isPlaying: boolean;
  speed: number;
}

export class VisualizationEngine {
  private state: PlaybackState = {
    events: [],
    currentIndex: 0,
    isPlaying: false,
    speed: 1
  };
  private listeners: ((state: PlaybackState) => void)[] = [];
  private playbackTimer: NodeJS.Timeout | null = null;

  setEvents(events: VisualizationEvent[]) {
    this.state.events = events;
    this.state.currentIndex = 0;
    this.notifyListeners();
  }

  play() {
    if (this.state.currentIndex >= this.state.events.length - 1) {
      this.state.currentIndex = 0;
    }
    this.state.isPlaying = true;
    this.notifyListeners();
    this.scheduleNext();
  }

  pause() {
    this.state.isPlaying = false;
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    this.notifyListeners();
  }

  stepForward() {
    if (this.state.currentIndex < this.state.events.length - 1) {
      this.state.currentIndex++;
      this.notifyListeners();
    }
  }

  stepBackward() {
    if (this.state.currentIndex > 0) {
      this.state.currentIndex--;
      this.notifyListeners();
    }
  }

  setSpeed(speed: number) {
    this.state.speed = speed;
    this.notifyListeners();
  }

  jumpTo(index: number) {
    if (index >= 0 && index < this.state.events.length) {
      this.state.currentIndex = index;
      this.notifyListeners();
    }
  }

  private scheduleNext() {
    if (!this.state.isPlaying) return;
    
    const baseDelay = 500; // ms per event
    const delay = baseDelay / this.state.speed;

    this.playbackTimer = setTimeout(() => {
      if (this.state.currentIndex < this.state.events.length - 1) {
        this.state.currentIndex++;
        this.notifyListeners();
        this.scheduleNext();
      } else {
        this.state.isPlaying = false;
        this.notifyListeners();
      }
    }, delay);
  }

  subscribe(listener: (state: PlaybackState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  getState(): PlaybackState {
    return { ...this.state };
  }

  getCurrentEvent(): VisualizationEvent | null {
    return this.state.events[this.state.currentIndex] || null;
  }

  getEventsUpToCurrent(): VisualizationEvent[] {
    return this.state.events.slice(0, this.state.currentIndex + 1);
  }
}

export const visualizationEngine = new VisualizationEngine();
