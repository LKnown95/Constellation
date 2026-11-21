const monthTitle = document.querySelector("#month-title");
const calendarDays = document.querySelector("#calendar-days");
const calendarRippleTimers = new WeakMap();
const calendarLayout = document.querySelector("#calendar-layout");
const entryPanel = document.querySelector("#entry-panel");
const entryTitle = document.querySelector("#entry-title");
const entryView = document.querySelector("#entry-view");
const entryForm = document.querySelector("#entry-form");
const dayActivityList = document.querySelector("#day-activity-list");
const dayActivitiesEmpty = document.querySelector("#day-activities-empty");
const entryViewActivities = document.querySelector("#entry-view-activities");
const entryViewEmpty = document.querySelector("#entry-view-empty");
const entryViewWater = document.querySelector("#entry-view-water");
const entryViewSleep = document.querySelector("#entry-view-sleep");
const entryViewWake = document.querySelector("#entry-view-wake");
const entryViewNote = document.querySelector("#entry-view-note");
const entryViewStatus = document.querySelector("#entry-view-status");
const waterCount = document.querySelector("#water-count");
const entryText = document.querySelector("#entry-text");
const saveStatus = document.querySelector("#save-status");
const settingsDialog = document.querySelector("#settings-dialog");
const settingsToggle = document.querySelector("#settings-toggle");
const themeToggle = document.querySelector("#theme-toggle");
const themeIcon = themeToggle.querySelector("img");
const activityTypeList = document.querySelector("#activity-type-list");
const typeEditor = document.querySelector("#type-editor");
const typeEditorTitle = document.querySelector("#type-editor-title");
const typeNameInput = document.querySelector("#type-name");
const typeEmojiInput = document.querySelector("#type-emoji");
const typeColorInput = document.querySelector("#type-color");
const settingsStatus = document.querySelector("#settings-status");
const exportDataButton = document.querySelector("#export-data");
const importDataButton = document.querySelector("#import-data");
const importDataFile = document.querySelector("#import-data-file");
const dataImportConfirmation = document.querySelector("#data-import-confirmation");
const dataImportConfirmationMessage = document.querySelector("#data-import-confirmation-message");
const importWithBackupButton = document.querySelector("#import-with-backup");
const importWithoutBackupButton = document.querySelector("#import-without-backup");
const cancelImportButton = document.querySelector("#cancel-import");
const animationsSetting = document.querySelector("#animations-setting");
const accentPalette = document.querySelector("#accent-palette");
const accentPaletteButtons = [...accentPalette.querySelectorAll("[data-accent-choice]")];
const trackSleepSetting = document.querySelector("#track-sleep-setting");
const trackWakeSetting = document.querySelector("#track-wake-setting");
const workoutDaysGoal = document.querySelector("#workout-days-goal");
const walkDaysGoal = document.querySelector("#walk-days-goal");
const maxWorkoutsSetting = document.querySelector("#max-workouts-setting");
const maxActiveMinutesSetting = document.querySelector("#max-active-minutes-setting");
const workoutDaysGoalError = document.querySelector("#workout-days-goal-error");
const walkDaysGoalError = document.querySelector("#walk-days-goal-error");
const maxWorkoutsError = document.querySelector("#max-workouts-error");
const maxActiveMinutesError = document.querySelector("#max-active-minutes-error");
const workoutMinutesGoalSetting = document.querySelector("#workout-minutes-goal-setting");
const walkMinutesGoalSetting = document.querySelector("#walk-minutes-goal-setting");
const workoutMinutesGoalError = document.querySelector("#workout-minutes-goal-error");
const walkMinutesGoalError = document.querySelector("#walk-minutes-goal-error");
const todayProgress = document.querySelector("#today-progress");
const dailyGoalScales = document.querySelector("#daily-goal-scales");
const workoutDailyGoalScale = document.querySelector("#workout-daily-goal");
const walkDailyGoalScale = document.querySelector("#walk-daily-goal");
const dayDailyGoalScales = document.querySelector("#day-daily-goal-scales");
const dayWorkoutDailyGoalScale = document.querySelector("#day-workout-daily-goal");
const dayWalkDailyGoalScale = document.querySelector("#day-walk-daily-goal");
const weekRange = document.querySelector("#week-range");
const storageKey = "activity-tracker-entries";
const activityTypesKey = "activityTypes";
const settingsKey = "settings";
const themeKey = "theme";
const supportedBackupVersion = 1;
const maxBackupSize = 5 * 1024 * 1024;
const appStorageKeys = [storageKey, activityTypesKey, settingsKey, themeKey];
const accentChoices = ["lavender", "rose", "peach", "mint", "sky", "lilac", "yellow", "gray", "brown"];
const activityIconFilterIds = new Map();
const modalCloseStates = new WeakMap();
let activityIconFilterSvg = null;

function applyTheme(theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  const nextTheme = theme === "dark" ? "light" : "dark";
  themeIcon.src = theme === "dark" ? "./icons/sun.svg" : "./icons/moon.svg";
  const label = `Включить ${nextTheme === "dark" ? "тёмную" : "светлую"} тему`;
  themeToggle.setAttribute("aria-label", label);
  themeToggle.title = label;

  if (persist) {
    try {
      localStorage.setItem(themeKey, theme);
    } catch (error) {
      console.error("Не удалось сохранить тему:", error);
    }
  }
}

function getInitialTheme() {
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(themeKey);
  } catch (error) {
    console.error("Не удалось прочитать сохранённую тему:", error);
  }
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

applyTheme(getInitialTheme());
requestAnimationFrame(() => {
  document.documentElement.classList.add("theme-ready");
});
themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
});

const defaultActivityTypes = [
  { id: "workout", name: "Тренировка", emoji: "🏋️", color: "#dce5ff", icon: "workout.svg" },
  { id: "walk", name: "Прогулка", emoji: "🚶", color: "#dff2e3", icon: "walk.svg" },
  { id: "rest", name: "День без активности", emoji: "🛋️", color: "#eee8f5", icon: "rest.svg" }
];
const today = new Date();

let displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = null;
let editingActivityTypeId = null;
let activityTypes = addDefaultActivityIcons(loadActivityTypes());
let entries = loadEntries();
let appSettings = loadSettings();
let pendingImportData = null;
applyAnimationSetting(appSettings.animations);
applyAccent(appSettings.accent);

function applyAnimationSetting(enabled) {
  document.documentElement.dataset.animations = enabled ? "on" : "off";
}

function applyAccent(accent) {
  const selectedAccent = accentChoices.includes(accent) ? accent : "lavender";
  document.documentElement.dataset.accent = selectedAccent;
  for (const button of accentPaletteButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.accentChoice === selectedAccent));
  }
  return selectedAccent;
}

function normalizeDailyGoal(value, fallback, maximumMinutes) {
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") {
    return fallback;
  }
  const minutes = Number(value);
  return Number.isInteger(minutes) && minutes >= 0 && minutes <= 600 && minutes <= maximumMinutes
    ? minutes
    : fallback;
}

