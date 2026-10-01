/**
 * Timeline-mode preview. Renders the scene, applies initial values, builds
 * the motion sequence and exposes playback controls (play, pause, scrub).
 */
import { animate, inView, scroll, stagger } from "motion";
import { buildSequence, buildInitial, buildSequenceOptions, totalDuration } from "./compile.js";
import { sceneMarkup, sceneCss } from "./scenes.js";

let cleanup = [];
let controls = null;

function runCleanup() {
  for (const fn of cleanup) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
  cleanup = [];
  try {
    controls?.stop?.();
  } catch {
    /* ignore */
  }
  controls = null;
}

/**
 * Render and wire the preview. Returns a player object the timeline uses:
 *   { play(), pause(), seek(t), time(), duration, playing(), replay() }
 */
export function renderTimelinePreview(stage, state, { setStatus, onTick, onSelectElement }) {
  runCleanup();
  const scrolly = state.trigger === "inView" || state.trigger === "scroll";
  stage.classList.toggle("scrolly", scrolly);
  const inner = `<div class="stage-inner t-scene"><style>${sceneCss(state.scene)}</style>${sceneMarkup(state.scene)}</div>`;
  stage.innerHTML = scrolly
    ? `<div class="scroll-filler top"><span>Scroll down ↓</span></div>${inner}<div class="scroll-filler bottom"><span>Keep scrolling</span></div>`
    : inner;
  stage.scrollTop = 0;

  const root = stage.querySelector(".t-scene");
  const sceneRoot = root.lastElementChild;
  const duration = totalDuration(state);

  // Click an element in the preview to select it on the timeline.
  const onClick = (e) => {
    const el = e.target.closest("[data-el]");
    if (el && root.contains(el)) {
      e.preventDefault();
      onSelectElement?.(el.dataset.el);
    }
  };
  root.addEventListener("click", onClick);
  cleanup.push(() => root.removeEventListener("click", onClick));

  // Highlight the selected element.
  const selected = state.actions.find((a) => a.id === state.selected);
  if (selected) for (const el of root.querySelectorAll(`[data-el="${selected.el}"]`)) el.classList.add("t-selected");

  const player = {
    duration,
    play: () => {},
    pause: () => {},
    seek: () => {},
    time: () => 0,
    playing: () => false,
    replay: () => {},
  };
  if (!state.actions.length) {
    setStatus("Add an action on the timeline to begin");
    return player;
  }

  // Start every element at its first keyframe so nothing flashes.
  const initial = buildInitial(state);
  for (const [sel, values] of Object.entries(initial)) {
    const els = root.querySelectorAll(sel);
    if (els.length) animate(els, values, { duration: 0 }).complete?.();
  }

  const steps = buildSequence(state, { mode: "js", staggerFn: stagger }).map((s) => [Array.from(root.querySelectorAll(s.selector)), s.keyframes, s.options]);
  const options = buildSequenceOptions(state);

  const create = () => {
    try {
      controls?.stop?.();
    } catch {
      /* ignore */
    }
    controls = animate(steps, options);
    return controls;
  };
  create();

  let raf = 0;
  const tick = () => {
    onTick?.(controls ? Math.min(controls.time, controls.duration) : 0, controls ? controls.time < controls.duration : false);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  cleanup.push(() => cancelAnimationFrame(raf));

  let isPlaying = true;
  player.play = () => {
    if (!controls) return;
    if (controls.time >= controls.duration - 0.001) controls.time = 0;
    controls.speed = 1;
    controls.play();
    isPlaying = true;
  };
  player.pause = () => {
    controls?.pause();
    isPlaying = false;
  };
  player.seek = (t) => {
    if (!controls) return;
    controls.pause();
    controls.time = Math.max(0, Math.min(controls.duration, t));
    isPlaying = false;
  };
  player.time = () => controls?.time ?? 0;
  player.playing = () => isPlaying && !!controls && controls.time < controls.duration;
  player.replay = () => {
    create();
    isPlaying = true;
  };

  let isOpen = false;
  const open = () => {
    if (!controls) return;
    isOpen = true;
    controls.speed = 1;
    controls.play();
  };
  const close = () => {
    if (!controls) return;
    isOpen = false;
    controls.speed = -1;
    controls.play();
  };

  switch (state.trigger) {
    case "toggle": {
      setStatus("Click the scene to play, click again to reverse");
      controls.pause();
      controls.time = 0;
      isPlaying = false;
      let timer;
      const onToggle = () => {
        clearTimeout(timer);
        if (isOpen) close();
        else {
          open();
          if (Number(state.toggle?.autoClose) > 0) timer = setTimeout(close, Number(state.toggle.autoClose) * 1000);
        }
      };
      sceneRoot.addEventListener("click", onToggle);
      cleanup.push(() => {
        sceneRoot.removeEventListener("click", onToggle);
        clearTimeout(timer);
      });
      player.replay = () => onToggle();
      break;
    }
    case "inView": {
      setStatus("Scroll the preview to bring the scene into view");
      controls.pause();
      controls.time = 0;
      isPlaying = false;
      cleanup.push(
        inView(
          sceneRoot,
          () => {
            open();
            if (state.inView.once) return;
            return () => close();
          },
          { root: stage, amount: state.inView.amount },
        ),
      );
      player.replay = () => {
        stage.scrollTo({ top: 0 });
        close();
      };
      break;
    }
    case "scroll": {
      setStatus("Scroll the preview: the timeline follows your scroll position");
      cleanup.push(scroll(controls, { container: stage, target: sceneRoot, offset: [state.scroll.offsetStart, state.scroll.offsetEnd] }));
      player.play = player.pause = () => {};
      player.seek = () => {};
      player.replay = () => stage.scrollTo({ top: 0, behavior: "smooth" });
      break;
    }
    case "load":
    default:
      setStatus(`Playing on load · ${duration.toFixed(2)}s`);
  }

  return player;
}

export function stopTimelinePreview() {
  runCleanup();
}
