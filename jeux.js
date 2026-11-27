const params = new URLSearchParams(window.location.search);
const correctSound = new Audio("sons/foley/correct.mp3");
const wrongSound = new Audio("sons/foley/wrong.mp3");
function playCorrectSound() {
  correctSound.pause();
  correctSound.currentTime = 0;
  correctSound.play().catch(() => {});
}
function playWrongSound() {
  wrongSound.pause();
  wrongSound.currentTime = 0;
  wrongSound.play().catch(() => {});
}

document.querySelector(".back-link")?.addEventListener("click", (event) => {
  if (window.parent !== window) {
    event.preventDefault();
    window.parent.postMessage({ type: "close-game" }, window.location.origin);
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && window.parent !== window) {
    window.parent.postMessage({ type: "close-game" }, window.location.origin);
  }
});

const requestedDay = Number(params.get("jour"));
const dayLabel = document.getElementById("day-label");
const gamePanels = Array.from(document.querySelectorAll(".game-panel"));
const gameByDay = {
  2: "memory",
  6: "reaction",
  10: "quiz",
  14: "sequence",
  18: "code",
  20: "puzzle",
  22: "word",
};
const selectedGame = gameByDay[requestedDay];

dayLabel.textContent = selectedGame ? `Épreuve du jour ${requestedDay}` : "";
gamePanels.forEach((panel) => {
  panel.hidden = panel.id !== `game-${selectedGame || "unavailable"}`;
});

// Memory : retrouve les cinq paires illustrées.
const memoryBoard = document.getElementById("memory-board");
const memoryStatus = document.getElementById("memory-status");
const memorySymbols = [
  { name: "Bonhomme de neige", src: "images/mini-jeux/bonhome.png" },
  { name: "Cadeau", src: "images/mini-jeux/cadeau.png" },
  { name: "Cloche", src: "images/mini-jeux/cloche.png" },
  { name: "Père Noël", src: "images/mini-jeux/pere_noel.png" },
  { name: "Renne", src: "images/mini-jeux/rene.png" },
];
let memoryCards = [];
let revealedCards = [];
let matchedPairs = 0;
let memoryMoves = 0;
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
  memoryCards = shuffle(memorySymbols.flatMap((item, pair) => [
    { ...item, pair },
    { ...item, pair },
  ]));
  revealedCards = [];
  matchedPairs = 0;
  memoryMoves = 0;
  memoryLocked = false;
  memoryStatus.textContent = "Objectif : terminer en moins de 12 coups.";
  memoryBoard.replaceChildren();

  memoryCards.forEach((card, index) => {
    const button = document.createElement("button");
    button.className = "memory-card";
    button.type = "button";
    const image = document.createElement("img");
    image.className = "memory-card-image";
    image.src = "images/mini-jeux/cadeau.png";
    image.alt = "";
    button.appendChild(image);
    button.setAttribute("aria-label", `Carte ${index + 1}, cachée`);
    button.addEventListener("click", () => revealMemoryCard(index, button));
    memoryBoard.appendChild(button);
  });
}