function loadSettings() {
  const defaults = {
    trackSleep: true,
    trackWake: true,
    workoutDaysGoal: 3,
    walkDaysGoal: 5,
    maxWorkoutsPerDay: 2,
    maxActiveMinutesPerDay: 120,
    workoutMinutesGoal: 45,
    walkMinutesGoal: 30,
    animations: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    accent: "lavender"
  };
  const savedSettings = localStorage.getItem(settingsKey);
  if (savedSettings === null) {
    try {
      localStorage.setItem(settingsKey, JSON.stringify(defaults));
    } catch (error) {
      console.error("Не удалось сохранить настройки по умолчанию:", error);
    }
    return defaults;
  }

  try {
    const parsedSettings = JSON.parse(savedSettings);
    const settingsObject = parsedSettings && typeof parsedSettings === "object" && !Array.isArray(parsedSettings)
      ? parsedSettings
      : {};
    const animations = typeof settingsObject.animations === "boolean"
      ? settingsObject.animations
      : defaults.animations;
    const accent = accentChoices.includes(settingsObject.accent) ? settingsObject.accent : defaults.accent;
    const maxActiveMinutesPerDay =
      Number.isFinite(Number(settingsObject.maxActiveMinutesPerDay)) && Number(settingsObject.maxActiveMinutesPerDay) >= 0
        ? Number(settingsObject.maxActiveMinutesPerDay)
        : defaults.maxActiveMinutesPerDay;
    const workoutMinutesGoal = normalizeDailyGoal(
      settingsObject.workoutMinutesGoal,
      Math.floor(Math.min(defaults.workoutMinutesGoal, maxActiveMinutesPerDay)),
      maxActiveMinutesPerDay
    );
    const walkMinutesGoal = normalizeDailyGoal(
      settingsObject.walkMinutesGoal,
      Math.floor(Math.min(defaults.walkMinutesGoal, maxActiveMinutesPerDay)),
      maxActiveMinutesPerDay
    );
    if (
      typeof settingsObject.animations !== "boolean" ||
      settingsObject.accent !== accent ||
      settingsObject.workoutMinutesGoal !== workoutMinutesGoal ||
      settingsObject.walkMinutesGoal !== walkMinutesGoal
    ) {
      try {
        localStorage.setItem(settingsKey, JSON.stringify({
          ...defaults,
          ...settingsObject,
          animations,
          accent,
          maxActiveMinutesPerDay,
          workoutMinutesGoal,
          walkMinutesGoal
        }));
      } catch (error) {
        console.error("Не удалось сохранить настройки анимаций и акцентного цвета:", error);
      }
    }
    return {
      trackSleep: typeof settingsObject.trackSleep === "boolean" ? settingsObject.trackSleep : defaults.trackSleep,
      trackWake: typeof settingsObject.trackWake === "boolean" ? settingsObject.trackWake : defaults.trackWake,
      workoutDaysGoal: Number.isFinite(Number(settingsObject.workoutDaysGoal)) ? Number(settingsObject.workoutDaysGoal) : defaults.workoutDaysGoal,
      walkDaysGoal: Number.isFinite(Number(settingsObject.walkDaysGoal)) ? Number(settingsObject.walkDaysGoal) : defaults.walkDaysGoal,
      maxWorkoutsPerDay: Number.isFinite(Number(settingsObject.maxWorkoutsPerDay)) ? Number(settingsObject.maxWorkoutsPerDay) : defaults.maxWorkoutsPerDay,
      maxActiveMinutesPerDay,
      workoutMinutesGoal,
      walkMinutesGoal,
      animations,
      accent
    };
  } catch (error) {
    console.error("Не удалось прочитать настройки:", error);
    return defaults;
  }
}

function isValidActivityType(type) {
  return type &&
    typeof type.id === "string" &&
    typeof type.name === "string" &&
    type.name.trim() &&
    typeof type.emoji === "string" &&
    typeof type.color === "string" &&
    /^#[0-9a-f]{6}$/i.test(type.color);
}

function loadActivityTypes() {
  const savedTypes = localStorage.getItem(activityTypesKey);
  if (savedTypes === null) {
    try {
      localStorage.setItem(activityTypesKey, JSON.stringify(defaultActivityTypes));
      return defaultActivityTypes.map((type) => ({ ...type }));
    } catch (error) {
      console.error("Не удалось создать типы активности по умолчанию:", error);
      return defaultActivityTypes.map((type) => ({ ...type }));
    }
  }

  try {
    const parsedTypes = JSON.parse(savedTypes);
    const ids = new Set();
    if (
      !Array.isArray(parsedTypes) ||
      !parsedTypes.every((type) => {
        if (!isValidActivityType(type) || ids.has(type.id)) {
          return false;
        }
        ids.add(type.id);
        return true;
      })
    ) {
      throw new Error("Список типов активности имеет неверный формат.");
    }
    return parsedTypes;
  } catch (error) {
    console.error("Не удалось прочитать существующий activityTypes:", error);
    return [];
  }
}

function addDefaultActivityIcons(types) {
  const defaultIcons = {
    workout: "workout.svg",
    walk: "walk.svg",
    rest: "rest.svg",
    training: "workout.svg",
    inactive: "rest.svg"
  };
  let changed = false;
  const updatedTypes = types.map((type) => {
    const icon = Object.prototype.hasOwnProperty.call(defaultIcons, type.id) ? defaultIcons[type.id] : null;
    if (icon && !type.icon) {
      changed = true;
      return { ...type, icon };
    }
    return type;
  });

  if (changed) {
    try {
      localStorage.setItem(activityTypesKey, JSON.stringify(updatedTypes));
    } catch (error) {
      console.error("Не удалось сохранить иконки встроенных типов:", error);
    }
  }
  return updatedTypes;
}

function loadEntries() {
  try {
    const savedEntries = localStorage.getItem(storageKey);
    const parsedEntries = savedEntries ? JSON.parse(savedEntries) : {};
    return parsedEntries && typeof parsedEntries === "object" && !Array.isArray(parsedEntries)
      ? parsedEntries
      : {};
  } catch (error) {
    console.error("Не удалось загрузить записи из localStorage:", error);
    return {};
  }
}

function getAppDataForExport() {
  const readJson = (key, fallback) => {
    const storedValue = localStorage.getItem(key);
    return storedValue === null ? fallback : JSON.parse(storedValue);
  };
  const savedTheme = localStorage.getItem(themeKey);

  return {
    [storageKey]: readJson(storageKey, entries),
    [activityTypesKey]: readJson(activityTypesKey, activityTypes),
    [settingsKey]: readJson(settingsKey, appSettings),
    [themeKey]: savedTheme || document.documentElement.dataset.theme
  };
}

function downloadBackup() {
  const backup = {
    app: "constellation",
    version: supportedBackupVersion,
    exportedAt: new Date().toISOString(),
    data: getAppDataForExport()
  };
  const fileDate = new Date();
  const datePart = [
    fileDate.getFullYear(),
    String(fileDate.getMonth() + 1).padStart(2, "0"),
    String(fileDate.getDate()).padStart(2, "0")
  ].join("-");
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  try {
    link.href = objectUrl;
    link.download = `constellation-backup-${datePart}.json`;
    link.hidden = true;
    document.body.append(link);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  } finally {
    link.remove();
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  return parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day;
}

function validateBackup(backup) {
  if (!isPlainObject(backup)) {
    throw new Error("корневое значение должно быть объектом.");
  }
  if (backup.app !== "constellation") {
    throw new Error("это не резервная копия приложения «Созвездие».");
  }
  if (typeof backup.version !== "number" || !Number.isInteger(backup.version) || backup.version < 1) {
    throw new Error("номер версии указан неверно.");
  }
  if (backup.version > supportedBackupVersion) {
    throw new Error("версия файла новее поддерживаемой.");
  }
  if (!isPlainObject(backup.data)) {
    throw new Error("раздел данных должен быть объектом.");
  }

  const data = backup.data;
  if (!Object.prototype.hasOwnProperty.call(data, storageKey) || !isPlainObject(data[storageKey])) {
    throw new Error("записи дней должны быть объектом.");
  }
  for (const [date, entry] of Object.entries(data[storageKey])) {
    if (!isValidDateKey(date) || (!isPlainObject(entry) && typeof entry !== "string")) {
      throw new Error("записи дней содержат неверную дату или запись.");
    }
  }
  if (
    !Object.prototype.hasOwnProperty.call(data, activityTypesKey) ||
    !Array.isArray(data[activityTypesKey])
  ) {
    throw new Error("типы активности должны быть массивом.");
  }
  const activityTypeIds = new Set();
  for (const type of data[activityTypesKey]) {
    if (!isValidActivityType(type) || activityTypeIds.has(type.id)) {
      throw new Error("список типов активности имеет неверный формат.");
    }
    activityTypeIds.add(type.id);
  }
  if (!Object.prototype.hasOwnProperty.call(data, settingsKey) || !isPlainObject(data[settingsKey])) {
    throw new Error("настройки должны быть объектом.");
  }
  if (data[themeKey] !== "light" && data[themeKey] !== "dark") {
    throw new Error("тема указана неверно.");
  }

  return {
    [storageKey]: data[storageKey],
    [activityTypesKey]: data[activityTypesKey],
    [settingsKey]: data[settingsKey],
    [themeKey]: data[themeKey]
  };
}

function replaceAppData(data) {
  const serializedData = new Map([
    [storageKey, JSON.stringify(data[storageKey])],
    [activityTypesKey, JSON.stringify(data[activityTypesKey])],
    [settingsKey, JSON.stringify(data[settingsKey])],
    [themeKey, data[themeKey]]
  ]);
  const previousData = new Map(appStorageKeys.map((key) => [key, localStorage.getItem(key)]));

  try {
    for (const [key, value] of serializedData) {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    let rollbackError = null;
    for (const key of appStorageKeys) {
      try {
        const previousValue = previousData.get(key);
        if (previousValue === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, previousValue);
        }
      } catch (restoreError) {
        rollbackError = restoreError;
      }
    }
    if (rollbackError) {
      console.error("Не удалось полностью восстановить данные после ошибки импорта:", rollbackError);
      throw new Error("ошибка записи, прежние данные не удалось полностью восстановить.");
    }
    throw new Error("не удалось записать данные; прежние данные восстановлены.");
  }
}

function finishImport(saveCurrentCopy) {
  if (!pendingImportData) {
    return;
  }

  if (saveCurrentCopy) {
    try {
      downloadBackup();
    } catch (error) {
      console.error("Не удалось создать резервную копию перед импортом:", error);
      settingsStatus.textContent = "Не удалось сохранить копию. Импорт не выполнен.";
      return;
    }
  }

  try {
    replaceAppData(pendingImportData);
    pendingImportData = null;
    dataImportConfirmation.hidden = true;
    settingsStatus.textContent = "Данные загружены";
    window.setTimeout(() => window.location.reload(), 1200);
  } catch (error) {
    console.error("Не удалось импортировать данные:", error);
    settingsStatus.textContent = `Не удалось импортировать данные: ${error.message}`;
  }
}

function normalizeEntry(entry) {
  if (typeof entry === "string") {
    return { activities: [], water: 0, sleep: "", wake: "", note: entry, completed: false };
  }
  if (!entry || typeof entry !== "object") {
    return { activities: [], water: 0, sleep: "", wake: "", note: "", completed: false };
  }

  const legacyTypeId = (typeId) => {
    if (typeof typeId !== "string") {
      return typeId;
    }
    if (typeId === "training" && activityTypes.some((type) => type.id === "workout")) {
      return "workout";
    }
    if (typeId === "inactive" && activityTypes.some((type) => type.id === "rest")) {
      return "rest";
    }
    return typeId;
  };

  const activities = Array.isArray(entry.activities)
    ? entry.activities
      .filter((activity) => activity && typeof activity.typeId === "string")
      .map((activity) => ({
        typeId: legacyTypeId(activity.typeId),
        duration: activity.duration ?? ""
      }))
    : typeof entry.activity === "string" && entry.activity
      ? [{ typeId: legacyTypeId(entry.activity), duration: entry.duration ?? "" }]
      : [];
  const water = Number(entry.water);

  return {
    activities,
    water: Number.isFinite(water) && water >= 0 ? water : 0,
    sleep: entry.sleep || "",
    wake: entry.wake || "",
    note: entry.note ? String(entry.note) : "",
    completed: entry.completed === true
  };
}

function getEntry(date) {
  return normalizeEntry(entries[date]);
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function softenColor(color) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) {
    return "var(--accent-soft)";
  }
  const channels = [0, 2, 4].map((offset) => parseInt(match[1].slice(offset, offset + 2), 16));
  const softened = channels.map((channel) => Math.round(channel * 0.18 + 255 * 0.82));
  return `rgb(${softened.join(" ")})`;
}

