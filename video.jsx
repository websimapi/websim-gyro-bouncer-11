import React from "react";
import { createRoot } from "react-dom/client";
import { renderMedia } from "@remotion/player";
import { ReplayComposition } from "./ReplayComposition.jsx";
let root = null;
const FPS = 60;
async function renderAndDownloadReplay(replayData, onProgress, onFinish) {
  const totalDurationSeconds = replayData.frames.reduce((total, frame) => total + frame.dt, 0);
  const durationInFrames = Math.ceil(totalDurationSeconds * FPS);
  const compositionWidth = 540;
  const compositionHeight = 960;
  try {
    const blob = await renderMedia({
      component: ReplayComposition,
      durationInFrames,
      fps: FPS,
      compositionWidth,
      compositionHeight,
      inputProps: {
        frames: replayData.frames,
        avatarImgSrc: replayData.avatarImgSrc,
        platformImgSrc: replayData.platformImgSrc,
        canvasWidth: replayData.canvasWidth
      },
      codec: "h264",
      onProgress: (p) => onProgress(p.progress)
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gyro-bouncer-replay.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error rendering video:", err);
    alert("Sorry, there was an error rendering your replay video.");
  } finally {
    onFinish();
  }
}
export {
  renderAndDownloadReplay
};