function revealMemoryCard(index, button) {
  if (memoryLocked || button.classList.contains("is-revealed") || button.classList.contains("is-matched")) return;
  button.classList.add("is-revealed");
  const card = memoryCards[index];
  const image = button.querySelector("img");
  image.src = card.src;
  image.alt = card.name;
  button.setAttribute("aria-label", `Carte ${index + 1} : ${card.name}`);
  revealedCards.push({ index, button });
  if (revealedCards.length < 2) return;

  const [first, second] = revealedCards;
  memoryMoves += 1;
  if (memoryCards[first.index].pair === memoryCards[second.index].pair) {
    playCorrectSound();
    first.button.classList.add("is-matched");
    second.button.classList.add("is-matched");
    revealedCards = [];
    matchedPairs += 1;
    memoryStatus.textContent = matchedPairs === memorySymbols.length
      ? `Terminé en ${memoryMoves} coups.`
      : `Paires : ${matchedPairs}/${memorySymbols.length} · Coups : ${memoryMoves}`;
    return;
  }

  memoryLocked = true;
  playWrongSound();
  memoryStatus.textContent = "Paire incorrecte.";
  window.setTimeout(() => {
    revealedCards.forEach(({ index: hiddenIndex, button: hiddenButton }) => {
      hiddenButton.classList.remove("is-revealed");
      const image = hiddenButton.querySelector("img");
      image.src = "images/mini-jeux/cadeau.png";
      image.alt = "";
      hiddenButton.setAttribute("aria-label", `Carte ${hiddenIndex + 1}, cachée`);
    });
    revealedCards = [];
    memoryLocked = false;
    memoryStatus.textContent = `Paires : ${matchedPairs}/${memorySymbols.length} · Coups : ${memoryMoves}`;
  }, 850);
}

document.getElementById("memory-reset").addEventListener("click", startMemory);
startMemory();

// Réflexes : touche la cible aussi souvent que possible en 15 secondes.
const reactionArea = document.getElementById("reaction-area");
const reactionTarget = document.getElementById("reaction-target");
const reactionDecoys = Array.from(reactionArea.querySelectorAll(".reaction-decoy"));
const reactionHint = reactionArea.querySelector(".reaction-hint");
const reactionScore = document.getElementById("reaction-score");
const reactionTime = document.getElementById("reaction-time");
const reactionStart = document.getElementById("reaction-start");
let reactionInterval = null;
let reactionMoveInterval = null;
let reactionPoints = 0;
let secondsLeft = 15;

function moveReactionTargets() {
  const targets = [reactionTarget, ...reactionDecoys];
  const occupied = [];

  targets.forEach((target) => {
    const maxLeft = Math.max(0, reactionArea.clientWidth - target.offsetWidth);
    const maxTop = Math.max(0, reactionArea.clientHeight - target.offsetHeight);
    let position = { left: 0, top: 0 };

    for (let attempt = 0; attempt < 40; attempt += 1) {
      position = { left: Math.random() * maxLeft, top: Math.random() * maxTop };
      const overlaps = occupied.some((other) => (
        position.left < other.left + target.offsetWidth
        && position.left + target.offsetWidth > other.left
        && position.top < other.top + target.offsetHeight
        && position.top + target.offsetHeight > other.top
      ));
      if (!overlaps) break;
    }

    target.style.left = `${position.left}px`;
    target.style.top = `${position.top}px`;
    occupied.push({ ...position, width: target.offsetWidth, height: target.offsetHeight });
  });
}

function finishReactionGame() {
  window.clearInterval(reactionInterval);
  window.clearInterval(reactionMoveInterval);
  reactionTarget.hidden = true;
  reactionDecoys.forEach((decoy) => { decoy.hidden = true; });
  reactionHint.hidden = false;
  reactionStart.disabled = false;
  reactionStart.textContent = "Nouvelle tentative";
  reactionScore.textContent = `Manche terminée · Score : ${reactionPoints}`;
}

reactionStart.addEventListener("click", () => {
  window.clearInterval(reactionInterval);
  window.clearInterval(reactionMoveInterval);
  reactionPoints = 0;
  secondsLeft = 15;
  reactionScore.textContent = "Score : 0";
  reactionTime.textContent = "Temps : 15 s";
  reactionStart.disabled = true;
  reactionStart.textContent = "Partie en cours…";
  reactionTarget.hidden = false;
  reactionDecoys.forEach((decoy) => { decoy.hidden = false; });
  reactionHint.hidden = true;
  moveReactionTargets();
  reactionMoveInterval = window.setInterval(moveReactionTargets, 2000);

  reactionInterval = window.setInterval(() => {
    secondsLeft -= 1;
    reactionTime.textContent = `Temps : ${secondsLeft} s`;
    if (secondsLeft <= 0) {
      finishReactionGame();
    }
  }, 1000);
});

