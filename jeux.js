const params = new URLSearchParams(window.location.search);
const requestedDay = Number(params.get("jour"));
const dayLabel = document.getElementById("day-label");
const gamePanels = Array.from(document.querySelectorAll(".game-panel"));
const gameByDay = {
  2: "memory",
  6: "reaction",
  10: "quiz",
  14: "sequence",
  18: "sort",
  22: "word",
};
const selectedGame = gameByDay[requestedDay];

dayLabel.textContent = selectedGame ? `Jeu du jour ${requestedDay}` : "";
gamePanels.forEach((panel) => {
  panel.hidden = panel.id !== `game-${selectedGame || "unavailable"}`;
});

// Memory : retrouve les huit paires.
const memoryBoard = document.getElementById("memory-board");
const memoryStatus = document.getElementById("memory-status");
const memorySymbols = ["🎁", "❄️", "🎄", "⭐", "🍪", "🧦", "🔔", "🦌"];
let memoryCards = [];
let revealedCards = [];
let matchedPairs = 0;
let memoryLocked = false;

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function startMemory() {
  memoryCards = shuffle(memorySymbols.flatMap((symbol, pair) => [
    { symbol, pair },
    { symbol, pair },
  ]));
  revealedCards = [];
  matchedPairs = 0;
  memoryLocked = false;
  memoryStatus.textContent = "À toi de jouer !";
  memoryBoard.replaceChildren();

  memoryCards.forEach((card, index) => {
    const button = document.createElement("button");
    button.className = "memory-card";
    button.type = "button";
    button.textContent = "❄️";
    button.setAttribute("aria-label", `Carte ${index + 1}, cachée`);
    button.addEventListener("click", () => revealMemoryCard(index, button));
    memoryBoard.appendChild(button);
  });
}

function revealMemoryCard(index, button) {
  if (memoryLocked || button.classList.contains("is-revealed") || button.classList.contains("is-matched")) return;
  button.classList.add("is-revealed");
  button.textContent = memoryCards[index].symbol;
  button.setAttribute("aria-label", `Carte ${index + 1} : ${memoryCards[index].symbol}`);
  revealedCards.push({ index, button });
  if (revealedCards.length < 2) return;

  const [first, second] = revealedCards;
  if (memoryCards[first.index].pair === memoryCards[second.index].pair) {
    first.button.classList.add("is-matched");
    second.button.classList.add("is-matched");
    revealedCards = [];
    matchedPairs += 1;
    memoryStatus.textContent = matchedPairs === memorySymbols.length
      ? "Bravo, toutes les paires sont trouvées ! 🎉"
      : `${matchedPairs} paire${matchedPairs > 1 ? "s" : ""} trouvée${matchedPairs > 1 ? "s" : ""} !`;
    return;
  }

  memoryLocked = true;
  memoryStatus.textContent = "Pas la même paire, réessaie !";
  window.setTimeout(() => {
    revealedCards.forEach(({ index: hiddenIndex, button: hiddenButton }) => {
      hiddenButton.classList.remove("is-revealed");
      hiddenButton.textContent = "❄️";
      hiddenButton.setAttribute("aria-label", `Carte ${hiddenIndex + 1}, cachée`);
    });
    revealedCards = [];
    memoryLocked = false;
    memoryStatus.textContent = "À toi de jouer !";
  }, 850);
}

document.getElementById("memory-reset").addEventListener("click", startMemory);
startMemory();

// Réflexes : attrape autant de cadeaux que possible en 15 secondes.
const reactionArea = document.getElementById("reaction-area");
const reactionTarget = document.getElementById("reaction-target");
const reactionHint = reactionArea.querySelector(".reaction-hint");
const reactionScore = document.getElementById("reaction-score");
const reactionTime = document.getElementById("reaction-time");
const reactionStart = document.getElementById("reaction-start");
let reactionInterval = null;
let reactionPoints = 0;
let secondsLeft = 15;

