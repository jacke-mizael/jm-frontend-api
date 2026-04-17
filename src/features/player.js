import { WATCH_RULES, UI_STATES } from "../config/constants.js";
import { playerRuntime, state, ui } from "../core/context.js";
import { toNumericId } from "../core/normalizers.js";
import { getYouTubeVideoId } from "../core/youtube.js";
import { setStatus } from "../core/feedback.js";
import { getAulaMetric, setAulaMetric } from "../services/storage.js";

let refreshProgressUiHook = () => {};

function getAulaByIdLocal(aulaId) {
    const normalizedAulaId = toNumericId(aulaId);
    return state.aulas.find((aula) => toNumericId(aula.id) === normalizedAulaId) || null;
}

export function setPlayerRefreshHook(callback) {
    if (typeof callback === "function") {
        refreshProgressUiHook = callback;
    }
}

export function stopPlayerInterval() {
    if (playerRuntime.intervalId) {
        window.clearInterval(playerRuntime.intervalId);
        playerRuntime.intervalId = null;
    }
}

export function clearFirstReadyTimeout() {
    if (playerRuntime.firstReadyTimeoutId) {
        window.clearTimeout(playerRuntime.firstReadyTimeoutId);
        playerRuntime.firstReadyTimeoutId = null;
    }
}

function updateWatchMetricFromPlayback(aulaId, duration, watchedSeconds, isEnded = false, currentTime = null) {
    const aula = getAulaByIdLocal(aulaId);
    if (!aula) {
        return;
    }

    const previous = getAulaMetric(aula) || {
        watchedSeconds: 0,
        durationSeconds: 0,
        lastPositionSeconds: 0,
        progressPercent: 0,
        completed: false,
        completedAt: null
    };

    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : previous.durationSeconds;
    const mergedSeconds = Math.max(previous.watchedSeconds || 0, watchedSeconds || 0);

    const calculatedPercent = safeDuration > 0
        ? Math.min(100, Math.round((mergedSeconds / safeDuration) * 100))
        : previous.progressPercent || 0;

    const safeCurrentTime = Number.isFinite(currentTime) && currentTime >= 0
        ? currentTime
        : (previous.lastPositionSeconds || 0);

    const boundedCurrentTime = safeDuration > 0
        ? Math.min(safeDuration, safeCurrentTime)
        : safeCurrentTime;

    const completed = Boolean(previous.completed || isEnded);
    const progressPercent = completed ? 100 : Math.min(99, calculatedPercent);

    setAulaMetric(aula, {
        watchedSeconds: mergedSeconds,
        durationSeconds: safeDuration,
        lastPositionSeconds: completed
            ? (safeDuration > 0 ? safeDuration : boundedCurrentTime)
            : boundedCurrentTime,
        progressPercent,
        completed,
        completedAt: completed ? (previous.completedAt || new Date().toISOString()) : null
    });

    const completionTurnedTrue = !previous.completed && completed;
    const shouldRefreshUi = completionTurnedTrue || Date.now() - playerRuntime.lastUiRefreshAt > WATCH_RULES.uiRefreshIntervalMs;

    if (shouldRefreshUi) {
        refreshProgressUiHook();
        playerRuntime.lastUiRefreshAt = Date.now();
    }

    if (completionTurnedTrue) {
        setStatus("Video finalizado com sucesso. Progresso atualizado para 100%.", UI_STATES.success);
    }
}

function handlePlayerTick() {
    if (!playerRuntime.instance || !playerRuntime.activeAulaId) {
        return;
    }

    const player = playerRuntime.instance;

    const duration = Number(player.getDuration()) || 0;
    const currentTime = Number(player.getCurrentTime()) || 0;

    const delta = currentTime - playerRuntime.lastPlayerTime;

    if (delta > 0 && delta < 20) {
        playerRuntime.accumulatedSeconds += delta;
    }

    playerRuntime.lastPlayerTime = currentTime;

    updateWatchMetricFromPlayback(
        playerRuntime.activeAulaId,
        duration,
        playerRuntime.accumulatedSeconds,
        false,
        currentTime
    );
}

function hasReachedVideoEndWindow(duration, currentTime) {
    if (!duration || duration <= 0) {
        return false;
    }

    const endToleranceSeconds = Math.min(3, Math.max(1.2, duration * 0.02));
    return currentTime >= duration - endToleranceSeconds;
}

function getResumePositionSeconds(metric) {
    if (!metric || metric.completed) {
        return 0;
    }

    const rawPosition = Number(metric.lastPositionSeconds ?? metric.watchedSeconds) || 0;
    if (rawPosition < 2) {
        return 0;
    }

    const duration = Number(metric.durationSeconds) || 0;
    if (duration > 0 && rawPosition >= duration - 1.5) {
        return 0;
    }

    return Math.max(0, Math.floor(rawPosition));
}

function loadVideoWithResume(player, videoId, startSeconds = 0) {
    if (!player || typeof player.loadVideoById !== "function") {
        return;
    }

    const safeStart = Math.max(0, Math.floor(Number(startSeconds) || 0));
    player.loadVideoById({
        videoId,
        startSeconds: safeStart
    });
}

export function persistCurrentPlaybackSnapshot() {
    if (!playerRuntime.instance || !playerRuntime.activeAulaId) {
        return;
    }

    try {
        handlePlayerTick();
    } catch (_error) {
        // Ignora falhas de leitura pontuais ao fechar aba/navegador.
    }
}

