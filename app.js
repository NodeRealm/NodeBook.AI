const chat = document.getElementById("chat");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const ageRange = document.getElementById("ageRange");
const detailLevel = document.getElementById("detailLevel");
const lineStyle = document.getElementById("lineStyle");
const copyPromptButton = document.getElementById("copyPrompt");
const generatePageButton = document.getElementById("generatePage");
const downloadSvgButton = document.getElementById("downloadSvg");
const canvas = document.getElementById("canvas");
const promptButtons = document.querySelectorAll(".prompt-buttons button");

const botIntro =
  "Hi! Share a fun idea and I'll make a kid-friendly coloring page for you.";

let latestPrompt = "";
let latestSvg = "";

const appendMessage = (text, sender) => {
  const message = document.createElement("div");
  message.className = `message ${sender}`;
  message.textContent = text;
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
};

const findAgeHint = (text) => {
  const match = text.match(/\b(\d{1,2})\b/);
  if (!match) return ageRange.value;
  const age = Number(match[1]);
  if (age <= 5) return "ages 3-5";
  if (age <= 7) return "ages 5-7";
  return "ages 7-9";
};

const buildPrompt = (idea) => {
  const ageHint = findAgeHint(idea);
  const detailHint = detailLevel.value;
  const lineHint = lineStyle.value;
  const sanitizedIdea = idea.trim().replace(/^\s+/, "");
  const subject = sanitizedIdea.length
    ? sanitizedIdea
    : "a friendly animal doing something fun";

  return `Create a black-and-white coloring book page for ${ageHint}. The scene should feature ${subject}. Use ${detailHint}. Keep the background simple, add a few easy props, and make sure the characters have happy expressions. Use ${lineHint}, no shading, and leave plenty of open space for coloring.`;
};

