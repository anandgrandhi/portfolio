/* Career journey host.
 * Desktop: the section is a tall track with a sticky stage. Native page scrolling (including
 * macOS trackpad momentum) is never intercepted; the scroll position inside the track selects
 * the milestone, and the timeline engine in the iframe performs the camera travel between them.
 * Entering and leaving the journey is ordinary page scrolling in both directions.
 * Fallback: readable stage cards on small screens, short windows, reduced motion, or when the
 * locally-licensed engine (../career-horizontal/) is not deployed.
 */
(() => {
  const section = document.getElementById('experience');
  const track = document.getElementById('careerTrack');
  const frame = document.getElementById('horizontalCareer');
  const steps = document.getElementById('careerSteps');
  if (!section || !track || !frame) return;

  const ENGINE = '../career-horizontal/index.html';
  const MILESTONES = 4;            // scenes after the intro
  const STEP = 0.7;                // scroll distance per milestone, in stage heights
  const ENTER = 0.22;              // one gentle trackpad swipe (~0.15 stage) starts the next scene
  const BAND = 0.12;               // hysteresis: going back needs a further 0.12 step, so reversals never flicker
  const header = document.querySelector('header');
  const desktop = matchMedia('(min-width: 1024px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)');
  window.careerJourneyHost = true;

  let available = null, active = false, target = 0, lastCall = 0, raf = 0, near = false, jump = null;
  document.documentElement.style.setProperty('--cj-length', String(1 + MILESTONES * STEP + 0.35));

  const headerHeight = () => (header ? header.getBoundingClientRect().height : 0);
  const sizeHeader = () => document.documentElement.style.setProperty('--cj-header', headerHeight() + 'px');
  sizeHeader();
  if (header && window.ResizeObserver) new ResizeObserver(sizeHeader).observe(header);

  const engine = () => {
    try { const el = frame.contentDocument && frame.contentDocument.querySelector('ai-timeline-desktop'); return el && el.ready ? el : null; }
    catch (e) { return null; }
  };
  const busy = el => el.autoProgressAnimation || el.isWarping || el.navigationLocked || el.isPausedBeforeTravel;

  // Scroll position -> milestone (0 = intro, 1..4 = career scenes)
  function geometry() {
    const r = track.getBoundingClientRect(), stage = innerHeight - headerHeight();
    const travel = Math.max(1, stage * STEP);
    return { raw: (headerHeight() - r.top) / travel, top: r.top + scrollY, travel };
  }
  function updateTarget() {
    const raw = Math.max(0, Math.min(MILESTONES + 0.99, geometry().raw));
    // scene t is held for raw in [t - 1 + ENTER - BAND, t + ENTER)
    while (target < MILESTONES && raw >= target + ENTER) target++;
    while (target > 0 && raw < target - 1 + ENTER - BAND) target--;
  }

  function drive() {
    raf = 0;
    if (!active) return;
    updateTarget();
    const el = engine();
    if (el) {
      const now = performance.now(), idx = el.sectionIndex;
      if (idx !== target && !busy(el) && now - lastCall > 120) {
        lastCall = now;
        const diff = target - idx;
        // Like the original timeline: every scene gets its full camera travel, one at a time,
        // even when a fast swipe moves several milestones ahead (the next step chains on arrival).
        // Only explicit jumps (milestone buttons) use the engine's own warp.
        if (jump !== null && jump === target && Math.abs(diff) > 1) el.warpToSection(target);
        else diff > 0 ? el.goToNextSection() : el.goToPrevSection();

      }
      if (jump !== null && idx === jump) jump = null;
      paintSteps(idx);
    }
    if (near) raf = requestAnimationFrame(drive);
  }
  const kick = () => { if (!raf && active) raf = requestAnimationFrame(drive); };

  function paintSteps(idx) {
    if (!steps) return;
    steps.classList.toggle('is-visible', idx > 0 || target > 0);
    steps.querySelectorAll('button').forEach((b, i) => {
      if (i + 1 === idx) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
  }
  if (steps) steps.addEventListener('click', e => {
    const b = e.target.closest('button[data-step]');
    if (!b) return;
    const g = geometry();
    jump = +b.dataset.step;
    scrollTo({ top: g.top - headerHeight() + (+b.dataset.step + 0.05) * g.travel, behavior: 'smooth' });
  });

  // Only run the loop while the journey is on (or near) screen.
  new IntersectionObserver(([entry]) => {
    near = entry.isIntersecting;
    if (near && active && !frame.getAttribute('src')) frame.src = ENGINE;
    if (near) kick();
  }, { rootMargin: '150% 0px 150% 0px' }).observe(track);
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);

  function mode() {
    active = !!available && desktop.matches;
    section.classList.toggle('is-horizontal', active);
    track.hidden = !active;
    if (!active) { frame.removeAttribute('src'); target = 0; return; }
    if (near && !frame.getAttribute('src')) frame.src = ENGINE;
    kick();
  }
  desktop.addEventListener('change', mode);

  // The engine is not published (third-party reference build kept local), so it is only looked for
  // on a local preview host; public visitors get the fallback without any request for it.
  // ?career=fallback forces the public behaviour for testing.
  const localHost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (!localHost || new URLSearchParams(location.search).get('career') === 'fallback') { available = false; mode(); }
  else fetch(ENGINE, { method: 'HEAD', cache: 'no-store' })
    .then(r => { available = r.ok; })
    .catch(() => { available = false; })
    .then(mode);
})();
