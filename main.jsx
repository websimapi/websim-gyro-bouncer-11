import { Player as GamePlayer } from "./player.js";
import { PlatformManager } from "./platforms.js";
import { Controls } from "./controls.js";
import { Replay } from "./replay.js";
import { renderAndDownloadReplay } from "./video.jsx";
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const replayCanvas = document.getElementById("replay-canvas");
const replayCtx = replayCanvas.getContext("2d");
const loadingScreen = document.getElementById("loading-screen");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const scoreDisplay = document.getElementById("score-display");
const scoreEl = document.getElementById("score");
const finalScoreEl = document.getElementById("final-score");
const highScoreEl = document.getElementById("high-score");
const downloadReplayButton = document.getElementById("download-replay-button");
const videoModal = document.getElementById("video-modal");
const closeVideoModalButton = document.getElementById("close-video-modal-button");
let player, platformManager, replay;
let cameraY = 0;
let score = 0;
let gameState = "start";
let lastTime = 0;
let isRendering = false;
const platformImg = new Image();
platformImg.src = "platform.png";
let userAvatarImg = null;
let avatarLoadFailed = false;
const controls = new Controls();
async function preload() {
  uiState("loading");
  try {
    const room = new WebsimSocket();
    await room.initialize();
    const client = room.peers[room.clientId];
    if (client && client.avatarUrl) {
      userAvatarImg = await loadImageWithProxies(client.avatarUrl);
      if (!userAvatarImg) {
        avatarLoadFailed = true;
        alert("Your avatar could not be loaded. Please try again or check your profile picture.");
      }
    } else {
      avatarLoadFailed = true;
      alert("You don't seem to have a profile picture. Please set one to play.");
    }
  } catch (e) {
    avatarLoadFailed = true;
    console.error("Websim socket failed to initialize, cannot fetch avatar:", e);
    alert("Could not connect to get your profile. Please refresh and try again.");
  }
  uiState("start");
}
function main() {
  preload();
  requestAnimationFrame(gameLoop);
}
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const replayRect = replayCanvas.getBoundingClientRect();
  if (replayRect.width > 0 && replayRect.height > 0) {
    replayCanvas.width = replayRect.width * window.devicePixelRatio;
    replayCanvas.height = replayRect.height * window.devicePixelRatio;
  }
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
async function loadImageWithProxies(url) {
  const proxies = [
    "",
    // Direct attempt first
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?"
  ];
  for (const proxy of proxies) {
    const proxyUrl = proxy + url;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = proxyUrl;
      });
      console.log(`Successfully loaded image from: ${proxyUrl}`);
      return img;
    } catch (error) {
      console.warn(`Failed to load image from: ${proxyUrl}`, error);
    }
  }
  return null;
}
async function init() {
  if (avatarLoadFailed) {
    alert("Cannot start the game because your avatar failed to load. Please refresh the page.");
    return;
  }
  if (!userAvatarImg) {
    alert("Avatar not loaded yet. Please wait.");
    return;
  }
  player = new GamePlayer(canvas.width / 2, canvas.height - 100, userAvatarImg);
  player.image = userAvatarImg;
  platformManager = new PlatformManager(canvas.width, canvas.height, platformImg);
  platformManager.generateInitialPlatforms();
  replay = new Replay();
  cameraY = 0;
  score = 0;
  scoreEl.textContent = 0;
  uiState("game");
  if (gameState !== "playing") {
    gameState = "playing";
    requestAnimationFrame(gameLoop);
  }
}
function uiState(state) {
  loadingScreen.classList.add("hidden");
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  scoreDisplay.classList.add("hidden");
  if (state === "loading") {
    loadingScreen.classList.remove("hidden");
  } else if (state === "start") {
    startScreen.classList.remove("hidden");
  } else if (state === "game") {
    scoreDisplay.classList.remove("hidden");
  } else if (state === "over") {
    finalScoreEl.textContent = score;
    let highScore = parseInt(localStorage.getItem("gyroBouncerHighScore")) || 0;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("gyroBouncerHighScore", highScore);
    }
    highScoreEl.textContent = highScore;
    gameOverScreen.classList.remove("hidden");
    resizeCanvas();
    replay.startPlayback(60);
  }
}
function update(deltaTime) {
  const tilt = controls.getTilt();
  player.update(tilt, platformManager.platforms, canvas.width, deltaTime);
  if (player.y < cameraY + canvas.height / 2.5) {
    cameraY = player.y - canvas.height / 2.5;
  }
  score = Math.max(score, Math.floor(-cameraY / 10));
  scoreEl.textContent = score;
  platformManager.update(cameraY);
  if (player.y > cameraY + canvas.height) {
    gameState = "gameOver";
    uiState("over");
  }
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(0, -cameraY);
  platformManager.draw(ctx);
  player.draw(ctx);
  ctx.restore();
}
function drawReplay(deltaTime) {
  const frame = replay.getPlaybackFrame(deltaTime);
  if (!frame) return;
  replayCtx.clearRect(0, 0, replayCanvas.width, replayCanvas.height);
  const scaleX = replayCanvas.width / canvas.width;
  const scaleY = replayCanvas.height / (canvas.width * (16 / 9));
  const scale = Math.min(scaleX, scaleY);
  replayCtx.save();
  replayCtx.scale(replayCanvas.width / canvas.width, replayCanvas.width / canvas.width);
  replayCtx.translate(0, -frame.cameraY);
  for (const p of frame.platforms) {
    replayCtx.drawImage(platformImg, p.x, p.y, p.width, p.height);
  }
  const playerFrame = frame.player;
  if (userAvatarImg && userAvatarImg.complete) {
    replayCtx.save();
    const scale2 = playerFrame.scale || 1;
    const scaledWidth = playerFrame.width * scale2;
    const scaledHeight = playerFrame.height * scale2;
    const centerX = playerFrame.x + playerFrame.width / 2;
    const centerY = playerFrame.y + playerFrame.height / 2;
    replayCtx.beginPath();
    replayCtx.arc(centerX, centerY, playerFrame.width / 2, 0, Math.PI * 2, true);
    replayCtx.closePath();
    replayCtx.clip();
    replayCtx.drawImage(
      userAvatarImg,
      centerX - scaledWidth / 2,
      centerY - scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );
    replayCtx.restore();
  }
  replayCtx.restore();
}
function gameLoop(timestamp) {
  if (!lastTime) {
    lastTime = timestamp;
  }
  const deltaTime = (timestamp - lastTime) / 1e3;
  lastTime = timestamp;
  const clampedDeltaTime = Math.min(deltaTime, 0.1);
  if (gameState === "playing") {
    update(clampedDeltaTime);
    draw();
    replay.recordFrame(player, platformManager.platforms, cameraY, clampedDeltaTime);
  } else if (gameState === "gameOver" && replay.isPlaying) {
    drawReplay(clampedDeltaTime);
  }
  requestAnimationFrame(gameLoop);
}
startButton.addEventListener("click", () => {
  controls.requestPermission().then((granted) => {
    if (granted) {
      init();
    } else {
      alert("Motion sensor access is required to play this game.");
    }
  }).catch(console.error);
});
restartButton.addEventListener("click", () => {
  lastTime = 0;
  init();
});
downloadReplayButton.addEventListener("click", () => {
  if (isRendering) {
    alert("A render is already in progress.");
    return;
  }
  if (!replay || replay.frames.length === 0) {
    alert("No replay data available.");
    return;
  }
  isRendering = true;
  downloadReplayButton.classList.add("rendering");
  downloadReplayButton.title = "Rendering... Please wait.";
  renderAndDownloadReplay(
    {
      frames: replay.frames,
      avatarImgSrc: userAvatarImg.src,
      platformImgSrc: platformImg.src,
      canvasWidth: canvas.width
    },
    (progress) => {
      console.log(`Rendering progress: ${Math.round(progress * 100)}%`);
      downloadReplayButton.title = `Rendering... ${Math.round(progress * 100)}%`;
    },
    () => {
      isRendering = false;
      downloadReplayButton.classList.remove("rendering");
      downloadReplayButton.title = "Download Replay";
    }
  );
});
closeVideoModalButton.addEventListener("click", () => {
  videoModal.classList.add("hidden");
});
main();