function ensureYouTubeApi() {
    if (window.YT && window.YT.Player) {
        return Promise.resolve();
    }

    if (playerRuntime.apiPromise) {
        return playerRuntime.apiPromise;
    }

    playerRuntime.apiPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector('script[data-youtube-api="true"]');
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = "https://www.youtube.com/iframe_api";
            script.dataset.youtubeApi = "true";
            script.async = true;
            script.onerror = () => reject(new Error("Nao foi possivel carregar a API do YouTube."));
            document.head.appendChild(script);
        }

        const previousReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (typeof previousReady === "function") {
                previousReady();
            }
            resolve();
        };

        let attempts = 0;
        const pollId = window.setInterval(() => {
            attempts += 1;
            if (window.YT && window.YT.Player) {
                window.clearInterval(pollId);
                resolve();
                return;
            }

            if (attempts > 40) {
                window.clearInterval(pollId);
                reject(new Error("API do YouTube indisponivel no momento."));
            }
        }, 250);
    });

    return playerRuntime.apiPromise;
}

function handlePlayerStateChange(event) {
    const player = playerRuntime.instance;
    if (!player || !playerRuntime.activeAulaId) {
        return;
    }

    if (event.data === window.YT.PlayerState.PLAYING) {
        playerRuntime.lastPlayerTime = Number(player.getCurrentTime()) || 0;

        if (!playerRuntime.accumulatedSeconds) {
            const existingMetric = getAulaMetric(playerRuntime.activeAulaId);
            playerRuntime.accumulatedSeconds = Number(existingMetric?.watchedSeconds) || 0;
        }

        stopPlayerInterval();
        playerRuntime.intervalId = window.setInterval(handlePlayerTick, 1000);
        return;
    }

    if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.BUFFERING) {
        handlePlayerTick();
        stopPlayerInterval();

        if (event.data === window.YT.PlayerState.PAUSED) {
            const duration = Number(player.getDuration()) || 0;
            const currentTime = Number(player.getCurrentTime()) || 0;

            if (hasReachedVideoEndWindow(duration, currentTime)) {
                const watched = Math.max(playerRuntime.accumulatedSeconds, currentTime);
                updateWatchMetricFromPlayback(playerRuntime.activeAulaId, duration, watched, true, currentTime);
            }
        }

        return;
    }

    if (event.data === window.YT.PlayerState.ENDED) {
        handlePlayerTick();
        stopPlayerInterval();

        const duration = Number(player.getDuration()) || 0;
        const currentTime = Number(player.getCurrentTime()) || 0;
        const watched = Math.max(playerRuntime.accumulatedSeconds, currentTime);
        const canComplete = duration > 0 ? hasReachedVideoEndWindow(duration, currentTime) : true;

        updateWatchMetricFromPlayback(playerRuntime.activeAulaId, duration, watched, canComplete, currentTime);

        if (!canComplete) {
            setStatus("Video encerrado, mas ainda faltam trechos para validar 100%.", UI_STATES.info);
        }
    }
}

export async function loadYoutubeAula(aula) {
    const videoId = getYouTubeVideoId(aula.linkYoutube);
    if (!videoId) {
        ui.playerFallback.classList.add("is-visible");
        setStatus("Link da aula nao e um YouTube valido para validacao de conclusao.", UI_STATES.error);
        return;
    }

    try {
        setStatus("Carregando video da aula...", UI_STATES.loading);
        await ensureYouTubeApi();

        stopPlayerInterval();
        clearFirstReadyTimeout();

        const existingMetric = getAulaMetric(aula);
        const resumeSeconds = getResumePositionSeconds(existingMetric);
        const readyMessage = resumeSeconds > 0
            ? "Video retomado de onde voce parou."
            : "Video pronto. A validacao acontece pelo tempo real assistido.";

        playerRuntime.activeAulaId = aula.id;
        playerRuntime.accumulatedSeconds = Number(existingMetric?.watchedSeconds) || 0;
        playerRuntime.lastPlayerTime = 0;
        playerRuntime.pendingVideoId = videoId;
        playerRuntime.pendingStartSeconds = resumeSeconds;

        if (!playerRuntime.instance) {
            playerRuntime.instance = new window.YT.Player("aulaFrame", {
                playerVars: {
                    rel: 0,
                    playsinline: 1
                },
                events: {
                    onReady: (event) => {
                        clearFirstReadyTimeout();
                        if (playerRuntime.pendingVideoId && typeof event.target.loadVideoById === "function") {
                            loadVideoWithResume(
                                event.target,
                                playerRuntime.pendingVideoId,
                                playerRuntime.pendingStartSeconds
                            );
                        }
                        setStatus(readyMessage, UI_STATES.success);
                    },
                    onStateChange: handlePlayerStateChange,
                    onError: () => {
                        clearFirstReadyTimeout();
                        ui.playerFallback.classList.add("is-visible");
                        setStatus("Nao foi possivel reproduzir o video desta aula.", UI_STATES.error);
                    }
                }
            });

            playerRuntime.firstReadyTimeoutId = window.setTimeout(() => {
                if (playerRuntime.activeAulaId !== aula.id || !playerRuntime.instance) {
                    return;
                }

                if (typeof playerRuntime.instance.loadVideoById === "function") {
                    loadVideoWithResume(playerRuntime.instance, videoId, resumeSeconds);
                    setStatus(readyMessage, UI_STATES.success);
                }
            }, 1200);

            return;
        }

        if (typeof playerRuntime.instance.loadVideoById === "function") {
            loadVideoWithResume(playerRuntime.instance, videoId, resumeSeconds);
        }

        setStatus(readyMessage, UI_STATES.success);
    } catch (error) {
        ui.playerFallback.classList.add("is-visible");
        setStatus(error.message, UI_STATES.error);
    }
}
