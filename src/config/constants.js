export const STORAGE_KEYS = {
    token: "jm.jwt",
    apiBaseUrl: "jm.apiBaseUrl",
    watchMetrics: "jm.aulaWatchMetrics",
    watchedAulasLegacy: "jm.watchedAulas"
};

export const API_BASE_URL = (window.API_BASE_URL || localStorage.getItem(STORAGE_KEYS.apiBaseUrl) || "http://localhost:8081").replace(/\/$/, "");
export const COURSE_COVER_IMAGE = "assets/img-01-course.webp";

export const UI_STATES = {
    info: "info",
    loading: "loading",
    success: "success",
    error: "error"
};

export const AUTH_STEPS = {
    email: "email",
    senha: "senha"
};

export const AUTH_MODES = {
    login: "login",
    cadastro: "cadastro"
};

export const CADASTRO_STEPS = {
    email: "email",
    senha: "senha"
};

export const WATCH_RULES = {
    uiRefreshIntervalMs: 3000
};

export const STATUS_MESSAGE_SUPPRESSION_PATTERNS = [
    /^video pronto\./,
    /^video retomado de onde voce parou\./,
    /^carregando video da aula\.{3}$/,
    /^catalogo principal aberto\.$/,
    /^area de certificados aberta\.$/,
    /^area de perfil aberta\.$/,
    /^cursos, modulos e aulas atualizados em tempo real\.$/
];

export const REALTIME_SYNC_INTERVAL_MS = 6000;
