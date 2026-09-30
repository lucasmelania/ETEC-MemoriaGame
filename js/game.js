const grid = document.querySelector(".grid");
const spanPlayer = document.querySelector(".player");
const timer = document.querySelector(".timer");
const notification = document.querySelector(".power-notification");
const powerButtons = [...document.querySelectorAll(".power-button")];
const timingGameElement = document.querySelector(".timing-game");
const timingRing = document.querySelector(".timing-ring");
const timingPointer = document.querySelector(".timing-pointer");
const timingTarget = document.querySelector(".timing-target");
const timingStatus = document.querySelector(".timing-status");
const restartButton = document.querySelector(".restart-button");

const POWER_EFFECT_DURATION = 1050;
const TIMING_DURATION = 2200;
const TIMING_SPEED = 620;

const characters = [
  { id: "master-sword", image: "6.png", label: "Master Sword" },
  { id: "link", image: "2.png", label: "Link" },
  { id: "deku-tree", image: "1.png", label: "Deku Tree" },
  { id: "hylian-shield", image: "4.png", label: "Princesa" },
  { id: "kingdom", image: "5.png", label: "Reino de Hyrule" },
  {
    id: "legend",
    image: "3.png",
    label: "Lenda de Zelda",
    size: "contain",
    color: "#102c25",
  },
];

const powers = {
  vision: 0,
  undo: 0,
  explosion: 0,
};

const powerDetails = {
  vision: { name: "Visão" },
  undo: { name: "Reversão" },
  explosion: { name: "Explosão" },
};

const gameState = {
  firstCard: null,
  secondCard: null,
  isCheckingPair: false,
  isPowerEffectActive: false,
  isFinished: false,
  lastMistake: null,
  seconds: 0,
  timerLoop: null,
  pairTimeoutId: null,
  powerEffectTimeoutId: null,
  rankingSaved: false,
};

const timingGame = {
  active: false,
  resolved: false,
  angle: 0,
  targetAngle: 0,
  targetSize: 30,
  startTime: 0,
  animationFrame: null,
  timeoutId: null,
  resultTimeoutId: null,
};

const createElement = (tag, className) => {
  const element = document.createElement(tag);
  element.className = className;
  return element;
};

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const updateTimerUI = () => {
  timer.textContent = formatTime(gameState.seconds);
};

const showPowerNotification = (message, options = {}) => {
  const { victory = false } = options;

  notification.textContent = message;
  notification.classList.add("is-visible");
  notification.classList.toggle("is-victory", victory);
};

const updatePowerUI = () => {
  powerButtons.forEach((button) => {
    const powerType = button.dataset.power;
    const count = powers[powerType];
    const countElement = button.querySelector("[data-power-count]");
    const isUnavailable =
      count === 0 ||
      gameState.isPowerEffectActive ||
      gameState.isCheckingPair ||
      gameState.firstCard ||
      timingGame.active ||
      gameState.isFinished;

    countElement.textContent = `×${count}`;
    button.disabled = isUnavailable;
  });
};

const getAvailableCards = () => [
  ...document.querySelectorAll(".card:not(.matched-card)"),
];

const getFaceDownCards = () =>
  getAvailableCards().filter((card) => !card.classList.contains("reveal-card"));

const clearSelectedCards = () => {
  gameState.firstCard = null;
  gameState.secondCard = null;
};

const checkEndGame = () => {
  const matchedCards = document.querySelectorAll(".matched-card");

  if (matchedCards.length !== characters.length * 2) {
    return;
  }

  gameState.isFinished = true;
  clearInterval(gameState.timerLoop);
  gameState.timerLoop = null;

  const result = gameState.rankingSaved
    ? { position: 0 }
    : window.HyruleRanking.recordScore(
        spanPlayer.textContent,
        gameState.seconds,
      );
  gameState.rankingSaved = true;
  const rankingMessage = result.position
    ? ` Você ficou em #${result.position} no ranking.`
    : " Continue treinando para entrar no ranking.";

  showPowerNotification(
    `Parabéns, ${spanPlayer.textContent}! Você protegeu Hyrule em ${timer.textContent}.${rankingMessage}`,
    { victory: true },
  );
  updatePowerUI();
};

