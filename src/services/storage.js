import { STORAGE_KEYS } from "../config/constants.js";
import { toNumericId } from "../core/normalizers.js";
import { state } from "../core/context.js";

function getAulaByIdLocal(aulaId) {
    const normalizedAulaId = toNumericId(aulaId);
    return state.aulas.find((aula) => toNumericId(aula.id) === normalizedAulaId) || null;
}

export function loadWatchMetrics() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.watchMetrics);
        if (!raw) {
            return {};
        }

        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed;
        }

        return {};
    } catch (_error) {
        return {};
    }
}

export function initializeStorageState() {
    state.watchMetrics = loadWatchMetrics();
}

export function getAulaKey(aulaId) {
    return String(aulaId);
}

export function buildAulaFingerprint(aula) {
    if (!aula) {
        return "";
    }

    const id = String(aula.id ?? "");
    const moduloId = String(aula.moduloId ?? "");
    const titulo = String(aula.titulo || "").trim().toLowerCase();
    const video = String(aula.linkYoutube || "").trim().toLowerCase();

    return `${id}|${moduloId}|${titulo}|${video}`;
}

export function persistWatchMetrics() {
    localStorage.setItem(STORAGE_KEYS.watchMetrics, JSON.stringify(state.watchMetrics));
}

export function sanitizeWatchMetrics() {
    const cleaned = {};

    state.aulas.forEach((aula) => {
        const key = getAulaKey(aula.id);
        const metric = state.watchMetrics[key];
        if (!metric) {
            return;
        }

        const expectedFingerprint = buildAulaFingerprint(aula);
        if (!expectedFingerprint || metric.fingerprint !== expectedFingerprint) {
            return;
        }

        cleaned[key] = {
            watchedSeconds: Number(metric.watchedSeconds) || 0,
            durationSeconds: Number(metric.durationSeconds) || 0,
            lastPositionSeconds: Number(metric.lastPositionSeconds ?? metric.watchedSeconds) || 0,
            progressPercent: Number(metric.progressPercent) || 0,
            completed: Boolean(metric.completed),
            completedAt: metric.completedAt || null,
            fingerprint: expectedFingerprint
        };
    });

    state.watchMetrics = cleaned;
    persistWatchMetrics();
}

export function getAulaMetric(aulaOrId) {
    const aula = typeof aulaOrId === "object" ? aulaOrId : getAulaByIdLocal(aulaOrId);
    const key = getAulaKey(typeof aulaOrId === "object" ? aulaOrId?.id : aulaOrId);
    const metric = state.watchMetrics[key] || null;

    if (!metric) {
        return null;
    }

    if (aula) {
        const expectedFingerprint = buildAulaFingerprint(aula);
        if (!expectedFingerprint || metric.fingerprint !== expectedFingerprint) {
            return null;
        }
    }

    return metric;
}

export function setAulaMetric(aulaOrId, metric) {
    const aula = typeof aulaOrId === "object" ? aulaOrId : getAulaByIdLocal(aulaOrId);
    const key = getAulaKey(typeof aulaOrId === "object" ? aulaOrId?.id : aulaOrId);
    const fingerprint = aula ? buildAulaFingerprint(aula) : metric.fingerprint || "";

    state.watchMetrics[key] = {
        ...metric,
        fingerprint
    };

    persistWatchMetrics();
}

export function isAulaWatched(aulaOrId) {
    return Boolean(getAulaMetric(aulaOrId)?.completed);
}

export function getAulaProgressPercent(aulaOrId) {
    const metric = getAulaMetric(aulaOrId);
    return Number(metric?.progressPercent) || 0;
}

export function saveToken(token) {
    state.token = token;
    localStorage.setItem(STORAGE_KEYS.token, token);
}

export function clearToken() {
    state.token = "";
    localStorage.removeItem(STORAGE_KEYS.token);
}
