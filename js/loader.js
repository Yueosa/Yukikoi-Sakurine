/**
 * Loading screen sequence.
 *
 * Timeline: a calm blue line sweeps in left→right, retracts to the right, then a
 * violet ECG bursts in — accelerating into a first heartbeat spike and continuing
 * at a uniform pace through a smaller tail shake. The spike is the "reveal" moment:
 * it fires onReveal() and the loader dissolves.
 *
 * The blue line acts as the minimum-duration progress bar; the page only reveals
 * once that minimum has elapsed AND the audio has buffered (or a safety timeout).
 */
window.YK = window.YK || {};

window.YK.initLoader = ({ bgm, onReveal }) => {
  const loader = document.getElementById('loader');
  if (!loader) return;

  const blue = loader.querySelector('.ecg-blue');
  const pulse = loader.querySelector('.ecg-pulse');
  const lenBlue = blue.getTotalLength();
  const lenPulse = pulse.getTotalLength();

  const HOLD_WHITE = 300;   // blank hold before the blue line enters
  const BLUE_DRAW = 1200;   // blue line draw-in duration
  const GAP = 520;          // pause between blue leaving and violet arriving
  const STAGE1 = 850;       // violet accelerating into the first spike
  const STAGE2 = 1300;      // violet at a uniform pace through the rest
  const EASE_IN = 'cubic-bezier(0.55, 0, 1, 0.45)';
  const SPIKE_AT = GAP + STAGE1;

  // Binary-search the path length at a given x, so the violet draw can be split
  // exactly at the first spike (x ~= 422 in the 0..1000 viewBox).
  const lengthAtX = (path, x) => {
    let lo = 0, hi = path.getTotalLength();
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      (path.getPointAtLength(mid).x < x ? lo = mid : hi = mid);
    }
    return (lo + hi) / 2;
  };
  const spikeLen = lengthAtX(pulse, 422);

  [blue, pulse].forEach((p) => {
    const len = p === blue ? lenBlue : lenPulse;
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });

  setTimeout(() => {
    blue.style.transition = `stroke-dashoffset ${BLUE_DRAW}ms cubic-bezier(0.35, 0, 0.5, 1)`;
    blue.style.strokeDashoffset = '0';
  }, HOLD_WHITE);

  const musicReady = new Promise((resolve) => {
    if (bgm.readyState >= 3) return resolve();
    bgm.addEventListener('canplaythrough', resolve, { once: true });
    bgm.addEventListener('error', resolve, { once: true });
    setTimeout(resolve, 8000);
  });
  const minElapsed = new Promise((resolve) => setTimeout(resolve, HOLD_WHITE + BLUE_DRAW));

  Promise.all([musicReady, minElapsed]).then(() => {
    blue.style.transition = `stroke-dashoffset 0.9s ${EASE_IN}`;
    blue.style.strokeDashoffset = -lenBlue;

    setTimeout(() => {
      pulse.style.transition = `stroke-dashoffset ${STAGE1}ms cubic-bezier(0.7, 0, 0.84, 0)`;
      pulse.style.strokeDashoffset = lenPulse - spikeLen;
    }, GAP);

    setTimeout(() => {
      pulse.style.transition = `stroke-dashoffset ${STAGE2}ms linear`;
      pulse.style.strokeDashoffset = '0';
    }, GAP + STAGE1);

    setTimeout(() => {
      onReveal();
      loader.classList.add('is-gone');
    }, SPIKE_AT);

    setTimeout(() => loader.remove(), SPIKE_AT + STAGE2 + 1200);
  });
};