function moveReactionTarget() {
  const maxLeft = Math.max(0, reactionArea.clientWidth - reactionTarget.offsetWidth);
  const maxTop = Math.max(0, reactionArea.clientHeight - reactionTarget.offsetHeight);
  reactionTarget.style.left = `${Math.random() * maxLeft}px`;
  reactionTarget.style.top = `${Math.random() * maxTop}px`;
}

reactionStart.addEventListener("click", () => {
  window.clearInterval(reactionInterval);
  reactionPoints = 0;
  secondsLeft = 15;
  reactionScore.textContent = "Score : 0";
  reactionTime.textContent = "Temps : 15 s";
  reactionStart.disabled = true;
  reactionStart.textContent = "À toi !";
  reactionTarget.hidden = false;
  reactionHint.hidden = true;
  moveReactionTarget();

  reactionInterval = window.setInterval(() => {
    secondsLeft -= 1;
    reactionTime.textContent = `Temps : ${secondsLeft} s`;
    if (secondsLeft <= 0) {
      window.clearInterval(reactionInterval);
      reactionTarget.hidden = true;
      reactionHint.hidden = false;
      reactionStart.disabled = false;
      reactionStart.textContent = "Rejouer";
      reactionScore.textContent = `Terminé ! Score : ${reactionPoints}`;
    }
  }, 1000);
});

reactionTarget.addEventListener("click", () => {
  if (reactionTarget.hidden || secondsLeft <= 0) return;
  reactionPoints += 1;
  reactionScore.textContent = `Score : ${reactionPoints}`;
  moveReactionTarget();
});

// Quiz de cinq questions.
const quizQuestions = [
  { question: "Quelle couleur associe-t-on souvent au costume du Père Noël ?", answers: ["Violet", "Rouge", "Turquoise"], correct: 1 },
  { question: "Quel animal tire traditionnellement le traîneau du Père Noël ?", answers: ["Un pingouin", "Un renne", "Un ours"], correct: 1 },
  { question: "Sous quoi trouve-t-on les cadeaux ?", answers: ["Le canapé", "La cheminée", "Le sapin"], correct: 2 },
  { question: "Quel biscuit laisse-t-on parfois au Père Noël ?", answers: ["Une frite", "Un cookie", "Une olive"], correct: 1 },
  { question: "Que fait-on avec une boule de neige ?", answers: ["On la lance", "On la plante", "On la boit"], correct: 0 },
];
let quizIndex = 0;
let quizPoints = 0;
let quizAnswered = false;
const quizProgress = document.getElementById("quiz-progress");
const quizQuestion = document.getElementById("quiz-question");
const quizAnswers = document.getElementById("quiz-answers");
const quizStatus = document.getElementById("quiz-status");
const quizRestart = document.getElementById("quiz-restart");

function startQuiz() {
  quizIndex = 0;
  quizPoints = 0;
  quizAnswered = false;
  quizRestart.hidden = true;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const item = quizQuestions[quizIndex];
  quizProgress.textContent = `Question ${quizIndex + 1} / ${quizQuestions.length}`;
  quizQuestion.textContent = item.question;
  quizStatus.textContent = "Choisis une réponse.";
  quizAnswers.replaceChildren();
  item.answers.forEach((answer, answerIndex) => {
    const button = document.createElement("button");
    button.className = "quiz-answer";
    button.type = "button";
    button.textContent = answer;
    button.addEventListener("click", () => answerQuiz(button, answerIndex));
    quizAnswers.appendChild(button);
  });
}

