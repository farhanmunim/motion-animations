/**
 * Timeline mode: wires the store, preview, timeline editor, inspector,
 * library and code views together. Exposes a controller the shell uses.
 */
import { createTimelineStore, makeAction } from "./state.js";
import { renderTimelinePreview, stopTimelinePreview } from "./preview.js";
import { createTimeline } from "./timeline.js";
import { renderTimelineLibrary, renderTimelineDesign } from "./ui.js";
import { generateTimelineAll } from "./codegen.js";
import { sceneElements } from "./scenes.js";
import { renderCode } from "../ui.js";
import { TIMELINE_PRESETS } from "./presets.js";
import { clone } from "../state.js";

export function mountTimeline({ library, stage, timelineEl, design, code, exportBody, setStatus, toast }) {
  const first = TIMELINE_PRESETS[0];
  const store = createTimelineStore({ ...clone(first.state), name: first.name, presetId: first.id });
  let player = null;
  let previewTimer;

  const timeline = createTimeline(timelineEl, store, {});

  const elements = () => sceneElements(store.get().scene);

  const preview = () => {
    player = renderTimelinePreview(stage, store.get(), {
      setStatus,
      onTick: (t, playing) => timeline.tick(t, playing),
      onSelectElement: (elId) => {
        const state = store.get();
        const a = state.actions.find((x) => x.el === elId);
        if (a) store.patch({ selected: a.id }, { rerender: true });
        else {
          // No action yet: start one so the element shows up on the timeline.
          store.addAction(makeAction({ el: elId, prop: "opacity", from: 0, to: 1, at: 0, duration: 0.6 }), { rerender: true });
          toast(`Added a fade to ${elements().find((e) => e.id === elId)?.label || elId}`);
        }
      },
    });
    timeline.setPlayer(player);
  };

  const drawAll = (meta = {}) => {
    const structural = meta.rerender !== false;
    if (structural) {
      renderTimelineDesign(design, store, { onToast: toast });
      renderTimelineLibrary(library, store, { onToast: toast });
    }
    timeline.render(elements());
    renderCode(code, null, { onToast: toast, code: generateTimelineAll(store.get()) });
    if (!exportBody.closest(".app-modal-backdrop").classList.contains("hidden")) {
      renderCode(exportBody, null, { onToast: toast, full: true, code: generateTimelineAll(store.get()) });
    }
    clearTimeout(previewTimer);
    previewTimer = setTimeout(preview, structural ? 0 : 150);
  };

  store.subscribe((state, meta) => {
    if (meta.timelineOnly) {
      timeline.render(elements());
      return;
    }
    drawAll(meta);
  });

  drawAll({ rerender: true });

  return {
    replay: () => player?.replay(),
    refresh: () => preview(),
    reset: () => {
      store.replace({ actions: [], name: "Untitled sequence", presetId: null, scene: store.get().scene }, { rerender: true });
      toast("Blank timeline. Add an action to start.");
    },
    shareUrl: () => store.shareUrl(),
    renderExport: (container) => renderCode(container, null, { onToast: toast, full: true, code: generateTimelineAll(store.get()) }),
    undo: () => store.undo(),
    destroy: () => {
      clearTimeout(previewTimer);
      stopTimelinePreview();
    },
  };
}
