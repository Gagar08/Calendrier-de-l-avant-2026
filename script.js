/*
  Calendrier de l'avent statique.
  Ce fichier gère la date actuelle, l'ouverture des cases,
  la sauvegarde dans localStorage et l'affichage de la modale.
*/

const ASSET_CONFIG = {
  background: "images/decor/fond.png",
  frame: "images/decor/cadre.png",
  lockedIcon: "images/decor/icone-verrouille.png",
  openedIcon: "images/decor/icone-ouverte.png",
  giftClosed: "images/gift/gift-close.png",
  giftAnimation: "images/gift/gift-animation.gif",
  giftOpen: "images/gift/gift-open.png",
};

const STORAGE_KEY = "calendrier-avent-ouvert-2026";
const CONTENT_PATH = "contenu.json";
const GIFT_ANIMATION_DURATION = 1450;
const SLIDE_ANIMATION_DURATION = 220;
const MUSIC_TRACKS = [
  "sons/music/Last Christmas (8-Bit Version).mp3",
  "sons/music/Let It Snow, Let It Snow, Let It Snow (8-Bit Version).mp3",
  "sons/music/The Christmas Song (Chestnuts Roasting on an Open Fire) (8-Bit Version).mp3",
];
function shuffleTrackIndices() {
  const indices = MUSIC_TRACKS.map((_, index) => index);
  for (let index = indices.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [indices[index], indices[randomIndex]] = [indices[randomIndex], indices[index]];
  }
  return indices;
}

let upcomingTrackIndices = shuffleTrackIndices();
const FOLEY_SOUNDS = {
  slide: new Audio("sons/foley/whoosh.mp3"),
  openGift: new Audio("sons/foley/open_gift.mp3"),
};
const DAYS = Array.from({ length: 24 }, (_, index) => index + 1);

const calendarEl = document.getElementById("calendar");
const previousCaseEl = document.getElementById("previous-case");
const nextCaseEl = document.getElementById("next-case");
const casePositionEl = document.getElementById("case-position");
const modalEl = document.getElementById("modal");
const modalContentEl = document.getElementById("modal-content");
const lockMessageEl = document.getElementById("lock-message");
const musicToggleEl = document.getElementById("music-toggle");
const devResetEl = document.getElementById("dev-reset");
const isLocalDevelopment = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
const musicEl = new Audio();
let currentTrackIndex = upcomingTrackIndices.pop();

let contenuParJour = [];
let openDays = getStoredOpenDays();
let currentIndex = getInitialCaseIndex();
let isOpeningCase = false;
let isNavigating = false;
let swipeStart = null;
let suppressCaseClickUntil = 0;

// --- Helpers ---------------------------------------------------------------

function getDateOverride() {
  const params = new URLSearchParams(window.location.search);
  const dateValue = params.get("date");

  if (!dateValue) return null;

  const parsed = new Date(dateValue + "T12:00:00");
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function getCurrentLocalDate() {
  return getDateOverride() || new Date();
}

function getInitialCaseIndex() {
  const currentDay = getCurrentLocalDate().getDate();
  return Math.min(Math.max(currentDay, 1), DAYS.length) - 1;
}

function getLetterDate(dayNumber) {
  const monthName = "décembre";
  return `${dayNumber} ${monthName}`;
}

function getDateAtUnlock(dayNumber, baseDate = new Date()) {
  return new Date(baseDate.getFullYear(), 11, dayNumber, 0, 0, 0, 0);
}

function isUnlocked(dayNumber, baseDate = new Date()) {
  const currentYear = baseDate.getFullYear();
  const dateToUnlock = getDateAtUnlock(dayNumber, new Date(currentYear, 0, 1));
  return baseDate >= dateToUnlock && baseDate.getMonth() === 11;
}

function getStoredOpenDays() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function saveOpenDays(days) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
}

function updateMusicToggle() {
  const isPlaying = !musicEl.paused;
  const label = isPlaying ? "Mettre la musique en pause" : "Lancer ou reprendre la musique";
  musicToggleEl.classList.toggle("is-playing", isPlaying);
  musicToggleEl.setAttribute("aria-label", label);
  musicToggleEl.setAttribute("title", label);
  musicToggleEl.setAttribute("aria-pressed", String(isPlaying));
}

