import { VisualizationEvent } from './dataStructures';

export interface OperationMetadata {
  type: 'ADD' | 'SEARCH' | 'UPDATE' | 'DELETE' | 'TOP_K';
  movieId?: string; // kept for backward compatibility
  movieName?: string; // kept for backward compatibility
  timestamp: number;
  eventsCount: number;
}

export interface PlaybackState {
  events: VisualizationEvent[];
  currentIndex: number;
  isPlaying: boolean;
  speed: number;
  operation?: OperationMetadata;
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

  setEvents(events: VisualizationEvent[], operation?: OperationMetadata) {
    this.state.events = events;
    this.state.currentIndex = 0;
    this.state.operation = operation;
    this.notifyListeners();
    
    // Save to history
    if (operation && events.length > 0) {
      this.saveToHistory(operation);
    }
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

  restart() {
    this.state.currentIndex = 0;
    this.state.isPlaying = false;
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    this.notifyListeners();
  }

  private scheduleNext() {
    if (!this.state.isPlaying) return;
    
    const baseDelay = 1500; // 1.5 seconds per event (slower for better comprehension)
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

  getProgressPercentage(): number {
    if (this.state.events.length === 0) return 0;
    return ((this.state.currentIndex + 1) / this.state.events.length) * 100;
  }

  private saveToHistory(operation: OperationMetadata) {
    const history = this.getHistory();
    history.unshift(operation);
    // Keep last 20 operations
    if (history.length > 20) {
      history.splice(20);
    }
    localStorage.setItem('visualization-history', JSON.stringify(history));
  }

  getHistory(): OperationMetadata[] {
    const stored = localStorage.getItem('visualization-history');
    return stored ? JSON.parse(stored) : [];
  }

  clearHistory() {
    localStorage.removeItem('visualization-history');
  }
}

export const visualizationEngine = new VisualizationEngine();
