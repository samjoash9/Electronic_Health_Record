import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForChartsDrawn } from './chartExport';

const DRAWN_CHART = '<svg class="recharts-surface"></svg>';

/** A report card holding one chart box per flag; true means already drawn. */
function card(...drawn) {
  const node = document.createElement('div');
  for (const isDrawn of drawn) {
    const box = document.createElement('div');
    box.setAttribute('data-chart-box', '');
    if (isDrawn) box.innerHTML = DRAWN_CHART;
    node.append(box);
  }
  return node;
}

function track(promise) {
  const state = { settled: false };
  promise.then(() => {
    state.settled = true;
  });
  return state;
}

describe('waitForChartsDrawn', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('waits until every chart box in every card holds a drawn chart', async () => {
    const lagging = card(true, false);
    const wait = track(waitForChartsDrawn([card(true, true), lagging]));

    await vi.advanceTimersByTimeAsync(500);
    expect(wait.settled).toBe(false);

    lagging.lastChild.innerHTML = DRAWN_CHART;
    await vi.advanceTimersByTimeAsync(100);
    expect(wait.settled).toBe(true);
  });

  it('gives up after two seconds so one stuck chart cannot hang the export', async () => {
    const wait = track(waitForChartsDrawn([card(false)]));

    await vi.advanceTimersByTimeAsync(1900);
    expect(wait.settled).toBe(false);

    await vi.advanceTimersByTimeAsync(200);
    expect(wait.settled).toBe(true);
  });
});