function answerQuiz(selectedButton, answerIndex) {
  if (quizAnswered) return;
  quizAnswered = true;
  const correctIndex = quizQuestions[quizIndex].correct;
  const answerButtons = Array.from(quizAnswers.querySelectorAll("button"));
  answerButtons.forEach((button) => { button.disabled = true; });
  if (answerIndex === correctIndex) {
    quizPoints += 1;
    selectedButton.classList.add("is-correct");
    quizStatus.textContent = "Bonne réponse ! 🎄";
  } else {
    selectedButton.classList.add("is-wrong");
    answerButtons[correctIndex].classList.add("is-correct");
    quizStatus.textContent = "Pas tout à fait !";
  }

  window.setTimeout(() => {
    quizIndex += 1;
    quizAnswered = false;
    if (quizIndex < quizQuestions.length) {
      renderQuizQuestion();
      return;
    }
    quizProgress.textContent = "Quiz terminé";
    quizQuestion.textContent = `Tu as obtenu ${quizPoints} / ${quizQuestions.length} bonnes réponses !`;
    quizAnswers.replaceChildren();
    quizStatus.textContent = quizPoints === quizQuestions.length
      ? "Champion·ne de Noël ! ✨"
      : "Bien joué, tu peux retenter ta chance.";
    quizRestart.hidden = false;
  }, 850);
}

quizRestart.addEventListener("click", startQuiz);
startQuiz();

// Séquence lumineuse : répète les couleurs dans le bon ordre.
const sequenceButtons = Array.from(document.querySelectorAll(".sequence-button"));
const sequenceStatus = document.getElementById("sequence-status");
const sequenceStart = document.getElementById("sequence-start");
let sequence = [];
let sequenceStep = 0;
let sequenceRound = 0;
let sequencePlaying = false;

function playSequence() {
  sequencePlaying = true;
  sequenceStart.disabled = true;
  sequenceButtons.forEach((button) => { button.disabled = true; });
  sequenceStatus.textContent = `Regarde bien — manche ${sequenceRound} sur 5.`;
  sequence.forEach((colorIndex, index) => {
    window.setTimeout(() => {
      const button = sequenceButtons[colorIndex];
      button.classList.add("is-lit");
      window.setTimeout(() => button.classList.remove("is-lit"), 360);
    }, 650 * index + 350);
  });
  window.setTimeout(() => {
    sequencePlaying = false;
    sequenceStart.disabled = false;
    sequenceStep = 0;
    sequenceButtons.forEach((button) => { button.disabled = false; });
    sequenceStatus.textContent = "À toi ! Répète la séquence.";
  }, 650 * sequence.length + 350);
}

function startSequence() {
  sequence = [];
  sequenceRound = 1;
  sequenceButtons.forEach((button) => { button.disabled = true; });
  sequenceStart.textContent = "Recommencer";
  sequence.push(Math.floor(Math.random() * sequenceButtons.length));
  playSequence();
}

sequenceButtons.forEach((button) => button.addEventListener("click", () => {
  if (sequencePlaying || sequenceRound === 0) return;
  const pressedColor = Number(button.dataset.color);
  button.classList.add("is-lit");
  window.setTimeout(() => button.classList.remove("is-lit"), 180);
  if (pressedColor !== sequence[sequenceStep]) {
    sequenceStatus.textContent = "Oups, ce n’était pas la bonne lumière. Recommence !";
    sequenceRound = 0;
    sequenceButtons.forEach((item) => { item.disabled = true; });
    return;
  }
  sequenceStep += 1;
  if (sequenceStep < sequence.length) return;
  if (sequenceRound === 5) {
    sequenceStatus.textContent = "Bravo, tu as retenu toute la séquence ! ✨";
    sequenceRound = 0;
    sequenceButtons.forEach((item) => { item.disabled = true; });
    return;
  }
  sequenceRound += 1;
  sequence.push(Math.floor(Math.random() * sequenceButtons.length));
  playSequence();
}));
sequenceStart.addEventListener("click", startSequence);

// Tri des cadeaux : sélectionne seulement les cadeaux rouges.
const sortingBoard = document.getElementById("sorting-board");
const sortingStatus = document.getElementById("sorting-status");
const sortingTime = document.getElementById("sorting-time");
const sortingStart = document.getElementById("sorting-start");
const sortingGifts = [
  ["🎁", true], ["🎄", false], ["🧧", true], ["🔔", false],
  ["🎁", false], ["🧦", true], ["🎀", false], ["🧧", true],
  ["⭐", false], ["🎁", true], ["🍬", false], ["🧦", true],
];
let sortingTimer = null;
let sortingSeconds = 20;
let sortingFound = 0;
let sortingActive = false;