reactionTarget.addEventListener("click", () => {
  if (reactionTarget.hidden || secondsLeft <= 0) return;
  playCorrectSound();
  reactionPoints += 1;
  reactionScore.textContent = `Score : ${reactionPoints}`;
  moveReactionTargets();
});

reactionDecoys.forEach((decoy) => {
  decoy.addEventListener("click", () => {
    if (decoy.hidden || secondsLeft <= 0) return;
    playWrongSound();
    secondsLeft = Math.max(0, secondsLeft - 2);
    reactionTime.textContent = `Temps : ${secondsLeft} s`;
    reactionScore.textContent = `Faux personnage ! Score : ${reactionPoints}`;
    if (secondsLeft === 0) finishReactionGame();
    else moveReactionTargets();
  });
});

// Quiz de logique et de déduction.
const quizQuestions = [
  { question: "Une bouteille et son bouchon coûtent 1,10 €. La bouteille coûte 1 € de plus que le bouchon. Combien coûte le bouchon ?", answers: ["5 centimes", "10 centimes", "15 centimes"], correct: 0 },
  { question: "Un train électrique roule vers le nord. Le vent souffle vers le sud. Où part sa fumée ?", answers: ["Vers le nord", "Vers le sud", "Il n’y a pas de fumée"], correct: 2 },
  { question: "Quelle valeur complète la suite : 2, 6, 12, 20, 30, … ?", answers: ["40", "42", "44"], correct: 1 },
  { question: "Cinq machines fabriquent cinq pièces en cinq minutes. Combien de temps mettent cent machines à fabriquer cent pièces ?", answers: ["5 minutes", "20 minutes", "100 minutes"], correct: 0 },
  { question: "Deux pères et deux fils s’assoient à table. Quel est le plus petit nombre de personnes possible ?", answers: ["3", "4", "5"], correct: 0 },
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
  quizStatus.textContent = "Sélectionnez une réponse.";
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
    playCorrectSound();
    quizPoints += 1;
    selectedButton.classList.add("is-correct");
    quizStatus.textContent = "Réponse exacte.";
  } else {
    playWrongSound();
    selectedButton.classList.add("is-wrong");
    answerButtons[correctIndex].classList.add("is-correct");
    quizStatus.textContent = "Réponse incorrecte.";
  }

  window.setTimeout(() => {
    quizIndex += 1;
    quizAnswered = false;
    if (quizIndex < quizQuestions.length) {
      renderQuizQuestion();
      return;
    }
    quizProgress.textContent = "Quiz terminé";
    quizQuestion.textContent = `Score final : ${quizPoints} / ${quizQuestions.length}`;
    quizAnswers.replaceChildren();
    quizStatus.textContent = quizPoints === quizQuestions.length
      ? "Sans faute. Excellente déduction."
      : "Relance une partie pour améliorer ton score.";
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
  sequenceStatus.textContent = `Mémorisation : ${sequenceRound}/8.`;
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
    sequenceStatus.textContent = "À vous de reproduire la séquence.";
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
    playWrongSound();
    sequenceStatus.textContent = "Erreur de séquence. Lancez une nouvelle partie pour réessayer.";
    sequenceRound = 0;
    sequenceButtons.forEach((item) => { item.disabled = true; });
    return;
  }
  playCorrectSound();
  sequenceStep += 1;
  if (sequenceStep < sequence.length) return;
  if (sequenceRound === 8) {
    sequenceStatus.textContent = "Séquence complète : 8 manches réussies.";
    sequenceRound = 0;
    sequenceButtons.forEach((item) => { item.disabled = true; });
    return;
  }
  sequenceRound += 1;
  sequence.push(Math.floor(Math.random() * sequenceButtons.length));
  playSequence();
}));
sequenceStart.addEventListener("click", startSequence);

