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
};

const STORAGE_KEY = "calendrier-avent-ouvert-2026";
const CONTENT_PATH = "contenu.json";

const SHUFFLED_DAYS = [
  12, 3, 19, 8, 23, 1, 16, 6, 21, 9, 14, 4, 18, 11, 24,
  5, 13, 2, 20, 7, 15, 10, 22, 17,
];

const calendarEl = document.getElementById("calendar");
const modalEl = document.getElementById("modal");
const modalContentEl = document.getElementById("modal-content");
const lockMessageEl = document.getElementById("lock-message");

let contenuParJour = [];
let openDays = getStoredOpenDays();

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

function updatePixelScale() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const scaleFromWidth = Math.floor(viewportWidth / 180);
  const scaleFromHeight = Math.floor((viewportHeight - 170) / 320);
  const scale = Math.min(4, Math.max(2, Math.min(scaleFromWidth, scaleFromHeight)));
  document.documentElement.style.setProperty("--pixel-scale", String(scale));
}

async function assetExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    return false;
  }
}

function resolveCaseVisual(dayNumber) {
  return `images/cases/${String(dayNumber).padStart(2, "0")}.webp`;
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

  if (isOpen) {
    inner.innerHTML = `<span class="case-number">${dayNumber}</span>`;
  } else if (unlocked) {
    const preview = document.createElement("span");
    preview.className = "case-number";
    preview.textContent = dayNumber;
    inner.appendChild(preview);
    button.setAttribute("title", `Ouvrir le ${getLetterDate(dayNumber)}`);
  } else {
    const lock = document.createElement("span");
    lock.className = "case-lock";
    lock.textContent = "🔒";
    inner.appendChild(lock);
    button.setAttribute("title", `Ouvert à partir du ${getLetterDate(dayNumber)}`);
  }

  const visual = resolveCaseVisual(dayNumber);
  assetExists(visual).then((exists) => {
    if (exists) {
      button.style.backgroundImage = `url('${visual}')`;
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";
      button.style.backgroundRepeat = "no-repeat";
    } else {
      button.style.backgroundImage = "linear-gradient(180deg, #f5d76c 0%, #e7b33d 100%)";
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";
      button.style.backgroundRepeat = "no-repeat";
    }
  });

  button.appendChild(inner);

  button.addEventListener("click", () => handleCaseClick(dayNumber, button));
  return button;
}

function renderCalendar() {
  calendarEl.innerHTML = "";

  SHUFFLED_DAYS.forEach((day) => {
    const caseButton = createCase(day);
    calendarEl.appendChild(caseButton);
  });
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
  if (isDayOpen(dayNumber)) {
    openModalForDay(dayNumber);
    return;
  }

  if (!isUnlocked(dayNumber, getCurrentLocalDate())) {
    setLockMessage(`Cette case s'ouvre le ${getLetterDate(dayNumber)}.`);
    return;
  }

  button.classList.add("is-opening");

  setTimeout(() => {
    if (!isDayOpen(dayNumber)) {
      openDays = normalizeOpenDays([...openDays, dayNumber]);
      saveOpenDays(openDays);
      renderCalendar();
    }

    openModalForDay(dayNumber);
  }, 250);
}

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

window.addEventListener("resize", updatePixelScale);

window.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.close === "true") {
    closeModal();
  }
});

document.querySelector(".modal-close")?.addEventListener("click", closeModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

updatePixelScale();
loadContent();
