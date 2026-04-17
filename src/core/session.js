import { playerRuntime, state } from "./context.js";

let stopRealtimeSyncHook = () => {};
let closeSidebarHook = () => {};
let stopPlayerIntervalHook = () => {};
let clearFirstReadyTimeoutHook = () => {};

export function configureSessionHooks({
    stopRealtimeSync,
    closeSidebar,
    stopPlayerInterval,
    clearFirstReadyTimeout
} = {}) {
    if (typeof stopRealtimeSync === "function") {
        stopRealtimeSyncHook = stopRealtimeSync;
    }

    if (typeof closeSidebar === "function") {
        closeSidebarHook = closeSidebar;
    }

    if (typeof stopPlayerInterval === "function") {
        stopPlayerIntervalHook = stopPlayerInterval;
    }

    if (typeof clearFirstReadyTimeout === "function") {
        clearFirstReadyTimeoutHook = clearFirstReadyTimeout;
    }
}

export function resetSessionState() {
    state.user = null;
    state.cursos = [];
    state.modulos = [];
    state.aulas = [];
    state.contentSignature = "";
    state.selectedCursoId = null;
    state.selectedModuloId = null;
    state.selectedAulaId = null;

    stopRealtimeSyncHook();
    closeSidebarHook();

    stopPlayerIntervalHook();
    clearFirstReadyTimeoutHook();

    playerRuntime.pendingVideoId = null;
    playerRuntime.pendingStartSeconds = 0;
    playerRuntime.activeAulaId = null;
    playerRuntime.accumulatedSeconds = 0;
    playerRuntime.lastPlayerTime = 0;
}