function playMusic() {
  musicEl.play().then(updateMusicToggle).catch(updateMusicToggle);
}

function playNextTrack() {
  if (upcomingTrackIndices.length === 0) {
    upcomingTrackIndices = shuffleTrackIndices();
    const lastIndex = upcomingTrackIndices.length - 1;
    if (upcomingTrackIndices.length > 1 && upcomingTrackIndices[lastIndex] === currentTrackIndex) {
      [upcomingTrackIndices[lastIndex], upcomingTrackIndices[lastIndex - 1]] = [
        upcomingTrackIndices[lastIndex - 1],
        upcomingTrackIndices[lastIndex],
      ];
    }
  }
  currentTrackIndex = upcomingTrackIndices.pop();
  musicEl.src = MUSIC_TRACKS[currentTrackIndex];
  playMusic();
}

musicEl.addEventListener("ended", playNextTrack);
musicEl.addEventListener("play", updateMusicToggle);
musicEl.addEventListener("pause", updateMusicToggle);
musicEl.src = MUSIC_TRACKS[currentTrackIndex];

function playFoley(sound) {
  sound.pause();
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

musicToggleEl.addEventListener("click", () => {
  if (musicEl.paused) {
    playMusic();
  } else {
    musicEl.pause();
  }
});

function normalizeOpenDays(days) {
  return Array.from(new Set(days.map(Number).filter((value) => value >= 1 && value <= 24)));
}

function isDayOpen(dayNumber) {
  return openDays.includes(Number(dayNumber));
}

function setLockMessage(text) {
  lockMessageEl.textContent = text;
  lockMessageEl.classList.add("is-visible");

  clearTimeout(setLockMessage.timeoutId);
  setLockMessage.timeoutId = setTimeout(() => {
    lockMessageEl.classList.remove("is-visible");
    lockMessageEl.textContent = "";
  }, 1800);
}

function setCaseGift(button, image) {
  const gift = button.querySelector(".case-gift");
  if (gift) {
    gift.src = image;
  }
}

function createCase(dayNumber) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "case";
  button.dataset.day = String(dayNumber);

  const isOpen = isDayOpen(dayNumber);
  const unlocked = isUnlocked(dayNumber, getCurrentLocalDate());

  if (isOpen) {
    button.classList.add("is-opened");
  } else if (unlocked) {
    button.classList.add("is-unlocked");
  } else {
    button.classList.add("is-locked");
  }

  const inner = document.createElement("span");
  inner.className = "case-inner";

  const gift = document.createElement("img");
  gift.className = "case-gift";
  gift.alt = "";
  inner.appendChild(gift);

  const number = document.createElement("span");
  number.className = "case-number";
  number.textContent = dayNumber;
  inner.appendChild(number);

  if (!isOpen && unlocked) {
    button.setAttribute("title", `Ouvrir le ${getLetterDate(dayNumber)}`);
  } else if (!isOpen) {
    button.setAttribute("title", `Ouvert à partir du ${getLetterDate(dayNumber)}`);
  }

  button.appendChild(inner);
  setCaseGift(button, isOpen ? ASSET_CONFIG.giftOpen : ASSET_CONFIG.giftClosed);

  button.addEventListener("click", () => handleCaseClick(dayNumber, button));
  return button;
}

function updateCarouselControls() {
  previousCaseEl.disabled = currentIndex === 0 || isOpeningCase || isNavigating;
  nextCaseEl.disabled = currentIndex === DAYS.length - 1 || isOpeningCase || isNavigating;
}

function renderCalendar(entryDirection = 0) {
  const day = DAYS[currentIndex];
  const caseButton = createCase(day);
  const enteringClass = entryDirection > 0
    ? "is-entering-from-right"
    : entryDirection < 0
      ? "is-entering-from-left"
      : null;

  if (enteringClass) {
    caseButton.classList.add(enteringClass);
  }

  calendarEl.replaceChildren(caseButton);
  updateCarouselControls();
  casePositionEl.textContent = `${currentIndex + 1} / ${DAYS.length}`;

  if (enteringClass) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!caseButton.isConnected) {
          return;
        }

        caseButton.classList.add("is-entering");
        caseButton.classList.remove(enteringClass);

        setTimeout(() => {
          caseButton.classList.remove("is-entering");
          isNavigating = false;
          updateCarouselControls();
        }, SLIDE_ANIMATION_DURATION);
      });
    });
  }
}