const finishPowerEffect = (button, cards = []) => {
  cards.forEach((card) => {
    if (!card.classList.contains("matched-card")) {
      card.classList.remove("reveal-card", "power-preview", "vision-preview");
    }
  });

  button.classList.remove("is-active");
  gameState.isPowerEffectActive = false;
  gameState.powerEffectTimeoutId = null;
  updatePowerUI();
};

const startPowerEffect = (
  button,
  cards = [],
  previewClass = "power-preview",
) => {
  gameState.isPowerEffectActive = true;
  button.classList.add("is-active");
  cards.forEach((card) =>
    card.classList.add("reveal-card", "power-preview", previewClass),
  );
  updatePowerUI();

  gameState.powerEffectTimeoutId = window.setTimeout(
    () => finishPowerEffect(button, cards),
    POWER_EFFECT_DURATION,
  );
};

const giveRandomPower = () => {
  const powerTypes = Object.keys(powers);
  const powerType = powerTypes[Math.floor(Math.random() * powerTypes.length)];
  const power = powerDetails[powerType];
  const button = document.querySelector(`[data-power="${powerType}"]`);

  powers[powerType] += 1;
  updatePowerUI();
  button.classList.remove("is-rewarded");
  void button.offsetWidth;
  button.classList.add("is-rewarded");
  return power;
};

const showPowerReward = (power) => {
  showPowerNotification(`PERFEITO! Você ganhou: ${power.name}!`);
};

const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;

const getAngleDistance = (firstAngle, secondAngle) => {
  const difference = Math.abs(
    normalizeAngle(firstAngle) - normalizeAngle(secondAngle),
  );
  return Math.min(difference, 360 - difference);
};

const updateTimingMiniGame = () => {
  const targetRadians = (timingGame.targetAngle * Math.PI) / 180;
  const targetX = 50 + Math.sin(targetRadians) * 43;
  const targetY = 50 - Math.cos(targetRadians) * 43;

  timingPointer.style.transform = `translateX(-50%) rotate(${timingGame.angle}deg)`;
  timingTarget.style.left = `${targetX}%`;
  timingTarget.style.top = `${targetY}%`;
  timingTarget.style.width = `${Math.max(26, timingGame.targetSize * 1.45)}px`;
  timingTarget.style.transform = `translate(-50%, -50%) rotate(${timingGame.targetAngle}deg)`;
};

const stopTimingAnimation = () => {
  window.cancelAnimationFrame(timingGame.animationFrame);
  window.clearTimeout(timingGame.timeoutId);
  window.clearTimeout(timingGame.resultTimeoutId);
  timingGame.animationFrame = null;
  timingGame.timeoutId = null;
  timingGame.resultTimeoutId = null;
};

const closeTimingMiniGame = () => {
  timingGame.active = false;
  timingGame.resolved = false;
  timingGameElement.hidden = true;
  timingGameElement.classList.remove("is-success", "is-failure");
  checkEndGame();
  updatePowerUI();
};

const finishTimingSuccess = () => {
  if (!timingGame.active || timingGame.resolved) {
    return;
  }

  timingGame.resolved = true;
  stopTimingAnimation();
  timingGameElement.classList.add("is-success");
  timingStatus.textContent = "PERFEITO! Recompensa conquistada.";

  const power = giveRandomPower();
  showPowerReward(power);
  timingGame.resultTimeoutId = window.setTimeout(closeTimingMiniGame, 850);
};

const finishTimingFailure = (message = "ERRO!") => {
  if (!timingGame.active || timingGame.resolved) {
    return;
  }

  timingGame.resolved = true;
  stopTimingAnimation();
  timingGameElement.classList.add("is-failure");
  timingStatus.textContent = message;
  showPowerNotification(message);
  timingGame.resultTimeoutId = window.setTimeout(closeTimingMiniGame, 700);
};

const handleTimingClick = () => {
  if (!timingGame.active || timingGame.resolved) {
    return;
  }

  const hitTarget =
    getAngleDistance(timingGame.angle, timingGame.targetAngle) <=
    timingGame.targetSize / 2;

  if (hitTarget) {
    finishTimingSuccess();
    return;
  }

  finishTimingFailure("ERRO! O marcador passou longe do alvo.");
};

