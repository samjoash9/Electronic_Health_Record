/**
 * Resolves once every chart box inside `nodes` holds a drawn chart, or after
 * `timeoutMs` so one chart that never sizes can't hang the export.
 *
 * Charts below the fold only mount when the export asks for them, then size
 * themselves a moment later; capturing straight away would snapshot empty boxes.
 */
export function waitForChartsDrawn(nodes, { timeoutMs = 2000, pollMs = 50 } = {}) {
  const allDrawn = () =>
    nodes.every((node) =>
      Array.from(node.querySelectorAll('[data-chart-box]')).every((box) =>
        box.querySelector('svg.recharts-surface')
      )
    );
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve) => {
    const check = () => {
      if (allDrawn() || Date.now() >= deadline) resolve();
      else setTimeout(check, pollMs);
    };
    check();
  });
}