// Code secret : déduis une combinaison de quatre symboles grâce aux indices.
const codeSymbols = [
  { name: "Bonhomme de neige", src: "images/mini-jeux/bonhome.png" },
  { name: "Cadeau", src: "images/mini-jeux/cadeau.png" },
  { name: "Cloche", src: "images/mini-jeux/cloche.png" },
  { name: "Père Noël", src: "images/mini-jeux/pere_noel.png" },
  { name: "Renne", src: "images/mini-jeux/rene.png" },
];
const codeSlotsEl = document.getElementById("code-slots");
const codeProgressEl = document.getElementById("code-progress");
const codeStatusEl = document.getElementById("code-status");
const codeHistoryEl = document.getElementById("code-history");
const codeSubmitEl = document.getElementById("code-submit");
const codeRestartEl = document.getElementById("code-restart");
let secretCode = [];
let selectedCode = [0, 1, 2, 3];
let codeAttempts = 0;
let codeActive = true;

function renderCodeSlots() {
  codeSlotsEl.replaceChildren();
  selectedCode.forEach((symbolIndex, slotIndex) => {
    const symbol = codeSymbols[symbolIndex];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-slot";
    button.setAttribute("aria-label", `Emplacement ${slotIndex + 1} : ${symbol.name}. Appuie pour changer.`);

    const image = document.createElement("img");
    image.src = symbol.src;
    image.alt = symbol.name;
    button.appendChild(image);
    button.addEventListener("click", () => {
      if (!codeActive) return;
      selectedCode[slotIndex] = (selectedCode[slotIndex] + 1) % codeSymbols.length;
      renderCodeSlots();
      codeSlotsEl.children[slotIndex]?.focus();
    });
    codeSlotsEl.appendChild(button);
  });
}

function startCodeGame() {
  secretCode = Array.from({ length: 4 }, () => Math.floor(Math.random() * codeSymbols.length));
  selectedCode = [0, 1, 2, 3];
  codeAttempts = 0;
  codeActive = true;
  codeHistoryEl.replaceChildren();
  codeProgressEl.textContent = "Tentative 0 / 8";
  codeStatusEl.textContent = "Appuie sur chaque symbole pour le changer.";
  codeSubmitEl.disabled = false;
  codeRestartEl.hidden = true;
  renderCodeSlots();
}

function getCodeClues(guess) {
  let wellPlaced = 0;
  const secretRemainder = [];
  const guessRemainder = [];

  guess.forEach((symbol, index) => {
    if (symbol === secretCode[index]) {
      wellPlaced += 1;
    } else {
      secretRemainder.push(secretCode[index]);
      guessRemainder.push(symbol);
    }
  });

  const misplaced = guessRemainder.reduce((count, symbol) => {
    const matchIndex = secretRemainder.indexOf(symbol);
    if (matchIndex < 0) return count;
    secretRemainder.splice(matchIndex, 1);
    return count + 1;
  }, 0);

  return { wellPlaced, misplaced };
}

function appendCodeAttempt(guess, clues) {
  const row = document.createElement("li");
  row.className = "code-attempt";
  const symbols = document.createElement("div");
  symbols.className = "code-attempt-symbols";

  guess.forEach((symbolIndex) => {
    const image = document.createElement("img");
    image.src = codeSymbols[symbolIndex].src;
    image.alt = codeSymbols[symbolIndex].name;
    symbols.appendChild(image);
  });

  const result = document.createElement("span");
  result.textContent = `${clues.wellPlaced} bien placé${clues.wellPlaced === 1 ? "" : "s"}, ${clues.misplaced} présent${clues.misplaced === 1 ? "" : "s"} ailleurs`;
  row.append(symbols, result);
  codeHistoryEl.prepend(row);
}

