import { REALTIME_SYNC_INTERVAL_MS, UI_STATES } from "../config/constants.js";
import { state, ui } from "../core/context.js";
import { toNumericId, toOrderValue } from "../core/normalizers.js";
import {
    setMenuActive,
    setStatus,
    showView,
    toggleModuloAulasSection
} from "../core/feedback.js";
import { api } from "../services/api.js";
import { sanitizeWatchMetrics } from "../services/storage.js";
import {
    getAulaById,
    getCursoById,
    getModuloById,
    renderAulasModulo,
    renderCertificados,
    renderCursos,
    renderCursosLoading,
    renderModulosCurso,
    renderPerfilResumo,
    renderWelcome,
    syncProfileFormFromSession,
    updateAulaNavigation
} from "./catalog.js";

export function buildContentSignature(cursos, modulos, aulas) {
    const cursosSignature = [...cursos]
        .sort((a, b) => toOrderValue(a.id) - toOrderValue(b.id))
        .map((curso) => [curso.id, curso.nome, curso.descricao].join("|"))
        .join(";");

    const modulosSignature = [...modulos]
        .sort((a, b) => {
            const byCurso = toOrderValue(a.cursoId) - toOrderValue(b.cursoId);
            if (byCurso !== 0) {
                return byCurso;
            }

            const byOrdem = toOrderValue(a.ordem) - toOrderValue(b.ordem);
            if (byOrdem !== 0) {
                return byOrdem;
            }

            return toOrderValue(a.id) - toOrderValue(b.id);
        })
        .map((modulo) => [modulo.id, modulo.cursoId, modulo.ordem, modulo.titulo, modulo.descricao].join("|"))
        .join(";");

    const aulasSignature = [...aulas]
        .sort((a, b) => {
            const byModulo = toOrderValue(a.moduloId) - toOrderValue(b.moduloId);
            if (byModulo !== 0) {
                return byModulo;
            }

            const byOrdem = toOrderValue(a.ordem) - toOrderValue(b.ordem);
            if (byOrdem !== 0) {
                return byOrdem;
            }

            return toOrderValue(a.id) - toOrderValue(b.id);
        })
        .map((aula) => [aula.id, aula.moduloId, aula.ordem, aula.titulo, aula.linkYoutube].join("|"))
        .join(";");

    return `${cursosSignature}||${modulosSignature}||${aulasSignature}`;
}

function reconcileSelectedContent() {
    if (state.selectedCursoId !== null && !getCursoById(state.selectedCursoId)) {
        state.selectedCursoId = null;
        state.selectedModuloId = null;
        state.selectedAulaId = null;
    }

    if (state.selectedModuloId !== null) {
        const modulo = getModuloById(state.selectedModuloId);

        if (!modulo) {
            state.selectedModuloId = null;
            state.selectedAulaId = null;
        } else {
            const moduloCursoId = toNumericId(modulo.cursoId);

            if (state.selectedCursoId === null) {
                state.selectedCursoId = moduloCursoId;
            }

            if (state.selectedCursoId !== null && moduloCursoId !== state.selectedCursoId) {
                state.selectedModuloId = null;
                state.selectedAulaId = null;
            }
        }
    }

    if (state.selectedAulaId !== null) {
        const aula = getAulaById(state.selectedAulaId);

        if (!aula) {
            state.selectedAulaId = null;
        } else {
            const aulaModuloId = toNumericId(aula.moduloId);

            if (state.selectedModuloId === null) {
                state.selectedModuloId = aulaModuloId;
            }

            if (state.selectedModuloId !== null && aulaModuloId !== state.selectedModuloId) {
                state.selectedAulaId = null;
            }
        }
    }
}

export function applyCatalogData(cursos, modulos, aulas) {
    state.cursos = Array.isArray(cursos) ? cursos : [];
    state.modulos = Array.isArray(modulos) ? modulos : [];
    state.aulas = Array.isArray(aulas) ? aulas : [];
    state.contentSignature = buildContentSignature(state.cursos, state.modulos, state.aulas);

    sanitizeWatchMetrics();
    reconcileSelectedContent();
}