function enhanceDarkActivityColor(color) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) {
    return "var(--accent)";
  }

  const [red, green, blue] = [0, 2, 4].map((offset) => parseInt(match[1].slice(offset, offset + 2), 16) / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  hue = (hue + 360) % 360;
  saturation = Math.max(saturation, 0.45);
  const adjustedLightness = Math.min(0.55, Math.max(0.45, lightness));
  return `hsl(${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(adjustedLightness * 100)}%)`;
}

function darkenActivityIconColor(color) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) {
    return "#788196";
  }

  const [red, green, blue] = [0, 2, 4].map((offset) => parseInt(match[1].slice(offset, offset + 2), 16) / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  let saturation = 0;
  let lightness = (max + min) / 2;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  hue = (hue + 360) % 360;
  lightness *= 0.55;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const secondary = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  const offset = lightness - chroma / 2;
  let channels;
  if (hue < 60) {
    channels = [chroma, secondary, 0];
  } else if (hue < 120) {
    channels = [secondary, chroma, 0];
  } else if (hue < 180) {
    channels = [0, chroma, secondary];
  } else if (hue < 240) {
    channels = [0, secondary, chroma];
  } else if (hue < 300) {
    channels = [secondary, 0, chroma];
  } else {
    channels = [chroma, 0, secondary];
  }

  return `#${channels.map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, "0")).join("")}`;
}

function getActivityIconFilter(color) {
  const cachedId = activityIconFilterIds.get(color);
  if (cachedId) {
    return `url("#${cachedId}")`;
  }

  if (!activityIconFilterSvg) {
    activityIconFilterSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    activityIconFilterSvg.setAttribute("aria-hidden", "true");
    activityIconFilterSvg.setAttribute("width", "0");
    activityIconFilterSvg.setAttribute("height", "0");
    activityIconFilterSvg.style.position = "absolute";
    activityIconFilterSvg.style.overflow = "hidden";
    document.body.append(activityIconFilterSvg);
  }

  const id = `activity-icon-filter-${activityIconFilterIds.size}`;
  const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
  filter.id = id;
  filter.setAttribute("color-interpolation-filters", "sRGB");
  const flood = document.createElementNS("http://www.w3.org/2000/svg", "feFlood");
  flood.setAttribute("flood-color", color);
  flood.setAttribute("result", "icon-color");
  const composite = document.createElementNS("http://www.w3.org/2000/svg", "feComposite");
  composite.setAttribute("in", "icon-color");
  composite.setAttribute("in2", "SourceAlpha");
  composite.setAttribute("operator", "in");
  filter.append(flood, composite);
  activityIconFilterSvg.append(filter);
  activityIconFilterIds.set(color, id);
  return `url("#${id}")`;
}

function createActivityTypeVisual(type) {
  const visual = document.createElement("span");
  visual.className = "activity-type-visual";
  visual.setAttribute("aria-hidden", "true");
  const iconFile = typeof type.icon === "string" && /^[a-z0-9_-]+\.svg$/i.test(type.icon);
  if (!iconFile) {
    visual.textContent = type.emoji || "?";
    return visual;
  }

  const image = document.createElement("img");
  image.src = `./icons/${type.icon}`;
  image.alt = "";
  image.width = 20;
  image.height = 20;
  const iconColor = darkenActivityIconColor(type.color);
  image.style.setProperty("--activity-icon-filter", getActivityIconFilter(iconColor));
  image.addEventListener("error", () => {
    visual.replaceChildren();
    visual.textContent = type.emoji || "?";
  }, { once: true });
  visual.append(image);
  return visual;
}

function renderActivitySelect(select, selectedId = "") {
  select.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = activityTypes.length ? "Выберите тип" : "Добавьте тип в настройках";
  placeholder.disabled = true;
  placeholder.hidden = true;
  select.append(placeholder);

  const rows = Array.from(dayActivityList.querySelectorAll(".day-activity-item"));
  const row = select.closest(".day-activity-item");
  const rowCount = rows.length + (row ? 0 : 1);
  const canSelectRest = rowCount <= 1 || row === rows[0] || isRestTypeId(selectedId);

  for (const type of activityTypes) {
    if (isRestTypeId(type.id) && !canSelectRest) {
      continue;
    }
    const option = document.createElement("option");
    option.value = type.id;
    option.textContent = `${type.icon ? "" : type.emoji} ${type.name}`.trim();
    select.append(option);
  }

  select.value = selectedId;
}

function refreshDayActivitySelects() {
  updateDayActivityFormState();
}

function updateActivityRowVisual(select) {
  const row = select.closest(".day-activity-item");
  const visualContainer = row.querySelector(".activity-row-type-visual");
  const type = activityTypes.find((item) => item.id === select.value);
  visualContainer.replaceChildren(createActivityTypeVisual(type || { emoji: "?" }));
}

function renderActivityTypes() {
  activityTypeList.replaceChildren();
  if (activityTypes.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "Типов активности пока нет.";
    activityTypeList.append(emptyMessage);
    return;
  }

  for (const type of activityTypes) {
    const item = document.createElement("li");
    item.className = "activity-type-item";

    const details = document.createElement("div");
    details.className = "activity-type-details";
    const colorPreview = document.createElement("span");
    colorPreview.className = "type-color-preview";
    colorPreview.style.backgroundColor = type.color;
    colorPreview.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.textContent = type.name;
    details.append(colorPreview, createActivityTypeVisual(type), label);

    const actions = document.createElement("div");
    actions.className = "type-item-actions";
    const editButton = document.createElement("button");
    editButton.className = "secondary-button";
    editButton.type = "button";
    editButton.textContent = "Изменить";
    editButton.addEventListener("click", () => openTypeEditor(type));

    const deleteButton = document.createElement("button");
    deleteButton.className = "secondary-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Удалить";
    deleteButton.addEventListener("click", () => deleteActivityType(type));
    actions.append(editButton, deleteButton);

    item.append(details, actions);
    activityTypeList.append(item);
  }
}

