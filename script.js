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
const GIFT_ANIMATION_DURATION = 300;
const DAYS = Array.from({ length: 24 }, (_, index) => index + 1);

const calendarEl = document.getElementById("calendar");
const previousCaseEl = document.getElementById("previous-case");
const nextCaseEl = document.getElementById("next-case");
const casePositionEl = document.getElementById("case-position");
const modalEl = document.getElementById("modal");
const modalContentEl = document.getElementById("modal-content");
const lockMessageEl = document.getElementById("lock-message");

let contenuParJour = [];
let openDays = getStoredOpenDays();
let currentIndex = 0;
let isOpeningCase = false;
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

function renderCalendar() {
  const day = DAYS[currentIndex];
  calendarEl.replaceChildren(createCase(day));
  previousCaseEl.disabled = currentIndex === 0 || isOpeningCase;
  nextCaseEl.disabled = currentIndex === DAYS.length - 1 || isOpeningCase;
  casePositionEl.textContent = `${currentIndex + 1} / ${DAYS.length}`;
}

function navigateToCase(index) {
  if (index < 0 || index >= DAYS.length || isOpeningCase) {
    return;
  }

  currentIndex = index;
  renderCalendar();
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
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    link.textContent = "Ouvrir le lien";
    contentNode.appendChild(link);
  }

  modalContentEl.replaceChildren(contentNode);
  modalEl.classList.add("is-open");
  modalEl.setAttribute("aria-hidden", "false");
}

function handleCaseClick(dayNumber, button) {
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
  if (event.pointerType === "touch") {
    swipeStart = { x: event.clientX, y: event.clientY };
  }
});

calendarEl.addEventListener("pointerup", (event) => {
  if (!swipeStart) {
    return;
  }

  const deltaX = event.clientX - swipeStart.x;
  const deltaY = event.clientY - swipeStart.y;
  swipeStart = null;

  if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) {
    return;
  }

  suppressCaseClickUntil = Date.now() + 250;
  navigateToCase(currentIndex + (deltaX < 0 ? 1 : -1));
});

calendarEl.addEventListener("pointercancel", () => {
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

document.querySelector(".modal-close")?.addEventListener("click", closeModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  } else if (!modalEl.classList.contains("is-open") && event.key === "ArrowLeft") {
    navigateToCase(currentIndex - 1);
  } else if (!modalEl.classList.contains("is-open") && event.key === "ArrowRight") {
    navigateToCase(currentIndex + 1);
  }
});

loadContent();