function startSorting() {
  window.clearInterval(sortingTimer);
  sortingSeconds = 20;
  sortingFound = 0;
  sortingActive = true;
  sortingTime.textContent = "Temps : 20 s";
  sortingStatus.textContent = "Trouve les cadeaux rouges !";
  sortingStart.disabled = true;
  sortingBoard.replaceChildren();

  shuffle(sortingGifts).forEach(([symbol, isRed], index) => {
    const button = document.createElement("button");
    button.className = `sorting-gift${isRed ? " is-red" : ""}`;
    button.type = "button";
    button.textContent = symbol;
    button.style.setProperty("--gift-paper", isRed ? "#ad334b" : ["#286596", "#547d39", "#bc8b27"][index % 3]);
    button.setAttribute("aria-label", `Cadeau ${index + 1}`);
    button.addEventListener("click", () => {
      if (!sortingActive || button.disabled) return;
      button.disabled = true;
      if (isRed) {
        sortingFound += 1;
        button.classList.add("is-found");
        sortingStatus.textContent = `Bien vu ! ${sortingFound} sur 6 cadeaux rouges.`;
        if (sortingFound === 6) finishSorting(true);
      } else {
        button.classList.add("is-missed");
        sortingStatus.textContent = "Celui-là n’est pas rouge !";
      }
    });
    sortingBoard.appendChild(button);
  });

  sortingTimer = window.setInterval(() => {
    sortingSeconds -= 1;
    sortingTime.textContent = `Temps : ${sortingSeconds} s`;
    if (sortingSeconds <= 0) finishSorting(false);
  }, 1000);
}

function finishSorting(allFound) {
  sortingActive = false;
  window.clearInterval(sortingTimer);
  sortingStart.disabled = false;
  sortingStart.textContent = "Rejouer";
  sortingStatus.textContent = allFound
    ? "Parfait, tous les cadeaux rouges sont triés ! 🎉"
    : `Temps écoulé ! Tu en as trouvé ${sortingFound} sur 6.`;
}

sortingStart.addEventListener("click", startSorting);

// Mot mystère : déchiffre cinq mots de Noël.
const mysteryWords = [
  { word: "SAPIN", scrambled: "NIPAS" },
  { word: "CADEAU", scrambled: "DEAUCA" },
  { word: "ETOILE", scrambled: "LITEOE" },
  { word: "RENNE", scrambled: "NENER" },
  { word: "NEIGE", scrambled: "GNEIE" },
];
const wordProgress = document.getElementById("word-progress");
const scrambledWord = document.getElementById("scrambled-word");
const wordForm = document.getElementById("word-form");
const wordAnswer = document.getElementById("word-answer");
const wordStatus = document.getElementById("word-status");
let wordIndex = 0;

function showMysteryWord() {
  const item = mysteryWords[wordIndex];
  wordProgress.textContent = `Mot ${wordIndex + 1} sur ${mysteryWords.length}`;
  scrambledWord.textContent = item.scrambled.split("").join("  ");
  wordAnswer.value = "";
  wordAnswer.disabled = false;
  wordForm.querySelector("button").disabled = false;
  wordStatus.textContent = "À toi de trouver !";
  wordAnswer.focus();
}

wordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const answer = wordAnswer.value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (answer !== mysteryWords[wordIndex].word) {
    wordStatus.textContent = "Pas encore, essaie une autre combinaison !";
    wordAnswer.select();
    return;
  }

  wordAnswer.disabled = true;
  wordForm.querySelector("button").disabled = true;
  if (wordIndex === mysteryWords.length - 1) {
    wordProgress.textContent = "Terminé !";
    scrambledWord.textContent = "Tu as déchiffré tous les mots !";
    wordStatus.textContent = "Bravo, maître·sse des mots de Noël ! ✨";
    return;
  }
  wordStatus.textContent = "Bien trouvé ! 🎄";
  wordIndex += 1;
  window.setTimeout(showMysteryWord, 700);
});

showMysteryWord();