function renderCalendar() {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  monthTitle.textContent = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric"
  }).format(displayedMonth).replace(/\sг\.?$/i, "").replace(/^./, (letter) => letter.toUpperCase());

  calendarDays.replaceChildren();

  for (let i = 0; i < firstWeekday; i += 1) {
    const emptyDay = document.createElement("span");
    emptyDay.className = "empty-day";
    emptyDay.setAttribute("aria-hidden", "true");
    calendarDays.append(emptyDay);
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const date = new Date(year, month, dayNumber);
    const entry = getEntry(dateKey(date));
    const dayTypes = entry.activities
      .map((activity) => {
        const type = activityTypes.find((item) => item.id === activity.typeId);
        return type || { id: null, name: "Неизвестный тип", emoji: "?", color: null };
      });
    const dayButton = document.createElement("button");
    dayButton.className = "day";
    dayButton.type = "button";
    const dateLabel = new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "long"
    }).format(date);
    dayButton.setAttribute("aria-label", dayTypes.length
      ? `${dateLabel}, активности: ${dayTypes.map((type) => type.name).join(", ")}`
      : dateLabel);

    const contents = document.createElement("span");
    contents.className = "day-contents";
    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = String(dayNumber);
    contents.append(number);

    if (dayTypes.length > 0) {
      dayButton.classList.add("has-activity");
      const knownType = dayTypes.find((type) => type.color);
      if (knownType) {
        dayButton.style.setProperty("--activity-color", softenColor(knownType.color));
        dayButton.style.setProperty("--activity-dark-color", enhanceDarkActivityColor(knownType.color));
      } else {
        dayButton.style.setProperty("--activity-color", "var(--accent-soft)");
        dayButton.style.setProperty("--activity-dark-color", "var(--accent)");
      }
      const badges = document.createElement("span");
      badges.className = "day-activities";
      badges.setAttribute("aria-hidden", "true");
      for (const type of dayTypes.slice(0, 3)) {
        badges.append(createActivityTypeVisual(type));
      }
      if (dayTypes.length > 3) {
        const overflow = document.createElement("span");
        overflow.className = "day-activity-overflow";
        overflow.textContent = `+${dayTypes.length - 3}`;
        badges.append(overflow);
      }
      contents.append(badges);
    }

    dayButton.append(contents);

    if (dateKey(date) === dateKey(today)) {
      dayButton.classList.add("is-today");
      dayButton.setAttribute("aria-current", "date");
    }

    if (dateKey(date) === selectedDate) {
      dayButton.classList.add("is-selected");
    }

    dayButton.addEventListener("click", () => openEntry(date, dayButton));
    calendarDays.append(dayButton);
  }
  renderWeeklyProgress();
  renderTodayProgress();
}

function markSavedDay() {
  if (!selectedDate || document.documentElement.dataset.animations === "off") {
    return;
  }

  const [year, month, day] = selectedDate.split("-").map(Number);
  const savedDateLabel = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long"
  }).format(new Date(year, month - 1, day));
  const savedDay = Array.from(calendarDays.querySelectorAll(".day"))
    .find((button) => button.getAttribute("aria-label").startsWith(savedDateLabel));
  const icons = savedDay && savedDay.querySelector(".day-activities");
  if (!savedDay || !icons) {
    return;
  }

  savedDay.classList.add("just-saved");
  icons.addEventListener("animationend", () => {
    savedDay.classList.remove("just-saved");
  }, { once: true });
}

function isWorkoutTypeId(typeId) {
  return typeId === "workout" || typeId === "training";
}

function isWalkTypeId(typeId) {
  return typeId === "walk";
}

function isRestTypeId(typeId) {
  return typeId === "rest" || typeId === "inactive";
}

function formatDuration(totalMinutes) {
  const minutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) {
    return `${remainder} мин`;
  }
  if (remainder === 0) {
    return `${hours} ч`;
  }
  return `${hours} ч ${remainder} мин`;
}

function formatWorkoutCount(count) {
  if (count === 1) {
    return "1 тренировка";
  }
  if (count >= 2 && count <= 4) {
    return `${count} тренировки`;
  }
  return `${count} тренировок`;
}

function renderWeeklyProgress() {
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const mondayOffset = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const formatRangeDate = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth() &&
    weekStart.getFullYear() === weekEnd.getFullYear();
  weekRange.textContent = sameMonth
    ? `${weekStart.getDate()}–${formatRangeDate.format(weekEnd)}`
    : `${formatRangeDate.format(weekStart)} – ${formatRangeDate.format(weekEnd)}`;

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const progressDays = document.querySelector("#week-progress-days");
  progressDays.replaceChildren();

  let workoutDays = 0;
  let walkDays = 0;
  let workoutCount = 0;
  let walkMinutes = 0;

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const entry = getEntry(dateKey(date));
    const workoutActivities = entry.activities.filter((activity) => isWorkoutTypeId(activity.typeId));
    const walkActivities = entry.activities.filter((activity) => isWalkTypeId(activity.typeId));

    if (workoutActivities.length > 0) {
      workoutDays += 1;
      workoutCount += workoutActivities.length;
    }
    if (walkActivities.length > 0) {
      walkDays += 1;
      for (const activity of walkActivities) {
        walkMinutes += Number(activity.duration) || 0;
      }
    }

    const day = document.createElement("span");
    day.className = "week-progress-day";
    day.textContent = dayNames[index];
    if (workoutActivities.length > 0) {
      day.classList.add("has-workout");
    }
    if (walkActivities.length > 0) {
      day.classList.add("has-walk");
    }
    if (dateKey(date) === dateKey(today)) {
      day.classList.add("is-current-week-day");
    }
    progressDays.append(day);
  }

  const trainingProgress = document.querySelector("#training-progress");
  const walkProgress = document.querySelector("#walk-progress");
  trainingProgress.hidden = appSettings.workoutDaysGoal <= 0;
  walkProgress.hidden = appSettings.walkDaysGoal <= 0;
  trainingProgress.textContent =
    `Тренировки: ${workoutDays} из ${appSettings.workoutDaysGoal} дней`;
  walkProgress.textContent =
    `Прогулки: ${walkDays} из ${appSettings.walkDaysGoal} дней`;
  document.querySelector("#weekly-totals").textContent =
    `Итоги недели: ${formatWorkoutCount(workoutCount)}; прогулки — ${formatDuration(walkMinutes)}`;
}

function renderTodayProgress() {
  const entry = getEntry(dateKey(today));
  let workoutMinutes = 0;
  let walkMinutes = 0;
  for (const activity of entry.activities) {
    const minutes = Math.max(0, Math.round(Number(activity.duration) || 0));
    if (isWorkoutTypeId(activity.typeId)) {
      workoutMinutes += minutes;
    } else if (isWalkTypeId(activity.typeId)) {
      walkMinutes += minutes;
    }
  }

  updateDailyGoalScale(workoutDailyGoalScale, appSettings.workoutMinutesGoal, workoutMinutes, true);
  updateDailyGoalScale(walkDailyGoalScale, appSettings.walkMinutesGoal, walkMinutes, false);
  dailyGoalScales.hidden =
    appSettings.workoutMinutesGoal <= 0 && appSettings.walkMinutesGoal <= 0;
  todayProgress.hidden = dailyGoalScales.hidden;
}

function updateDailyGoalScale(scale, goal, minutes, isWorkout) {
  scale.hidden = goal <= 0;
  const progress = scale.querySelector(".daily-goal-track");
  const fill = scale.querySelector(".daily-goal-fill");
  const value = scale.querySelector(".daily-goal-value");
  const completed = minutes >= goal;
  const clampedMinutes = Math.min(minutes, goal);
  const type = activityTypes.find((item) => isWorkout
    ? isWorkoutTypeId(item.id)
    : isWalkTypeId(item.id));

  value.textContent = completed ? "Цель выполнена" : `${minutes} / ${goal} мин`;
  fill.style.width = `${goal > 0 ? clampedMinutes / goal * 100 : 0}%`;
  fill.style.setProperty("--goal-color", type ? type.color : "var(--accent)");
  progress.setAttribute("aria-valuemax", String(goal));
  progress.setAttribute("aria-valuenow", String(clampedMinutes));
  progress.setAttribute("aria-valuetext", completed ? "Цель выполнена" : `${minutes} из ${goal} минут`);
}

function renderDayActivities(activities) {
  dayActivityList.replaceChildren();
  for (const activity of activities) {
    appendDayActivityRow(activity);
  }
  updateDayActivityEmpty();
}