const startTimingMiniGame = () => {
  timingGame.active = true;
  timingGame.resolved = false;
  timingGame.angle = Math.floor(Math.random() * 360);
  timingGame.targetAngle = Math.floor(Math.random() * 360);
  timingGame.targetSize = 24 + Math.floor(Math.random() * 13);
  timingGame.startTime = performance.now();
  timingGameElement.hidden = false;
  timingGameElement.classList.remove("is-success", "is-failure");
  timingStatus.textContent = "Agora! Toque quando o marcador cruzar o alvo.";
  updateTimingMiniGame();
  updatePowerUI();

  const animate = (currentTime) => {
    if (!timingGame.active || timingGame.resolved) {
      return;
    }

    timingGame.angle = normalizeAngle(
      ((currentTime - timingGame.startTime) * TIMING_SPEED) / 1000,
    );
    updateTimingMiniGame();
    timingGame.animationFrame = window.requestAnimationFrame(animate);
  };

  timingGame.animationFrame = window.requestAnimationFrame(animate);
  timingGame.timeoutId = window.setTimeout(
    () => finishTimingFailure("ERRO! O tempo acabou."),
    TIMING_DURATION,
  );
};

const checkCards = () => {
  const firstCharacter = gameState.firstCard.dataset.character;
  const secondCharacter = gameState.secondCard.dataset.character;

  if (firstCharacter === secondCharacter) {
    gameState.firstCard.classList.add("matched-card");
    gameState.secondCard.classList.add("matched-card");
    clearSelectedCards();
    gameState.lastMistake = null;
    gameState.isCheckingPair = false;
    startTimingMiniGame();
    updatePowerUI();
    return;
  }

  gameState.lastMistake = {
    firstCard: gameState.firstCard,
    secondCard: gameState.secondCard,
  };

  gameState.pairTimeoutId = window.setTimeout(() => {
    gameState.firstCard?.classList.remove("reveal-card");
    gameState.secondCard?.classList.remove("reveal-card");
    clearSelectedCards();
    gameState.isCheckingPair = false;
    gameState.pairTimeoutId = null;
    updatePowerUI();
  }, 650);
};

const revealCard = ({ currentTarget }) => {
  const card = currentTarget;

  if (
    gameState.isCheckingPair ||
    gameState.isPowerEffectActive ||
    timingGame.active ||
    gameState.isFinished ||
    card.classList.contains("reveal-card") ||
    card.classList.contains("matched-card")
  ) {
    return;
  }

  card.classList.add("reveal-card");

  if (!gameState.firstCard) {
    gameState.firstCard = card;
    updatePowerUI();
    return;
  }

  gameState.secondCard = card;
  gameState.isCheckingPair = true;
  updatePowerUI();
  checkCards();
};

const useVisionPower = (button) => {
  const cardsToReveal = shuffle(getFaceDownCards()).slice(0, 3);

  if (!cardsToReveal.length) {
    return false;
  }

  startPowerEffect(button, cardsToReveal, "vision-preview");
  showPowerNotification("Visão ativada: observe as cartas reveladas.");
  return true;
};

const useUndoPower = (button) => {
  const mistake = gameState.lastMistake;

  if (
    !mistake ||
    !mistake.firstCard.isConnected ||
    mistake.firstCard.classList.contains("matched-card")
  ) {
    showPowerNotification("Ainda não há um erro para reverter.");
    return false;
  }

  const matchingCard = getAvailableCards().find(
    (card) =>
      card !== mistake.firstCard &&
      !card.classList.contains("reveal-card") &&
      card.dataset.character === mistake.firstCard.dataset.character,
  );

  if (!matchingCard) {
    gameState.lastMistake = null;
    showPowerNotification("Não foi possível encontrar a carta correspondente.");
    return false;
  }

  mistake.firstCard.classList.remove("reveal-card", "power-preview");
  mistake.secondCard.classList.remove("reveal-card", "power-preview");
  clearSelectedCards();
  gameState.isCheckingPair = false;
  gameState.lastMistake = null;
  startPowerEffect(button, [matchingCard]);
  showPowerNotification(
    "Reversão ativada: a carta correspondente foi revelada.",
  );
  return true;
};

