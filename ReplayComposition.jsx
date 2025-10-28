import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
const getFrameForTime = (timeInSeconds, frames) => {
  if (!frames || frames.length === 0) return null;
  let cumulativeTime = 0;
  for (let i = 0; i < frames.length; i++) {
    cumulativeTime += frames[i].dt;
    if (timeInSeconds < cumulativeTime) {
      return frames[i];
    }
  }
  return frames[frames.length - 1];
};
const ReplayComposition = ({ frames, avatarImgSrc, platformImgSrc, canvasWidth }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeInSeconds = frame / fps;
  const currentReplayFrame = getFrameForTime(timeInSeconds, frames);
  if (!currentReplayFrame) {
    return /* @__PURE__ */ jsxDEV(AbsoluteFill, { style: { backgroundColor: "#3d5a80" } }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 24,
      columnNumber: 16
    });
  }
  const { player, platforms, cameraY } = currentReplayFrame;
  const playerScale = player.scale || 1;
  const scaledWidth = player.width * playerScale;
  const scaledHeight = player.height * playerScale;
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  return /* @__PURE__ */ jsxDEV(AbsoluteFill, { style: { backgroundColor: "#3d5a80", transform: `translateY(${-cameraY}px)` }, children: [
    platforms.map((p, i) => /* @__PURE__ */ jsxDEV(
      Img,
      {
        src: platformImgSrc,
        style: {
          position: "absolute",
          left: p.x,
          top: p.y,
          width: p.width,
          height: p.height
        }
      },
      i,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 37,
        columnNumber: 17
      }
    )),
    /* @__PURE__ */ jsxDEV(
      Img,
      {
        src: avatarImgSrc,
        style: {
          position: "absolute",
          left: centerX - scaledWidth / 2,
          top: centerY - scaledHeight / 2,
          width: scaledWidth,
          height: scaledHeight,
          borderRadius: "50%"
        }
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 49,
        columnNumber: 13
      }
    )
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 35,
    columnNumber: 9
  });
};
export {
  ReplayComposition
};