function appendDayActivityRow(activity = {}) {
  const item = document.createElement("li");
  item.className = "day-activity-item";

  const typeLabel = document.createElement("label");
  typeLabel.className = "activity-row-field";
  typeLabel.append("Тип активности");
  const typeSelect = document.createElement("select");
  typeSelect.className = "activity-row-type";
  renderActivitySelect(typeSelect, activity.typeId || "");
  const typeControl = document.createElement("span");
  typeControl.className = "activity-row-type-control";
  const typeVisual = document.createElement("span");
  typeVisual.className = "activity-row-type-visual";
  typeControl.append(typeVisual, typeSelect);
  typeLabel.append(typeControl);
  typeSelect.addEventListener("change", () => {
    const previousTypeId = typeSelect.dataset.previousTypeId || "";
    if (isRestTypeId(typeSelect.value) && dayActivityList.children.length > 1) {
      if (!window.confirm("Убрать остальные активности этого дня?")) {
        typeSelect.value = previousTypeId;
        updateDayActivityFormState();
        return;
      }
      for (const otherRow of Array.from(dayActivityList.children)) {
        if (otherRow !== item) {
          otherRow.remove();
        }
      }
    }
    typeSelect.dataset.previousTypeId = typeSelect.value;
    updateDayActivityFormState();
  });
  typeSelect.dataset.previousTypeId = typeSelect.value;

  const durationLabel = document.createElement("label");
  durationLabel.className = "activity-row-field activity-row-duration-field";
  durationLabel.append("Минуты");
  const durationInput = document.createElement("input");
  durationInput.className = "activity-row-duration";
  durationInput.type = "number";
  durationInput.min = "0";
  durationInput.step = "1";
  durationInput.inputMode = "numeric";
  durationInput.value = activity.duration ?? "";
  durationInput.addEventListener("input", () => {
    updateLoadWarning();
    updateDayGoalScales();
  });
  durationLabel.append(durationInput);

  const restNote = document.createElement("p");
  restNote.className = "rest-activity-note";
  restNote.textContent = "Пропустить день не страшно: можно продолжить потом.";
  restNote.hidden = true;

  const removeButton = document.createElement("button");
  removeButton.className = "secondary-button activity-row-remove";
  removeButton.type = "button";
  removeButton.textContent = "✕";
  removeButton.setAttribute("aria-label", "Удалить строку активности");
  removeButton.addEventListener("click", () => {
    item.remove();
    updateDayActivityFormState();
  });

  item.append(typeLabel, durationLabel, removeButton, restNote);
  updateActivityRowVisual(typeSelect);
  dayActivityList.append(item);
  updateDayActivityFormState();
}

function updateDayActivityFormState() {
  let hasRestActivity = false;
  for (const row of dayActivityList.querySelectorAll(".day-activity-item")) {
    const typeSelect = row.querySelector(".activity-row-type");
    const isRestActivity = isRestTypeId(typeSelect.value);
    row.classList.toggle("is-rest-activity", isRestActivity);
    row.querySelector(".activity-row-duration-field").hidden = isRestActivity;
    row.querySelector(".rest-activity-note").hidden = !isRestActivity;
    hasRestActivity = hasRestActivity || isRestActivity;

    const selectedId = typeSelect.value;
    renderActivitySelect(typeSelect, selectedId);
    typeSelect.dataset.previousTypeId = typeSelect.value;
    updateActivityRowVisual(typeSelect);
  }

  document.querySelector("#add-day-activity").disabled = hasRestActivity;
  document.querySelector("#rest-activity-add-notice").hidden = !hasRestActivity;
  updateDayActivityEmpty();
  updateLoadWarning();
  updateDayGoalScales(hasRestActivity);
}

function updateDayGoalScales(hasRestActivity = false) {
  let workoutMinutes = 0;
  let walkMinutes = 0;
  for (const row of dayActivityList.querySelectorAll(".day-activity-item")) {
    const typeId = row.querySelector(".activity-row-type").value;
    const minutes = Math.max(0, Math.round(Number(row.querySelector(".activity-row-duration").value) || 0));
    if (isWorkoutTypeId(typeId)) {
      workoutMinutes += minutes;
    } else if (isWalkTypeId(typeId)) {
      walkMinutes += minutes;
    }
  }

  updateDailyGoalScale(dayWorkoutDailyGoalScale, appSettings.workoutMinutesGoal, workoutMinutes, true);
  updateDailyGoalScale(dayWalkDailyGoalScale, appSettings.walkMinutesGoal, walkMinutes, false);
  dayDailyGoalScales.hidden = hasRestActivity ||
    (appSettings.workoutMinutesGoal <= 0 && appSettings.walkMinutesGoal <= 0);
}

function updateLoadWarning() {
  const warning = document.querySelector("#load-warning");
  if (!warning) {
    return;
  }

  let workoutCount = 0;
  let totalMinutes = 0;
  for (const row of dayActivityList.querySelectorAll(".day-activity-item")) {
    const typeId = row.querySelector(".activity-row-type").value;
    const duration = Number(row.querySelector(".activity-row-duration").value) || 0;
    if (isWorkoutTypeId(typeId)) {
      workoutCount += 1;
    }
    if (typeId && !isRestTypeId(typeId)) {
      totalMinutes += duration;
    }
  }

  warning.hidden =
    workoutCount <= appSettings.maxWorkoutsPerDay &&
    totalMinutes <= appSettings.maxActiveMinutesPerDay;
}

function updateDayActivityEmpty() {
  dayActivitiesEmpty.hidden = dayActivityList.children.length > 0;
}

function getSleepControlValue(control) {
  const input = control.querySelector('input[type="time"]');
  return input ? input.value : "";
}

function setSleepControl(control, value) {
  control.replaceChildren();

  if (!value) {
    const emptyText = document.createElement("span");
    emptyText.className = "sleep-empty";
    emptyText.textContent = "Не указано";

    const specifyButton = document.createElement("button");
    specifyButton.className = "secondary-button";
    specifyButton.type = "button";
    specifyButton.textContent = "Указать";
    specifyButton.addEventListener("click", () => setSleepControl(control, "specified"));
    control.append(emptyText, specifyButton);
    return;
  }

  const input = document.createElement("input");
  input.type = "time";
  input.value = value === "specified" ? "" : value;

  const clearButton = document.createElement("button");
  clearButton.className = "close-button";
  clearButton.type = "button";
  clearButton.textContent = "✕";
  clearButton.setAttribute("aria-label", "Очистить время");
  clearButton.addEventListener("click", () => setSleepControl(control, ""));

  control.append(input, clearButton);
  input.addEventListener("input", updateSleepDuration);
  updateSleepDuration();
}

function updateSleepDuration() {
  const sleepDuration = document.querySelector("#sleep-duration");
  if (!appSettings.trackSleep || !appSettings.trackWake) {
    sleepDuration.hidden = true;
    return;
  }

  const sleepControl = document.querySelector("#sleep-time-control");
  const wakeControl = document.querySelector("#wake-time-control");
  const sleepValue = getSleepControlValue(sleepControl);
  const wakeValue = getSleepControlValue(wakeControl);
  if (!sleepValue || !wakeValue) {
    sleepDuration.hidden = true;
    return;
  }

  const [sleepHours, sleepMinutes] = sleepValue.split(":").map(Number);
  const [wakeHours, wakeMinutes] = wakeValue.split(":").map(Number);
  let totalMinutes = (wakeHours * 60 + wakeMinutes) - (sleepHours * 60 + sleepMinutes);
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  sleepDuration.textContent = `Продолжительность сна: ${hours} ч ${minutes} мин`;
  sleepDuration.hidden = false;
}

function cancelModalClose(dialog) {
  const closeState = modalCloseStates.get(dialog);
  if (closeState) {
    window.clearTimeout(closeState.timer);
    dialog.removeEventListener("animationend", closeState.onAnimationEnd);
    modalCloseStates.delete(dialog);
  }
  dialog.classList.remove("closing");
}

function closeModal(dialog) {
  if (!dialog.open || dialog.classList.contains("closing")) {
    return;
  }

  dialog.classList.add("closing");
  if (
    document.documentElement.dataset.animations === "off"
  ) {
    dialog.close();
    dialog.classList.remove("closing");
    return;
  }

  const finishClose = () => {
    const closeState = modalCloseStates.get(dialog);
    if (!closeState) {
      return;
    }

    window.clearTimeout(closeState.timer);
    dialog.removeEventListener("animationend", closeState.onAnimationEnd);
    modalCloseStates.delete(dialog);
    if (dialog.open) {
      dialog.close();
    }
    dialog.classList.remove("closing");
  };
  const onAnimationEnd = (event) => {
    if (event.target === dialog && event.animationName === "modal-disappear") {
      finishClose();
    }
  };

  dialog.addEventListener("animationend", onAnimationEnd);
  const timer = window.setTimeout(finishClose, 250);
  modalCloseStates.set(dialog, { timer, onAnimationEnd });
}

function openEntry(date, dayButton) {
  cancelModalClose(entryPanel);
  selectedDate = dateKey(date);
  const previousSelection = calendarDays.querySelector(".day.is-selected");
  if (previousSelection) {
    previousSelection.classList.remove("is-selected");
  }
  dayButton.classList.add("is-selected");

  const entry = getEntry(selectedDate);
  entryTitle.textContent = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long"
  }).format(date);
  if (!entryPanel.open) {
    entryPanel.showModal();
  }
  if (entry.completed) {
    showEntryView();
  } else if (Object.prototype.hasOwnProperty.call(entries, selectedDate)) {
    showEntryForm(true);
  } else {
    showEntryForm(false);
  }
}