function navigateToCase(index) {
  if (index < 0 || index >= DAYS.length || index === currentIndex || isOpeningCase || isNavigating) {
    return;
  }

  const direction = index > currentIndex ? 1 : -1;
  playFoley(FOLEY_SOUNDS.slide);
  const currentCase = calendarEl.querySelector(".case");
  isNavigating = true;
  updateCarouselControls();

  if (currentCase) {
    currentCase.classList.remove("is-dragging");
    currentCase.style.removeProperty("--swipe-offset");
    currentCase.classList.add(direction > 0 ? "is-swiping-out-left" : "is-swiping-out-right");
  }

  setTimeout(() => {
    currentIndex = index;
    renderCalendar(direction);
  }, SLIDE_ANIMATION_DURATION);
}

function findContentByDay(dayNumber) {
  return contenuParJour.find((item) => Number(item.jour) === Number(dayNumber));
}

function closeModal() {
  modalEl.classList.remove("is-open");
  modalEl.setAttribute("aria-hidden", "true");
  modalContentEl.innerHTML = "";
}

function openModalForDay(dayNumber) {
  const content = findContentByDay(dayNumber);
  if (!content) {
    return;
  }

  const contentNode = document.createElement("div");
  contentNode.className = "modal-content-inner";

  const kicker = document.createElement("p");
  kicker.className = "modal-kicker";
  kicker.textContent = `Jour ${dayNumber}`;
  contentNode.appendChild(kicker);

  const title = document.createElement("h2");
  title.id = "modal-title";
  title.className = "modal-title";
  title.textContent = content.titre || `Jour ${dayNumber}`;
  contentNode.appendChild(title);

  if (content.image) {
    const imageWrap = document.createElement("div");
    const img = document.createElement("img");
    img.className = "modal-image";
    img.src = content.image;
    img.alt = content.titre || `Image du jour ${dayNumber}`;
    img.loading = "lazy";
    img.onerror = () => {
      const fallback = document.createElement("div");
      fallback.className = "modal-fallback";
      fallback.textContent = "Image à venir\n✨";
      imageWrap.replaceChildren(fallback);
    };
    imageWrap.appendChild(img);
    contentNode.appendChild(imageWrap);
  }

  if (content.texte) {
    const text = document.createElement("p");
    text.className = "modal-body";
    text.textContent = content.texte;
    contentNode.appendChild(text);
  }

  if (content.lien) {
    const link = document.createElement("a");
    link.className = "modal-link";
    link.href = content.lien;
    if (/^https?:\/\//i.test(content.lien)) {
      link.target = "_blank";
      link.rel = "noreferrer noopener";
    }
    link.textContent = content.type === "lien" ? "Jouer" : "Ouvrir le lien";
    contentNode.appendChild(link);
  }

  modalContentEl.replaceChildren(contentNode);
  modalEl.classList.add("is-open");
  modalEl.setAttribute("aria-hidden", "false");
}

function handleCaseClick(dayNumber, button) {
  if (isNavigating) {
    return;
  }

  if (Date.now() < suppressCaseClickUntil) {
    return;
  }

  if (isDayOpen(dayNumber)) {
    openModalForDay(dayNumber);
    return;
  }

  if (!isUnlocked(dayNumber, getCurrentLocalDate())) {
    setLockMessage(`Cette case s'ouvre le ${getLetterDate(dayNumber)}.`);
    return;
  }

  button.classList.add("is-opening");
  button.disabled = true;
  isOpeningCase = true;
  playFoley(FOLEY_SOUNDS.openGift);
  previousCaseEl.disabled = true;
  nextCaseEl.disabled = true;
  setCaseGift(button, ASSET_CONFIG.giftAnimation);

  setTimeout(() => {
    if (!isDayOpen(dayNumber)) {
      openDays = normalizeOpenDays([...openDays, dayNumber]);
      saveOpenDays(openDays);
    }

    isOpeningCase = false;
    renderCalendar();
    openModalForDay(dayNumber);
  }, GIFT_ANIMATION_DURATION);
}