const seedFromString = (text) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed) => {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = (rng, options) =>
  options[Math.floor(rng() * options.length)];

const drawCircle = (cx, cy, r) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" />`;

const drawRect = (x, y, w, h, rx = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" />`;

const drawLine = (x1, y1, x2, y2) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;

const drawCloud = (x, y) =>
  [
    drawCircle(x, y, 24),
    drawCircle(x + 28, y - 10, 20),
    drawCircle(x + 52, y, 26),
    drawRect(x - 8, y, 72, 28, 12),
  ].join("");

const drawTree = (x, y) =>
  [
    drawRect(x + 30, y + 80, 28, 70, 8),
    drawCircle(x + 44, y + 60, 40),
    drawCircle(x + 15, y + 80, 28),
    drawCircle(x + 72, y + 80, 28),
  ].join("");

const drawHouse = (x, y) =>
  [
    `<polygon points="${x},${y + 70} ${x + 70},${y} ${x + 140},${y + 70}" />`,
    drawRect(x + 16, y + 70, 108, 90, 10),
    drawRect(x + 54, y + 110, 32, 50, 6),
    drawRect(x + 28, y + 90, 24, 24, 4),
    drawRect(x + 88, y + 90, 24, 24, 4),
  ].join("");

const drawCupcake = (x, y) =>
  [
    drawRect(x + 20, y + 70, 80, 60, 10),
    `<path d="M${x + 20} ${y + 70} Q${x + 60} ${y + 20} ${x + 100} ${y + 70} Z" />`,
    drawCircle(x + 60, y + 36, 14),
  ].join("");

const drawRocket = (x, y) =>
  [
    `<path d="M${x + 60} ${y} Q${x + 100} ${y + 60} ${x + 60} ${y + 120} Q${x + 20} ${y + 60} ${x + 60} ${y} Z" />`,
    drawCircle(x + 60, y + 60, 18),
    `<polygon points="${x + 40},${y + 110} ${x + 20},${y + 140} ${x + 50},${y + 130}" />`,
    `<polygon points="${x + 80},${y + 110} ${x + 100},${y + 140} ${x + 70},${y + 130}" />`,
  ].join("");

const drawPuppy = (x, y) =>
  [
    drawCircle(x + 50, y + 50, 40),
    drawCircle(x + 30, y + 20, 16),
    drawCircle(x + 70, y + 20, 16),
    drawCircle(x + 36, y + 50, 6),
    drawCircle(x + 64, y + 50, 6),
    `<path d="M${x + 40} ${y + 70} Q${x + 50} ${y + 78} ${x + 60} ${y + 70}" />`,
    drawRect(x + 30, y + 90, 20, 40, 8),
    drawRect(x + 60, y + 90, 20, 40, 8),
  ].join("");

const drawStars = (rng, count) => {
  const stars = [];
  for (let i = 0; i < count; i += 1) {
    const x = 60 + rng() * 680;
    const y = 60 + rng() * 200;
    const r = 4 + rng() * 6;
    stars.push(drawCircle(x, y, r));
  }
  return stars.join("");
};

const buildScene = (idea) => {
  const seed = seedFromString(idea);
  const rng = mulberry32(seed);
  const lowerIdea = idea.toLowerCase();
  const theme =
    lowerIdea.includes("space") || lowerIdea.includes("astronaut")
      ? "space"
      : lowerIdea.includes("bakery") || lowerIdea.includes("cupcake")
      ? "bakery"
      : lowerIdea.includes("forest") || lowerIdea.includes("tree")
      ? "forest"
      : lowerIdea.includes("puppy") || lowerIdea.includes("dog")
      ? "puppy"
      : pick(rng, ["forest", "puppy", "bakery", "space"]);

  const elements = [];

  elements.push(drawLine(60, 820, 740, 820));
  elements.push(drawLine(60, 860, 740, 860));

  if (theme === "space") {
    elements.push(drawRocket(320, 260));
    elements.push(drawStars(rng, 10));
    elements.push(drawCircle(140, 240, 50));
  }

  if (theme === "bakery") {
    elements.push(drawRect(120, 260, 520, 320, 24));
    elements.push(drawRect(200, 320, 360, 200, 20));
    elements.push(drawCupcake(320, 360));
  }

  if (theme === "forest") {
    elements.push(drawTree(120, 320));
    elements.push(drawTree(360, 280));
    elements.push(drawTree(540, 330));
    elements.push(drawCloud(140, 140));
    elements.push(drawCloud(480, 120));
  }

  if (theme === "puppy") {
    elements.push(drawPuppy(300, 380));
    elements.push(drawHouse(120, 320));
    elements.push(drawCloud(520, 140));
  }

  if (theme !== "space") {
    elements.push(drawCircle(640, 140, 50));
  }

  return elements.join("");
};

const buildColoringPage = (idea) => {
  const strokeWidth = lineStyle.value.includes("bold") ? 6 : 4;
  const detail = detailLevel.value.includes("intricate") ? 12 : 8;
  const border = drawRect(40, 40, 720, 920, 32);
  const rng = mulberry32(seedFromString(idea));
  const accentDots = Array.from({ length: detail }).map(() => {
    const x = 80 + rng() * 640;
    const y = 120 + rng() * 640;
    return drawCircle(x, y, 8);
  });

  return `
    <svg viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#111" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
        ${border}
        ${buildScene(idea)}
      </g>
      <g fill="none" stroke="#111" stroke-width="${strokeWidth / 2}" stroke-linecap="round" stroke-linejoin="round">
        ${accentDots.join("")}
      </g>
    </svg>
  `;
};

const renderSvg = (svg) => {
  canvas.innerHTML = svg;
  latestSvg = svg;
  downloadSvgButton.disabled = false;
};

const respondToUser = (text) => {
  const prompt = buildPrompt(text);
  latestPrompt = prompt;
  copyPromptButton.disabled = false;
  appendMessage(prompt, "bot");
  appendMessage(
    "I created a full page preview on the right. Want another one?",
    "bot"
  );
  renderSvg(buildColoringPage(text));
};

const handleSend = (text) => {
  if (!text.trim()) return;
  appendMessage(text, "user");
  respondToUser(text);
};

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleSend(userInput.value);
  userInput.value = "";
});

promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleSend(button.dataset.prompt);
  });
});

generatePageButton.addEventListener("click", () => {
  const idea = userInput.value.trim();
  if (!idea) return;
  handleSend(idea);
  userInput.value = "";
});

copyPromptButton.addEventListener("click", async () => {
  if (!latestPrompt) return;
  await navigator.clipboard.writeText(latestPrompt);
  copyPromptButton.textContent = "Copied!";
  setTimeout(() => {
    copyPromptButton.textContent = "Copy latest prompt";
  }, 1500);
});

downloadSvgButton.addEventListener("click", () => {
  if (!latestSvg) return;
  const blob = new Blob([latestSvg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "coloring-page.svg";
  link.click();
  URL.revokeObjectURL(url);
});

appendMessage(botIntro, "bot");
appendMessage(
  "Tip: include characters, activity, and setting to guide the page layout.",
  "bot"
);
copyPromptButton.disabled = true;
downloadSvgButton.disabled = true;