function submitCodeGuess() {
  if (!codeActive) return;

  codeAttempts += 1;
  const clues = getCodeClues(selectedCode);
  appendCodeAttempt(selectedCode, clues);
  codeProgressEl.textContent = `Tentative ${codeAttempts} / 8`;

  if (clues.wellPlaced === secretCode.length) {
    playCorrectSound();
    codeActive = false;
    codeStatusEl.textContent = `Bravo, code trouvé en ${codeAttempts} tentative${codeAttempts === 1 ? "" : "s"} !`;
  } else if (codeAttempts === 8) {
    playWrongSound();
    codeActive = false;
    codeStatusEl.textContent = `Code manqué. La combinaison était : ${secretCode.map((index) => codeSymbols[index].name).join(", ")}.`;
  } else {
    playWrongSound();
    codeStatusEl.textContent = `${clues.wellPlaced} bien placé${clues.wellPlaced === 1 ? "" : "s"} et ${clues.misplaced} présent${clues.misplaced === 1 ? "" : "s"} ailleurs.`;
  }

  if (!codeActive) {
    codeSubmitEl.disabled = true;
    codeRestartEl.hidden = false;
    codeSlotsEl.querySelectorAll("button").forEach((button) => { button.disabled = true; });
  }
}

codeSubmitEl.addEventListener("click", submitCodeGuess);
codeRestartEl.addEventListener("click", startCodeGame);
startCodeGame();

// Puzzle coulissant : replace les huit tuiles dans leur ordre d'origine.
const puzzleBoardEl = document.getElementById("puzzle-board");
const puzzleStatusEl = document.getElementById("puzzle-status");
const puzzleShuffleEl = document.getElementById("puzzle-shuffle");
const puzzleImage = new Image();
const puzzleSourceSize = 76;
const puzzleCropTop = 18;
let puzzleTiles = [];
let puzzleMoves = 0;
let puzzleSolved = false;

function getPuzzleNeighbors(index) {
  const row = Math.floor(index / 3);
  const column = index % 3;
  return [
    ...(row > 0 ? [index - 3] : []),
    ...(row < 2 ? [index + 3] : []),
    ...(column > 0 ? [index - 1] : []),
    ...(column < 2 ? [index + 1] : []),
  ];
}