function showEntryForm(showCancel) {
  appSettings = loadSettings();
  const entry = Object.prototype.hasOwnProperty.call(entries, selectedDate)
    ? getEntry(selectedDate)
    : normalizeEntry(null);
  renderDayActivities(entry.activities);
  if (entry.activities.length === 0) {
    appendDayActivityRow();
  }
  updateLoadWarning();
  waterCount.value = String(entry.water);
  const sleepField = document.querySelector("#sleep-field");
  const wakeField = document.querySelector("#wake-field");
  const sleepControl = document.querySelector("#sleep-time-control");
  const wakeControl = document.querySelector("#wake-time-control");
  sleepField.hidden = !appSettings.trackSleep;
  wakeField.hidden = !appSettings.trackWake;
  setSleepControl(sleepControl, entry.sleep || "");
  setSleepControl(wakeControl, entry.wake || "");
  updateSleepDuration();
  entryText.value = entry.note;
  saveStatus.textContent = "";
  entryForm.hidden = false;
  entryView.hidden = true;
  document.querySelector("#clear-entry").hidden = !Object.prototype.hasOwnProperty.call(entries, selectedDate);
  document.querySelector("#finish-entry").hidden = selectedDateIsFuture();
}

function selectedDateIsFuture() {
  if (!selectedDate) {
    return false;
  }
  const date = new Date(`${selectedDate}T00:00:00`);
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return date > current;
}

function showEntryView() {
  appSettings = loadSettings();
  const entry = getEntry(selectedDate);
  entryViewActivities.replaceChildren();
  for (const activity of entry.activities) {
    const type = activityTypes.find((item) => item.id === activity.typeId);
    const item = document.createElement("li");
    item.append(createActivityTypeVisual(type || { emoji: "?" }));
    const name = type ? type.name : "Неизвестный тип";
    item.append(document.createTextNode(activity.duration ? `${name} — ${activity.duration} мин.` : name));
    entryViewActivities.append(item);
  }

  entryViewEmpty.hidden = entry.activities.length > 0;
  entryViewWater.textContent = String(entry.water);
  entryViewSleep.textContent = entry.sleep || "Не указано";
  entryViewWake.textContent = entry.wake || "Не указано";
  entryViewSleep.parentElement.hidden = !appSettings.trackSleep;
  entryViewWake.parentElement.hidden = !appSettings.trackWake;
  const durationElement = document.querySelector("#entry-view-sleep-duration");
  if (appSettings.trackSleep && appSettings.trackWake && entry.sleep && entry.wake) {
    const [sleepHours, sleepMinutes] = entry.sleep.split(":").map(Number);
    const [wakeHours, wakeMinutes] = entry.wake.split(":").map(Number);
    let totalMinutes = (wakeHours * 60 + wakeMinutes) - (sleepHours * 60 + sleepMinutes);
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    durationElement.textContent = `Продолжительность сна: ${Math.floor(totalMinutes / 60)} ч ${totalMinutes % 60} мин`;
    durationElement.hidden = false;
  } else {
    durationElement.hidden = true;
  }
  entryViewNote.textContent = entry.note ? `Запись: ${entry.note}` : "";
  entryViewNote.hidden = !entry.note;
  entryViewStatus.textContent = "";
  entryForm.hidden = true;
  entryView.hidden = false;
}

function showStarBurst() {
  if (document.documentElement.dataset.animations === "off") {
    return;
  }

  const scrollContainer = entryPanel.querySelector(".entry-panel-scroll");
  if (scrollContainer.querySelector(".entry-stars")) {
    return;
  }

  const starsLayer = document.createElement("div");
  starsLayer.className = "entry-stars";
  starsLayer.setAttribute("aria-hidden", "true");

  const starCount = 15 + Math.floor(Math.random() * 5);
  let finishedStars = 0;
  let removalTimer;
  const removeLayer = () => {
    window.clearTimeout(removalTimer);
    starsLayer.remove();
  };

  for (let index = 0; index < starCount; index += 1) {
    const star = document.createElement("span");
    star.className = "entry-star";
    star.style.setProperty("--star-left", `${Math.random() * 100}%`);
    star.style.setProperty("--star-bottom", `${Math.random() * 24}%`);
    star.style.setProperty("--star-size", `${10 + Math.random() * 12}px`);
    star.style.setProperty("--star-delay", `${Math.random() * 0.8}s`);
    star.style.setProperty("--star-duration", `${1.8 + Math.random()}s`);
    star.style.setProperty("--star-drift", `${Math.random() * 120 - 60}px`);
    star.style.setProperty("--star-rotation", `${Math.random() * 160 - 80}deg`);
    star.addEventListener("animationend", () => {
      finishedStars += 1;
      if (finishedStars === starCount) {
        removeLayer();
      }
    }, { once: true });
    starsLayer.append(star);
  }

  scrollContainer.append(starsLayer);
  removalTimer = window.setTimeout(removeLayer, 3700);
}

function addDayActivity() {
  if (dayActivityList.querySelector(".day-activity-item.is-rest-activity")) {
    return;
  }
  appendDayActivityRow();
  saveStatus.textContent = "";
}

function collectDayActivities() {
  const activities = Array.from(dayActivityList.querySelectorAll(".day-activity-item"))
    .map((row) => ({
      typeId: row.querySelector(".activity-row-type").value,
      duration: row.querySelector(".activity-row-duration").value
    }))
    .filter((activity) => activity.typeId);
  const restActivity = activities.find((activity) => isRestTypeId(activity.typeId));
  return restActivity ? [{ typeId: restActivity.typeId }] : activities;
}

function saveEntry() {
  if (!selectedDate) {
    return;
  }

  const activities = collectDayActivities();

  const sleepControl = document.querySelector("#sleep-time-control");
  const wakeControl = document.querySelector("#wake-time-control");
  const currentEntry = getEntry(selectedDate);
  const sleepValue = appSettings.trackSleep ? getSleepControlValue(sleepControl) : currentEntry.sleep;
  const wakeValue = appSettings.trackWake ? getSleepControlValue(wakeControl) : currentEntry.wake;

  const updatedEntries = {
    ...entries,
    [selectedDate]: {
      activities,
      water: Number(waterCount.value),
      sleep: sleepValue,
      wake: wakeValue,
      note: entryText.value,
      completed: currentEntry.completed
    }
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(updatedEntries));
    entries = updatedEntries;
    saveStatus.textContent = "Сохранено";
    renderCalendar();
    markSavedDay();
    closeModal(entryPanel);
  } catch (error) {
    console.error("Не удалось сохранить запись в localStorage:", error);
    saveStatus.textContent = "Не удалось сохранить запись";
  }
}

function clearEntry() {
  if (!selectedDate || !Object.prototype.hasOwnProperty.call(entries, selectedDate)) {
    return;
  }
  if (!window.confirm("Очистить все данные этого дня?")) {
    return;
  }

  const updatedEntries = { ...entries };
  delete updatedEntries[selectedDate];
  try {
    localStorage.setItem(storageKey, JSON.stringify(updatedEntries));
    entries = updatedEntries;
    renderCalendar();
    showEntryForm(false);
  } catch (error) {
    console.error("Не удалось очистить данные дня:", error);
    entryViewStatus.textContent = "Не удалось очистить данные дня.";
  }
}

function finishEntry() {
  if (!selectedDate) {
    return;
  }

  const activities = collectDayActivities();

  const sleepControl = document.querySelector("#sleep-time-control");
  const wakeControl = document.querySelector("#wake-time-control");
  const currentEntry = getEntry(selectedDate);
  const sleepValue = appSettings.trackSleep ? getSleepControlValue(sleepControl) : currentEntry.sleep;
  const wakeValue = appSettings.trackWake ? getSleepControlValue(wakeControl) : currentEntry.wake;

  const updatedEntries = {
    ...entries,
    [selectedDate]: {
      activities,
      water: Number(waterCount.value),
      sleep: sleepValue,
      wake: wakeValue,
      note: entryText.value,
      completed: true
    }
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(updatedEntries));
    entries = updatedEntries;
    renderCalendar();
    showEntryView();
    showStarBurst();
  } catch (error) {
    console.error("Не удалось сохранить завершённый день:", error);
    entryViewStatus.textContent = "Не удалось сохранить данные дня.";
  }
}