function refreshViewsAfterCatalogSync() {
    renderCursos();
    renderCertificados();
    renderPerfilResumo();

    if (state.selectedCursoId !== null) {
        const curso = getCursoById(state.selectedCursoId);

        if (curso) {
            ui.cursoTitulo.textContent = curso.nome || "Curso";
            ui.cursoDescricao.textContent = curso.descricao || "Escolha um módulo para exibir as aulas.";
            renderModulosCurso();
        }
    }

    if (state.selectedModuloId !== null) {
        renderAulasModulo();
    } else {
        toggleModuloAulasSection(false);
        ui.moduloSelecionadoResumo.textContent = "Selecione um módulo para visualizar as aulas.";
        ui.listaAulasCurso.innerHTML = '<div class="empty-state">As aulas aparecem aqui após selecionar um módulo.</div>';
    }

    if (state.selectedAulaId !== null) {
        const aula = getAulaById(state.selectedAulaId);
        const curso = getCursoById(state.selectedCursoId);
        const modulo = getModuloById(aula?.moduloId);

        if (!aula) {
            if (ui.viewAula.classList.contains("is-visible")) {
                showView(state.selectedCursoId ? "curso" : "cursos");
            }
        } else {
            const moduloNome = modulo?.titulo || aula.moduloTitulo || "Módulo";
            ui.aulaHeading.textContent = `${curso?.nome || "Curso"} > ${moduloNome} > ${aula.titulo || "Aula"}`;
            ui.aulaSubheading.textContent = aula.descricao || "Continue sua evolução com esta aula.";
        }
    }

    if (state.selectedCursoId === null && (ui.viewCurso.classList.contains("is-visible") || ui.viewAula.classList.contains("is-visible"))) {
        showView("cursos");
        setMenuActive("cursos");
    }

    updateAulaNavigation();
}

export async function syncCatalogRealtime(silent = true) {
    if (!state.token) {
        return;
    }

    try {
        const [cursos, modulos, aulas] = await Promise.all([
            api("/cursos"),
            api("/modulos"),
            api("/aulas")
        ]);

        const safeCursos = Array.isArray(cursos) ? cursos : [];
        const safeModulos = Array.isArray(modulos) ? modulos : [];
        const safeAulas = Array.isArray(aulas) ? aulas : [];
        const nextSignature = buildContentSignature(safeCursos, safeModulos, safeAulas);

        if (nextSignature === state.contentSignature) {
            return;
        }

        applyCatalogData(safeCursos, safeModulos, safeAulas);
        refreshViewsAfterCatalogSync();
        setStatus("Cursos, módulos e aulas atualizados em tempo real.", UI_STATES.success);
    } catch (error) {
        if (!silent) {
            setStatus(error.message, UI_STATES.error);
        }
    }
}

export function startRealtimeSync() {
    stopRealtimeSync();

    if (!state.token) {
        return;
    }

    state.realtimeTimerId = window.setInterval(() => {
        syncCatalogRealtime(true);
    }, REALTIME_SYNC_INTERVAL_MS);
}

export function stopRealtimeSync() {
    if (state.realtimeTimerId) {
        window.clearInterval(state.realtimeTimerId);
        state.realtimeTimerId = null;
    }
}

export async function loadPlatformData() {
    stopRealtimeSync();
    setStatus("Carregando cursos, módulos e aulas...", UI_STATES.loading);
    renderCursosLoading();

    const [user, cursos, modulos, aulas] = await Promise.all([
        api("/auth/me"),
        api("/cursos"),
        api("/modulos"),
        api("/aulas")
    ]);

    state.user = user;
    applyCatalogData(cursos, modulos, aulas);

    renderWelcome();
    renderCursos();
    renderCertificados();
    renderPerfilResumo();
    syncProfileFormFromSession();

    toggleModuloAulasSection(false);
    updateAulaNavigation();

    setMenuActive("cursos");
    showView("cursos");
    setStatus(`Catálogo carregado com ${state.cursos.length} cursos.`, UI_STATES.success);

    startRealtimeSync();
}
