import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@websim/remotion/player";
import { ReplayComposition } from "./ReplayComposition.jsx";
let root = null;
const FPS = 60;
function renderReplayVideo(replayData) {
  const container = document.getElementById("video-player-container");
  if (!container) return;
  const totalDurationSeconds = replayData.frames.reduce((total, frame) => total + frame.dt, 0);
  const durationInFrames = Math.ceil(totalDurationSeconds * FPS);
  const compositionWidth = 540;
  const compositionHeight = 960;
  if (!root) {
    root = createRoot(container);
  }
  root.render(
    /* @__PURE__ */ jsxDEV(
      Player,
      {
        component: ReplayComposition,
        durationInFrames,
        fps: FPS,
        compositionWidth,
        compositionHeight,
        loop: true,
        controls: true,
        autoplay: true,
        style: { width: "100%", height: "100%" },
        inputProps: {
          frames: replayData.frames,
          avatarImgSrc: replayData.avatarImgSrc,
          platformImgSrc: replayData.platformImgSrc,
          canvasWidth: replayData.canvasWidth
        }
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 24,
        columnNumber: 5
      },
      this
    )
  );
}
function unmountReplayVideo() {
  if (root) {
    root.unmount();
    root = null;
  }
}
export {
  renderReplayVideo,
  unmountReplayVideo
};
