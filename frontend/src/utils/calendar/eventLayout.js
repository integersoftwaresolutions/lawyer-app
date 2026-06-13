import {
  clampEventToDay,
  minutesFromMidnight
} from "./dateUtils.js";

function assignOverlapColumns(items) {
  const columns = [];

  for (const item of items) {
    let column = columns.findIndex((endMin) => endMin <= item.startMin);
    if (column === -1) {
      column = columns.length;
      columns.push(0);
    }
    columns[column] = item.endMin;
    item.column = column;
  }

  const columnCount = Math.max(columns.length, 1);
  for (const item of items) {
    item.columnCount = columnCount;
  }
}

function buildOverlapClusters(items) {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const clusters = [];
  let current = [];
  let clusterEnd = -1;

  for (const item of sorted) {
    if (current.length && item.startMin >= clusterEnd) {
      clusters.push(current);
      current = [];
      clusterEnd = -1;
    }
    current.push(item);
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }

  if (current.length) clusters.push(current);
  return clusters;
}

/**
 * Position timed events for a single day column with overlap columns.
 */
export function layoutTimedEvents(
  events,
  dateKey,
  {
    timezone,
    hourStart,
    hourEnd,
    hourHeight,
    minHeightPx = 22
  }
) {
  const gridMinutes = (hourEnd - hourStart + 1) * 60;

  const items = events.map((event) => {
    const { start, end } = clampEventToDay(event, dateKey, timezone);
    const startMin = minutesFromMidnight(start, timezone);
    const endMin = minutesFromMidnight(end, timezone);
    const topMin = Math.max(0, startMin - hourStart * 60);
    const bottomMin = Math.min(gridMinutes, Math.max(topMin + 1, endMin - hourStart * 60));
    const durationMin = Math.max(bottomMin - topMin, 15);

    return {
      event,
      startMin,
      endMin,
      topMin,
      endMinClamped: topMin + durationMin,
      top: (topMin / 60) * hourHeight,
      height: Math.max((durationMin / 60) * hourHeight, minHeightPx)
    };
  });

  const clusters = buildOverlapClusters(items);
  for (const cluster of clusters) {
    assignOverlapColumns(cluster);
  }

  return items;
}
