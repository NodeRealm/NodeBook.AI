const chat = document.getElementById("chat");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const ageRange = document.getElementById("ageRange");
const detailLevel = document.getElementById("detailLevel");
const lineStyle = document.getElementById("lineStyle");
const copyPromptButton = document.getElementById("copyPrompt");
const promptButtons = document.querySelectorAll(".prompt-buttons button");

const botIntro =
  "Hi! I can help you craft a kid-friendly coloring page prompt. Tell me your idea, and I'll turn it into a clean line-art request.";

let latestPrompt = "";

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

const respondToUser = (text) => {
  const prompt = buildPrompt(text);
  latestPrompt = prompt;
  copyPromptButton.disabled = false;

  appendMessage(prompt, "bot");
  appendMessage(
    "Need another variation? Tell me a new subject, characters, or setting!",
    "bot"
  );
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

copyPromptButton.addEventListener("click", async () => {
  if (!latestPrompt) return;
  await navigator.clipboard.writeText(latestPrompt);
  copyPromptButton.textContent = "Copied!";
  setTimeout(() => {
    copyPromptButton.textContent = "Copy latest prompt";
  }, 1500);
});

appendMessage(botIntro, "bot");
appendMessage(
  "Try adding details like the character, activity, setting, and a fun twist.",
  "bot"
);
copyPromptButton.disabled = true;
