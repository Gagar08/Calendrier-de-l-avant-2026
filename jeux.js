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
  reactionStart.textContent = "Partie en cours…";
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
      reactionStart.textContent = "Nouvelle tentative";
      reactionScore.textContent = `Manche terminée · Score : ${reactionPoints}`;
    }
  }, 1000);
});

reactionTarget.addEventListener("click", () => {
  if (reactionTarget.hidden || secondsLeft <= 0) return;
  reactionPoints += 1;
  reactionScore.textContent = `Score : ${reactionPoints}`;
  moveReactionTarget();
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
    quizPoints += 1;
    selectedButton.classList.add("is-correct");
    quizStatus.textContent = "Réponse exacte.";
  } else {
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
    sequenceStatus.textContent = "Erreur de séquence. Lancez une nouvelle partie pour réessayer.";
    sequenceRound = 0;
    sequenceButtons.forEach((item) => { item.disabled = true; });
    return;
  }
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

// Tri rapide : trouve cinq cadeaux parmi vingt sprites.
const sortingBoard = document.getElementById("sorting-board");
const sortingStatus = document.getElementById("sorting-status");
const sortingTime = document.getElementById("sorting-time");
const sortingStart = document.getElementById("sorting-start");
const giftSprite = { name: "Cadeau", src: "images/mini-jeux/cadeau.png", isGift: true };
const sortingCharacters = [
  { name: "Bonhomme de neige", src: "images/mini-jeux/bonhome.png" },
  { name: "Cloche", src: "images/mini-jeux/cloche.png" },
  { name: "Père Noël", src: "images/mini-jeux/pere_noel.png" },
  { name: "Renne", src: "images/mini-jeux/rene.png" },
];
const sortingGifts = [
  ...Array.from({ length: 5 }, () => ({ ...giftSprite })),
  ...sortingCharacters.flatMap((character, index) => Array.from(
    { length: index === sortingCharacters.length - 1 ? 3 : 4 },
    () => ({ ...character, isGift: false }),
  )),
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
  sortingStatus.textContent = "Sélectionne les cinq cadeaux. Chaque erreur retire 3 secondes.";
  sortingStart.disabled = true;
  sortingBoard.replaceChildren();

  shuffle(sortingGifts).forEach((item, index) => {
    const button = document.createElement("button");
    button.className = `sorting-gift${item.isGift ? " is-gift" : ""}`;
    button.type = "button";
    const image = document.createElement("img");
    image.src = item.src;
    image.alt = "";
    button.appendChild(image);
    button.style.setProperty("--gift-paper", item.isGift ? "#ad334b" : ["#286596", "#547d39", "#bc8b27"][index % 3]);
    button.setAttribute("aria-label", item.name);
    button.addEventListener("click", () => {
      if (!sortingActive || button.disabled) return;
      button.disabled = true;
      if (item.isGift) {
        sortingFound += 1;
        button.classList.add("is-found");
        sortingStatus.textContent = `Cadeaux trouvés : ${sortingFound}/5.`;
        if (sortingFound === 5) finishSorting(true);
      } else {
        button.classList.add("is-missed");
        sortingSeconds = Math.max(0, sortingSeconds - 3);
        sortingTime.textContent = `Temps : ${sortingSeconds} s`;
        sortingStatus.textContent = "Mauvaise sélection : -3 secondes.";
        if (sortingSeconds === 0) finishSorting(false);
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
  sortingStart.textContent = "Nouvelle tentative";
  sortingStatus.textContent = allFound
    ? "Objectif atteint : 5 cadeaux trouvés."
    : `Temps écoulé : ${sortingFound}/5 cadeaux trouvés.`;
}

sortingStart.addEventListener("click", startSorting);

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
    wordStatus.textContent = "Réponse incorrecte. Réessayez.";
    wordAnswer.select();
    return;
  }

  wordAnswer.disabled = true;
  wordForm.querySelector("button").disabled = true;
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