function saveActivityTypes(nextTypes) {
  try {
    localStorage.setItem(activityTypesKey, JSON.stringify(nextTypes));
    activityTypes = nextTypes;
    renderActivityTypes();
    refreshDayActivitySelects();
    renderCalendar();
    return true;
  } catch (error) {
    console.error("Не удалось сохранить типы активности:", error);
    settingsStatus.textContent = "Не удалось сохранить типы активности.";
    return false;
  }
}

function openTypeEditor(type = null) {
  editingActivityTypeId = type ? type.id : null;
  typeEditorTitle.textContent = type ? "Изменить тип активности" : "Добавить тип активности";
  typeNameInput.value = type ? type.name : "";
  typeEmojiInput.value = type ? type.emoji : "";
  typeColorInput.value = type ? type.color : "#dce5ff";
  settingsStatus.textContent = "";
  typeEditor.hidden = false;
  typeNameInput.focus();
}

function closeTypeEditor() {
  typeEditor.hidden = true;
  editingActivityTypeId = null;
}

function createActivityTypeId() {
  let id;
  do {
    id = `activity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  } while (activityTypes.some((type) => type.id === id));
  return id;
}

function saveActivityType() {
  const name = typeNameInput.value.trim();
  if (!name) {
    settingsStatus.textContent = "Введите название типа.";
    typeNameInput.focus();
    return;
  }

  const currentType = activityTypes.find((type) => type.id === editingActivityTypeId);
  const updatedType = {
    id: currentType ? currentType.id : createActivityTypeId(),
    name,
    emoji: typeEmojiInput.value,
    color: typeColorInput.value,
    icon: currentType && currentType.icon ? currentType.icon : ""
  };
  const nextTypes = currentType
    ? activityTypes.map((type) => type.id === currentType.id ? updatedType : type)
    : [...activityTypes, updatedType];

  if (saveActivityTypes(nextTypes)) {
    closeTypeEditor();
    settingsStatus.textContent = "Тип активности сохранён.";
  }
}

function deleteActivityType(type) {
  const datesUsingType = Object.entries(entries)
    .filter(([, entry]) => normalizeEntry(entry).activities.some((activity) => activity.typeId === type.id));
  if (
    datesUsingType.length > 0 &&
    !window.confirm(`Тип «${type.name}» используется в записях. Удалить его и связанные активности?`)
  ) {
    return;
  }

  const nextTypes = activityTypes.filter((item) => item.id !== type.id);
  const nextEntries = { ...entries };
  for (const [date, entry] of datesUsingType) {
    const normalized = normalizeEntry(entry);
    nextEntries[date] = {
      ...normalized,
      activities: normalized.activities.filter((activity) => activity.typeId !== type.id)
    };
  }

  let entriesWritten = false;
  let previousEntries = null;
  try {
    if (datesUsingType.length > 0) {
      previousEntries = localStorage.getItem(storageKey);
      localStorage.setItem(storageKey, JSON.stringify(nextEntries));
      entriesWritten = true;
    }
    localStorage.setItem(activityTypesKey, JSON.stringify(nextTypes));
  } catch (error) {
    console.error("Не удалось удалить тип активности:", error);
    if (entriesWritten) {
      try {
        if (previousEntries === null) {
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(storageKey, previousEntries);
        }
      } catch (rollbackError) {
        console.error("Не удалось восстановить записи после ошибки удаления типа:", rollbackError);
      }
    }
    settingsStatus.textContent = "Не удалось удалить тип активности.";
    return;
  }

  entries = nextEntries;
  activityTypes = nextTypes;
  settingsStatus.textContent = "";
  renderActivityTypes();
  refreshDayActivitySelects();
  renderCalendar();
}

function setSettingFieldError(errorElement, message) {
  errorElement.textContent = message;
  errorElement.hidden = message === "";
}

function validateDailyGoalSetting(input, errorElement) {
  const value = Number(input.value);
  const maximum = Number(maxActiveMinutesSetting.value);
  if (
    input.value.trim() === "" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 600 ||
    !Number.isFinite(maximum) ||
    value > maximum
  ) {
    input.value = input.dataset.previousValidValue;
    setSettingFieldError(errorElement, "Введите целое число от 0 до 600, не больше дневного максимума.");
    return false;
  }

  input.dataset.previousValidValue = String(value);
  setSettingFieldError(errorElement, "");
  return true;
}

function validateWeeklyGoalSetting(input, errorElement) {
  const value = Number(input.value);
  if (
    input.value.trim() === "" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 7
  ) {
    input.value = input.dataset.previousValidValue;
    setSettingFieldError(errorElement, "Введите целое число от 0 до 7.");
    return false;
  }

  input.dataset.previousValidValue = String(value);
  setSettingFieldError(errorElement, "");
  return true;
}

function validateNonnegativeSetting(input, errorElement, integer = false) {
  const value = Number(input.value);
  if (
    input.value.trim() === "" ||
    !Number.isFinite(value) ||
    value < 0 ||
    (integer && !Number.isInteger(value))
  ) {
    input.value = input.dataset.previousValidValue;
    setSettingFieldError(errorElement, integer ? "Введите неотрицательное целое число." : "Введите неотрицательное число.");
    return false;
  }

  input.dataset.previousValidValue = String(value);
  setSettingFieldError(errorElement, "");
  return true;
}

function validateMaxActiveMinutesSetting() {
  const value = Number(maxActiveMinutesSetting.value);
  const dailyGoals = [workoutMinutesGoalSetting, walkMinutesGoalSetting].map((input) => Number(input.value));
  if (
    maxActiveMinutesSetting.value.trim() === "" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    maxActiveMinutesSetting.value = maxActiveMinutesSetting.dataset.previousValidValue;
    setSettingFieldError(maxActiveMinutesError, "Введите неотрицательное число.");
    return false;
  }
  if (dailyGoals.some((goal) => goal > value)) {
    maxActiveMinutesSetting.value = maxActiveMinutesSetting.dataset.previousValidValue;
    setSettingFieldError(maxActiveMinutesError, "Максимум не может быть меньше дневных целей.");
    return false;
  }

  maxActiveMinutesSetting.dataset.previousValidValue = String(value);
  setSettingFieldError(maxActiveMinutesError, "");
  return true;
}

document.querySelector("#settings-toggle").addEventListener("click", () => {
  if (settingsDialog.classList.contains("closing")) {
    cancelModalClose(settingsDialog);
    settingsToggle.setAttribute("aria-expanded", "true");
    return;
  }

  if (!settingsDialog.open) {
    animationsSetting.checked = appSettings.animations;
    applyAccent(appSettings.accent);
    trackSleepSetting.checked = appSettings.trackSleep;
    trackWakeSetting.checked = appSettings.trackWake;
    workoutDaysGoal.value = appSettings.workoutDaysGoal;
    walkDaysGoal.value = appSettings.walkDaysGoal;
    maxWorkoutsSetting.value = appSettings.maxWorkoutsPerDay;
    maxActiveMinutesSetting.value = appSettings.maxActiveMinutesPerDay;
    workoutMinutesGoalSetting.value = appSettings.workoutMinutesGoal;
    walkMinutesGoalSetting.value = appSettings.walkMinutesGoal;
    maxActiveMinutesSetting.dataset.previousValidValue = String(appSettings.maxActiveMinutesPerDay);
    maxWorkoutsSetting.dataset.previousValidValue = String(appSettings.maxWorkoutsPerDay);
    workoutMinutesGoalSetting.dataset.previousValidValue = String(appSettings.workoutMinutesGoal);
    walkMinutesGoalSetting.dataset.previousValidValue = String(appSettings.walkMinutesGoal);
    workoutDaysGoal.dataset.previousValidValue = String(appSettings.workoutDaysGoal);
    walkDaysGoal.dataset.previousValidValue = String(appSettings.walkDaysGoal);
    for (const errorElement of [
      workoutMinutesGoalError,
      walkMinutesGoalError,
      workoutDaysGoalError,
      walkDaysGoalError,
      maxWorkoutsError,
      maxActiveMinutesError
    ]) {
      setSettingFieldError(errorElement, "");
    }
    settingsDialog.showModal();
    settingsToggle.setAttribute("aria-expanded", "true");
  }
});

exportDataButton.addEventListener("click", () => {
  try {
    downloadBackup();
    settingsStatus.textContent = "";
  } catch (error) {
    console.error("Не удалось экспортировать данные:", error);
    settingsStatus.textContent = "Не удалось создать файл экспорта.";
  }
});

importDataButton.addEventListener("click", () => {
  pendingImportData = null;
  dataImportConfirmation.hidden = true;
  settingsStatus.textContent = "";
  importDataFile.value = "";
  importDataFile.click();
});

importDataFile.addEventListener("change", async () => {
  const file = importDataFile.files[0];
  importDataFile.value = "";
  if (!file) {
    return;
  }

  pendingImportData = null;
  dataImportConfirmation.hidden = true;
  settingsStatus.textContent = "";
  if (file.size > maxBackupSize) {
    settingsStatus.textContent = "Файл не подходит: размер превышает 5 МБ.";
    return;
  }

  let fileText;
  try {
    fileText = await file.text();
  } catch (error) {
    console.error("Не удалось прочитать файл импорта:", error);
    settingsStatus.textContent = "Файл не подходит: не удалось прочитать файл.";
    return;
  }

  let backup;
  try {
    backup = JSON.parse(fileText);
  } catch {
    settingsStatus.textContent = "Файл не подходит: некорректный JSON.";
    return;
  }

  try {
    pendingImportData = validateBackup(backup);
  } catch (error) {
    settingsStatus.textContent = `Файл не подходит: ${error.message}`;
    return;
  }

  dataImportConfirmationMessage.textContent =
    `Заменить текущие данные данными из файла? Дней в файле: ${Object.keys(pendingImportData[storageKey]).length}.`;
  dataImportConfirmation.hidden = false;
});

importWithBackupButton.addEventListener("click", () => finishImport(true));
importWithoutBackupButton.addEventListener("click", () => finishImport(false));
cancelImportButton.addEventListener("click", () => {
  pendingImportData = null;
  dataImportConfirmation.hidden = true;
  settingsStatus.textContent = "";
});

animationsSetting.addEventListener("change", () => {
  appSettings = { ...appSettings, animations: animationsSetting.checked };
  applyAnimationSetting(appSettings.animations);
  try {
    localStorage.setItem(settingsKey, JSON.stringify(appSettings));
    settingsStatus.textContent = "";
  } catch (error) {
    console.error("Не удалось сохранить настройку анимаций:", error);
    settingsStatus.textContent = "Не удалось сохранить настройку анимаций.";
  }
});

maxActiveMinutesSetting.addEventListener("change", validateMaxActiveMinutesSetting);
maxWorkoutsSetting.addEventListener("change", () => validateNonnegativeSetting(maxWorkoutsSetting, maxWorkoutsError, true));
workoutMinutesGoalSetting.addEventListener("change", () => validateDailyGoalSetting(workoutMinutesGoalSetting, workoutMinutesGoalError));
walkMinutesGoalSetting.addEventListener("change", () => validateDailyGoalSetting(walkMinutesGoalSetting, walkMinutesGoalError));
workoutDaysGoal.addEventListener("change", () => validateWeeklyGoalSetting(workoutDaysGoal, workoutDaysGoalError));
walkDaysGoal.addEventListener("change", () => validateWeeklyGoalSetting(walkDaysGoal, walkDaysGoalError));

accentPalette.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }
  const button = event.target.closest("[data-accent-choice]");
  if (!button || !accentPalette.contains(button)) {
    return;
  }

  appSettings = { ...appSettings, accent: applyAccent(button.dataset.accentChoice) };
  try {
    localStorage.setItem(settingsKey, JSON.stringify(appSettings));
    settingsStatus.textContent = "";
  } catch (error) {
    console.error("Не удалось сохранить акцентный цвет:", error);
    settingsStatus.textContent = "Не удалось сохранить акцентный цвет.";
  }
});

settingsDialog.addEventListener("close", () => {
  settingsToggle.setAttribute("aria-expanded", "false");
  settingsToggle.focus();
});

settingsDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeModal(settingsDialog);
});

settingsDialog.addEventListener("click", (event) => {
  if (event.target !== settingsDialog) {
    return;
  }

  const bounds = settingsDialog.getBoundingClientRect();
  const clickedOutside = event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom;
  if (clickedOutside) {
    closeModal(settingsDialog);
  }
});

document.querySelector("#settings-close").addEventListener("click", () => closeModal(settingsDialog));
document.querySelector("#settings-done").addEventListener("click", () => {
  if (
    !validateWeeklyGoalSetting(workoutDaysGoal, workoutDaysGoalError) ||
    !validateWeeklyGoalSetting(walkDaysGoal, walkDaysGoalError) ||
    !validateNonnegativeSetting(maxWorkoutsSetting, maxWorkoutsError, true) ||
    !validateMaxActiveMinutesSetting() ||
    !validateDailyGoalSetting(workoutMinutesGoalSetting, workoutMinutesGoalError) ||
    !validateDailyGoalSetting(walkMinutesGoalSetting, walkMinutesGoalError)
  ) {
    return;
  }

  appSettings = {
    animations: animationsSetting.checked,
    accent: document.documentElement.dataset.accent,
    trackSleep: trackSleepSetting.checked,
    trackWake: trackWakeSetting.checked,
    workoutDaysGoal: Number(workoutDaysGoal.value),
    walkDaysGoal: Number(walkDaysGoal.value),
    maxWorkoutsPerDay: Number(maxWorkoutsSetting.value),
    maxActiveMinutesPerDay: Number(maxActiveMinutesSetting.value),
    workoutMinutesGoal: Number(workoutMinutesGoalSetting.value),
    walkMinutesGoal: Number(walkMinutesGoalSetting.value)
  };
  applyAnimationSetting(appSettings.animations);
  try {
    localStorage.setItem(settingsKey, JSON.stringify(appSettings));
  } catch (error) {
    console.error("Не удалось сохранить настройки:", error);
  }
  renderWeeklyProgress();
  renderTodayProgress();
  updateDayGoalScales();
  updateLoadWarning();
  closeModal(settingsDialog);
});
document.querySelector("#close-entry-dialog").addEventListener("click", () => closeModal(entryPanel));
document.querySelector("#back-to-edit").addEventListener("click", () => showEntryForm(true));
document.querySelector("#clear-entry").addEventListener("click", clearEntry);
document.querySelector("#close-entry-view").addEventListener("click", () => closeModal(entryPanel));
document.querySelector("#finish-entry").addEventListener("click", finishEntry);
document.querySelector("#add-activity-type").addEventListener("click", () => openTypeEditor());
document.querySelector("#save-activity-type").addEventListener("click", saveActivityType);
document.querySelector("#cancel-activity-type").addEventListener("click", closeTypeEditor);
document.querySelector("#add-day-activity").addEventListener("click", addDayActivity);
document.querySelector("#save-entry").addEventListener("click", saveEntry);
document.querySelector("#water-minus").addEventListener("click", () => {
  waterCount.value = String(Math.max(0, Number(waterCount.value) - 1));
});
document.querySelector("#water-plus").addEventListener("click", () => {
  waterCount.value = String(Number(waterCount.value) + 1);
});

document.querySelector("#previous-month").addEventListener("click", () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
  renderCalendar();
});

document.querySelector("#next-month").addEventListener("click", () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
  renderCalendar();
});

calendarDays.addEventListener("pointerdown", (event) => {
  if (
    (event.pointerType !== "touch" && event.pointerType !== "pen") ||
    document.documentElement.dataset.animations === "off" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !(event.target instanceof Element)
  ) {
    return;
  }

  const day = event.target.closest(".day");
  if (!day || !calendarDays.contains(day)) {
    return;
  }

  const bounds = day.getBoundingClientRect();
  const previousTimer = calendarRippleTimers.get(day);
  if (previousTimer !== undefined) {
    window.clearTimeout(previousTimer);
  }
  day.classList.remove("ripple");
  day.style.setProperty("--mx", `${event.clientX - bounds.left - day.clientLeft}px`);
  day.style.setProperty("--my", `${event.clientY - bounds.top - day.clientTop}px`);
  void day.offsetWidth;
  day.classList.add("ripple");
  calendarRippleTimers.set(day, window.setTimeout(() => {
    day.classList.remove("ripple");
    calendarRippleTimers.delete(day);
  }, 500));
});

calendarDays.addEventListener("animationend", (event) => {
  if (!(event.target instanceof Element) || !event.target.matches(".day") || event.animationName !== "calendar-cell-ripple") {
    return;
  }

  const timer = calendarRippleTimers.get(event.target);
  if (timer !== undefined) {
    window.clearTimeout(timer);
  }
  calendarRippleTimers.delete(event.target);
  event.target.classList.remove("ripple");
});

entryPanel.addEventListener("click", (event) => {
  if (event.target !== entryPanel) {
    return;
  }
  const bounds = entryPanel.getBoundingClientRect();
  const clickedOutside = event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom;
  if (clickedOutside) {
    closeModal(entryPanel);
  }
});

entryPanel.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeModal(entryPanel);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsDialog.open) {
    event.preventDefault();
    closeModal(settingsDialog);
    return;
  }
  if (event.key === "Escape" && entryPanel.open) {
    event.preventDefault();
    closeModal(entryPanel);
  }
});

renderActivityTypes();
renderCalendar();
