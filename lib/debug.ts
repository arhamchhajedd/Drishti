// Ephemeral debug log buffer for on-screen HUD (?debug=1) and mobile diagnostics

export interface DebugLogEntry {
  id: number;
  time: string;
  stage: string;
  message: string;
  data?: Record<string, unknown>;
}

type DebugListener = (logs: DebugLogEntry[]) => void;

class DebugLogger {
  private logs: DebugLogEntry[] = [];
  private listeners: Set<DebugListener> = new Set();
  private nextId = 1;
  private maxLogs = 50;

  log(stage: string, message: string, data?: Record<string, unknown>) {
    const now = new Date();
    const timeStr = `${now.toTimeString().split(" ")[0]}.${String(now.getMilliseconds()).padStart(3, "0")}`;
    const entry: DebugLogEntry = {
      id: this.nextId++,
      time: timeStr,
      stage,
      message,
      data,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Console output for remote inspection
    if (typeof console !== "undefined") {
      const dataStr = data ? ` | ${JSON.stringify(data)}` : "";
      console.log(`[Drishti:${stage}] ${message}${dataStr}`);
    }

    this.notify();
  }

  getLogs(): DebugLogEntry[] {
    return [...this.logs];
  }

  subscribe(listener: DebugListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => this.listeners.delete(listener);
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  private notify() {
    const current = [...this.logs];
    this.listeners.forEach((l) => l(current));
  }
}

export const debugLogger = new DebugLogger();