function renderPuzzle() {
  puzzleBoardEl.replaceChildren();
  puzzleTiles.forEach((tile, position) => {
    if (tile === 8) {
      const empty = document.createElement("div");
      empty.className = "puzzle-empty";
      empty.setAttribute("aria-label", "Case vide");
      puzzleBoardEl.appendChild(empty);
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "puzzle-tile";
    button.setAttribute("aria-label", `Déplacer la pièce ${tile + 1}`);
    const neighbors = getPuzzleNeighbors(position);
    const emptyPosition = puzzleTiles.indexOf(8);
    if (neighbors.includes(emptyPosition)) button.classList.add("is-movable");

    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    canvas.setAttribute("aria-hidden", "true");
    const context = canvas.getContext("2d");
    if (context && puzzleImage.complete && puzzleImage.naturalWidth > 0) {
      const sourceTileSize = puzzleSourceSize / 3;
      context.imageSmoothingEnabled = false;
      context.drawImage(
        puzzleImage,
        (tile % 3) * sourceTileSize,
        puzzleCropTop + Math.floor(tile / 3) * sourceTileSize,
        sourceTileSize,
        sourceTileSize,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }
    button.appendChild(canvas);
    button.addEventListener("click", () => movePuzzleTile(position));
    puzzleBoardEl.appendChild(button);
  });

  puzzleStatusEl.textContent = puzzleSolved
    ? `Bravo ! Image reconstituée en ${puzzleMoves} déplacements.`
    : `Déplacements : ${puzzleMoves}. Clique une pièce voisine du trou pour la déplacer.`;
}

function movePuzzleTile(position) {
  if (puzzleSolved) return;
  const emptyPosition = puzzleTiles.indexOf(8);
  if (!getPuzzleNeighbors(position).includes(emptyPosition)) {
    playWrongSound();
    return;
  }

  [puzzleTiles[position], puzzleTiles[emptyPosition]] = [puzzleTiles[emptyPosition], puzzleTiles[position]];
  puzzleMoves += 1;
  puzzleSolved = puzzleTiles.every((tile, index) => tile === index);
  if (puzzleSolved) playCorrectSound();
  renderPuzzle();
}

function shufflePuzzle() {
  puzzleTiles = Array.from({ length: 9 }, (_, index) => index);
  let emptyPosition = 8;
  let previousPosition = -1;
  for (let step = 0; step < 70; step += 1) {
    const options = getPuzzleNeighbors(emptyPosition).filter((position) => position !== previousPosition);
    const nextPosition = options[Math.floor(Math.random() * options.length)];
    [puzzleTiles[emptyPosition], puzzleTiles[nextPosition]] = [puzzleTiles[nextPosition], puzzleTiles[emptyPosition]];
    previousPosition = emptyPosition;
    emptyPosition = nextPosition;
  }
  puzzleMoves = 0;
  puzzleSolved = false;
  renderPuzzle();
}

puzzleImage.addEventListener("load", renderPuzzle);
puzzleImage.src = "images/fond/fond-noel.png";
puzzleShuffleEl.addEventListener("click", shufflePuzzle);
shufflePuzzle();

// Décryptage : déchiffre six mots à partir d'un indice.
const mysteryWords = [
  { word: "CANNELLE", scrambled: "NELLECNA", clue: "Épice chaude souvent utilisée dans les boissons d’hiver." },
  { word: "EQUINOXE", scrambled: "XENIOQUE", clue: "Moment de l’année où le jour et la nuit ont presque la même durée." },
  { word: "SOLSTICE", scrambled: "CTESLISO", clue: "Événement astronomique qui marque le jour le plus court de l’année." },
  { word: "GIVRAGE", scrambled: "RAGEVIG", clue: "Formation de cristaux de glace sur une surface froide." },
  { word: "MANTEAU", scrambled: "TAMENAU", clue: "Vêtement extérieur conçu pour protéger du froid." },
  { word: "BOUGIE", scrambled: "GIBOUE", clue: "Source de lumière dont la mèche brûle dans de la cire." },
];
const wordProgress = document.getElementById("word-progress");
const scrambledWord = document.getElementById("scrambled-word");
const wordClue = document.getElementById("word-clue");
const wordForm = document.getElementById("word-form");
const wordAnswer = document.getElementById("word-answer");
const wordStatus = document.getElementById("word-status");
let wordIndex = 0;

function showMysteryWord() {
  const item = mysteryWords[wordIndex];
  wordProgress.textContent = `Énigme ${wordIndex + 1} / ${mysteryWords.length}`;
  scrambledWord.textContent = item.scrambled.split("").join("  ");
  wordClue.textContent = item.clue;
  wordAnswer.value = "";
  wordAnswer.disabled = false;
  wordForm.querySelector("button").disabled = false;
  wordStatus.textContent = "Saisissez votre réponse.";
  wordAnswer.focus();
}

wordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const answer = wordAnswer.value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (answer !== mysteryWords[wordIndex].word) {
    playWrongSound();
    wordStatus.textContent = "Réponse incorrecte. Réessayez.";
    wordAnswer.select();
    return;
  }

  wordAnswer.disabled = true;
  wordForm.querySelector("button").disabled = true;
  playCorrectSound();
  if (wordIndex === mysteryWords.length - 1) {
    wordProgress.textContent = "Terminé !";
    scrambledWord.textContent = "Les six mots sont déchiffrés.";
    wordStatus.textContent = "Décryptage terminé : 6 mots résolus.";
    return;
  }
  wordStatus.textContent = "Réponse exacte.";
  wordIndex += 1;
  window.setTimeout(showMysteryWord, 700);
});

showMysteryWord();
