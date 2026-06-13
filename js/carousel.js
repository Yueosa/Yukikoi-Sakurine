/**
 * Infinite marquee for the card tracks.
 *
 * Cards are duplicated once and the track is translated every frame via rAF on the
 * main thread. A CSS transform animation would run on the compositor, where click
 * hit-testing still uses the un-transformed layout box and clicks land off to the
 * side — driving it from JS keeps pointer hits aligned with the moving cards.
 */
window.YK = window.YK || {};

window.YK.initCarousel = () => {
  const SPEED = 55; // px per second

  document.querySelectorAll('.wander-track').forEach((track) => {
    track.innerHTML += track.innerHTML;

    let offset = 0;
    let last = null;
    const tick = (now) => {
      if (last !== null) {
        offset -= SPEED * (now - last) / 1000;
        const half = track.scrollWidth / 2;
        if (half > 0 && -offset >= half) offset += half;
        track.style.transform = `translateX(${offset}px)`;
      }
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
};
