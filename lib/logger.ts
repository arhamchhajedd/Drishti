import "server-only";

type MetricValue = string | number | boolean | undefined;

// Metrics only. Never pass images, base64, model text, IPs, or keys here.
export function logMetric(event: string, data: Record<string, MetricValue>): void {
  console.info(JSON.stringify({ event, ...data, at: new Date().toISOString() }));
}

export function logError(event: string, data: Record<string, MetricValue>): void {
  console.warn(JSON.stringify({ event, ...data, at: new Date().toISOString() }));
}