calendarEl.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch" && !isNavigating && !isOpeningCase) {
    const target = event.target instanceof Element ? event.target.closest(".case") : null;
    if (target) {
      swipeStart = { x: event.clientX, y: event.clientY, button: target };
    }
  }
});

calendarEl.addEventListener("pointermove", (event) => {
  if (!swipeStart?.button || isNavigating || isOpeningCase) {
    return;
  }

  const deltaX = event.clientX - swipeStart.x;
  const deltaY = event.clientY - swipeStart.y;

  if (Math.abs(deltaY) > 12 && Math.abs(deltaY) > Math.abs(deltaX)) {
    swipeStart.button.classList.remove("is-dragging");
    swipeStart.button.style.removeProperty("--swipe-offset");
    swipeStart = null;
    return;
  }

  if (Math.abs(deltaX) < 4) {
    return;
  }

  event.preventDefault();
  const maxOffset = Math.min(140, window.innerWidth * 0.45);
  const swipeOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
  swipeStart.button.classList.add("is-dragging");
  swipeStart.button.style.setProperty("--swipe-offset", `${swipeOffset}px`);
});

calendarEl.addEventListener("pointerup", (event) => {
  if (!swipeStart) {
    return;
  }

  const gesture = swipeStart;
  const deltaX = event.clientX - gesture.x;
  const deltaY = event.clientY - gesture.y;
  swipeStart = null;

  if (!gesture.button) {
    return;
  }

  if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) {
    gesture.button.classList.remove("is-dragging");
    gesture.button.style.removeProperty("--swipe-offset");
    return;
  }

  suppressCaseClickUntil = Date.now() + 250;
  const nextIndex = currentIndex + (deltaX < 0 ? 1 : -1);
  if (nextIndex < 0 || nextIndex >= DAYS.length) {
    gesture.button.classList.remove("is-dragging");
    gesture.button.style.removeProperty("--swipe-offset");
    return;
  }

  navigateToCase(nextIndex);
});

calendarEl.addEventListener("pointercancel", () => {
  if (swipeStart?.button) {
    swipeStart.button.classList.remove("is-dragging");
    swipeStart.button.style.removeProperty("--swipe-offset");
  }
  swipeStart = null;
});

async function loadContent() {
  try {
    const response = await fetch(CONTENT_PATH, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Impossible de charger contenu.json");
    }

    const data = await response.json();
    contenuParJour = Array.isArray(data) ? data : [];
    renderCalendar();
  } catch (error) {
    console.error(error);
    document.body.insertAdjacentHTML(
      "beforeend",
      '<p style="color: #ffd98a; text-align:center; font-size:0.55rem; padding:1rem;">Le contenu n’a pas pu être chargé.</p>'
    );
  }
}

previousCaseEl.addEventListener("click", () => navigateToCase(currentIndex - 1));
nextCaseEl.addEventListener("click", () => navigateToCase(currentIndex + 1));

window.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.close === "true") {
    closeModal();
  }
});

document.querySelector(".modal-close")?.addEventListener("click", (event) => {
  const button = event.currentTarget;
  button.classList.add("is-pressed");
  setTimeout(() => {
    button.classList.remove("is-pressed");
    closeModal();
  }, 160);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  } else if (!modalEl.classList.contains("is-open") && event.key === "ArrowLeft") {
    navigateToCase(currentIndex - 1);
  } else if (!modalEl.classList.contains("is-open") && event.key === "ArrowRight") {
    navigateToCase(currentIndex + 1);
  }
});

if (isLocalDevelopment) {
  devResetEl.hidden = false;
  devResetEl.addEventListener("click", () => {
    if (!window.confirm("Réinitialiser les cadeaux ouverts sur ce navigateur ?")) {
      return;
    }

    openDays = [];
    localStorage.removeItem(STORAGE_KEY);
    renderCalendar();
    setLockMessage("Les cadeaux ont été réinitialisés.");
  });
}

loadContent();