const getCardsNear = (anchor, cards, limit = 4) => {
  const anchorBox = anchor.getBoundingClientRect();
  const anchorCenter = {
    x: anchorBox.left + anchorBox.width / 2,
    y: anchorBox.top + anchorBox.height / 2,
  };

  return cards
    .map((card) => {
      const box = card.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      return {
        card,
        distance: Math.hypot(x - anchorCenter.x, y - anchorCenter.y),
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ card }) => card);
};

const useExplosionPower = (button) => {
  const faceDownCards = getFaceDownCards();

  if (!faceDownCards.length) {
    return false;
  }

  const anchor =
    faceDownCards[Math.floor(Math.random() * faceDownCards.length)];
  const cardsToReveal = getCardsNear(anchor, faceDownCards);
  startPowerEffect(button, cardsToReveal);
  showPowerNotification(
    "Explosão ativada: uma área do tabuleiro foi revelada.",
  );
  return true;
};

const usePower = (powerType, button) => {
  if (
    !powers[powerType] ||
    gameState.isPowerEffectActive ||
    gameState.isCheckingPair ||
    gameState.firstCard ||
    timingGame.active ||
    gameState.isFinished
  ) {
    return;
  }

  const powerActions = {
    vision: useVisionPower,
    undo: useUndoPower,
    explosion: useExplosionPower,
  };

  const wasUsed = powerActions[powerType](button);

  if (!wasUsed) {
    return;
  }

  powers[powerType] -= 1;
  updatePowerUI();
};

const createCard = ({
  id,
  image,
  label,
  position = "center",
  size = "cover",
  color = "#102c25",
}) => {
  const card = createElement("button", "card");
  const front = createElement("span", "face front");
  const back = createElement("span", "face back");

  card.type = "button";
  card.dataset.character = id;
  card.setAttribute("aria-label", "Carta virada para baixo");
  front.dataset.title = label;
  front.style.backgroundColor = color;
  front.style.backgroundImage = `url('../images/${image}')`;
  front.style.backgroundPosition = position;
  front.style.backgroundSize = size;

  card.append(front, back);
  card.addEventListener("click", revealCard);

  return card;
};

const loadGame = () => {
  const cards = shuffle([...characters, ...characters]);
  cards.forEach((character) => grid.appendChild(createCard(character)));
};

const startTimer = () => {
  gameState.timerLoop = window.setInterval(() => {
    gameState.seconds += 1;
    updateTimerUI();
  }, 1000);
};

const restartGame = () => {
  clearInterval(gameState.timerLoop);
  window.clearTimeout(gameState.pairTimeoutId);
  window.clearTimeout(gameState.powerEffectTimeoutId);
  gameState.timerLoop = null;
  gameState.pairTimeoutId = null;
  gameState.powerEffectTimeoutId = null;
  stopTimingAnimation();

  Object.keys(powers).forEach((powerType) => {
    powers[powerType] = 0;
  });
  Object.assign(gameState, {
    firstCard: null,
    secondCard: null,
    isCheckingPair: false,
    isPowerEffectActive: false,
    isFinished: false,
    lastMistake: null,
    seconds: 0,
    rankingSaved: false,
  });
  timingGame.active = false;
  timingGame.resolved = false;
  timingGameElement.hidden = true;
  timingGameElement.classList.remove("is-success", "is-failure");
  notification.textContent = "";
  notification.classList.remove("is-visible", "is-victory");
  powerButtons.forEach((button) =>
    button.classList.remove("is-active", "is-rewarded"),
  );
  grid.replaceChildren();

  updateTimerUI();
  updatePowerUI();
  loadGame();
  startTimer();
};

const startGame = () => {
  spanPlayer.textContent = localStorage.getItem("player") || "Aventureiro";
  powerButtons.forEach((button) => {
    button.addEventListener("click", () =>
      usePower(button.dataset.power, button),
    );
  });
  timingRing.addEventListener("click", handleTimingClick);
  restartButton.addEventListener("click", restartGame);

  updateTimerUI();
  updatePowerUI();
  loadGame();
  startTimer();
};

window.addEventListener("DOMContentLoaded", startGame);
