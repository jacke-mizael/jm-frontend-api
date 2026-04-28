import { COURSE_COVER_IMAGE, UI_STATES } from "../config/constants.js";
import { toNumericId, toOrderValue } from "../core/normalizers.js";
import { buildYouTubeThumbUrl } from "../core/youtube.js";
import { state, ui } from "../core/context.js";
import {
    setMenuActive,
    setStatus,
    showView,
    toggleModuloAulasSection
} from "../core/feedback.js";
import {
    getAulaProgressPercent,
    isAulaWatched
} from "../services/storage.js";
import { loadYoutubeAula, persistCurrentPlaybackSnapshot } from "./player.js";

export { toNumericId, toOrderValue };

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function getCursoById(cursoId) {
    const normalizedCursoId = toNumericId(cursoId);
    return state.cursos.find((curso) => toNumericId(curso.id) === normalizedCursoId) || null;
}

export function getModuloById(moduloId) {
    const normalizedModuloId = toNumericId(moduloId);
    return state.modulos.find((modulo) => toNumericId(modulo.id) === normalizedModuloId) || null;
}

export function getAulaById(aulaId) {
    const normalizedAulaId = toNumericId(aulaId);
    return state.aulas.find((aula) => toNumericId(aula.id) === normalizedAulaId) || null;
}

export function getModulosByCurso(cursoId) {
    const normalizedCursoId = toNumericId(cursoId);
    return state.modulos
        .filter((modulo) => toNumericId(modulo.cursoId) === normalizedCursoId)
        .sort((a, b) => toOrderValue(a.ordem) - toOrderValue(b.ordem));
}

export function getAulasByModulo(moduloId) {
    const normalizedModuloId = toNumericId(moduloId);
    return state.aulas
        .filter((aula) => toNumericId(aula.moduloId) === normalizedModuloId)
        .sort((a, b) => toOrderValue(a.ordem) - toOrderValue(b.ordem));
}

export function getAulasByCurso(cursoId) {
    const moduloOrderMap = new Map();
    const moduloIds = new Set();

    getModulosByCurso(cursoId).forEach((modulo) => {
        const normalizedModuloId = toNumericId(modulo.id);
        if (normalizedModuloId === null) {
            return;
        }

        moduloIds.add(normalizedModuloId);
        moduloOrderMap.set(normalizedModuloId, toOrderValue(modulo.ordem));
    });

    return state.aulas
        .filter((aula) => moduloIds.has(toNumericId(aula.moduloId)))
        .sort((a, b) => {
            const moduloA = moduloOrderMap.get(toNumericId(a.moduloId)) ?? Number.MAX_SAFE_INTEGER;
            const moduloB = moduloOrderMap.get(toNumericId(b.moduloId)) ?? Number.MAX_SAFE_INTEGER;

            if (moduloA !== moduloB) {
                return moduloA - moduloB;
            }

            return toOrderValue(a.ordem) - toOrderValue(b.ordem);
        });
}

export function getModuloCompletionState(moduloId) {
    const aulas = getAulasByModulo(moduloId);

    if (!aulas.length) {
        return {
            total: 0,
            watched: 0,
            percent: 0
        };
    }

    const watched = aulas.filter((aula) => isAulaWatched(aula)).length;
    const progressSum = aulas.reduce((acc, aula) => acc + getAulaProgressPercent(aula), 0);
    const percent = Math.round(progressSum / aulas.length);

    return {
        total: aulas.length,
        watched,
        percent
    };
}

export function getCourseCompletionState(cursoId) {
    const aulas = getAulasByCurso(cursoId);

    if (!aulas.length) {
        return {
            total: 0,
            watched: 0,
            percent: 0
        };
    }

    const watched = aulas.filter((aula) => isAulaWatched(aula)).length;
    const progressSum = aulas.reduce((acc, aula) => acc + getAulaProgressPercent(aula), 0);
    const percent = Math.round(progressSum / aulas.length);

    return {
        total: aulas.length,
        watched,
        percent
    };
}

export function getCompletedCourseCount() {
    return state.cursos.filter((curso) => {
        const progress = getCourseCompletionState(curso.id);
        return progress.total > 0 && progress.watched === progress.total;
    }).length;
}

function loadingCards(count = 3) {
    return `
        <div class="loading-stack">
            ${Array.from({ length: count }).map(() => `
                <div class="loading-card">
                    <div class="loading-line w-80"></div>
                    <div class="loading-line"></div>
                    <div class="loading-line w-60"></div>
                </div>
            `).join("")}
        </div>
    `;
}

export function renderCursosLoading() {
    ui.cardsCursos.innerHTML = loadingCards(3);
}

export function renderModulosLoading() {
    ui.listaModulosCurso.innerHTML = loadingCards(2);
}

export function renderAulasLoading() {
    ui.listaAulasCurso.innerHTML = loadingCards(3);
}

export function renderWelcome() {
    const nome = state.user?.nome || "Mentorada";
    ui.welcomeTitle.textContent = `Olá, ${nome}`;
    ui.welcomeText.textContent = "Você está no lugar certo para acelerar sua jornada de aprendizado.";
}

export function renderCursos() {
    if (!state.cursos.length) {
        ui.cardsCursos.innerHTML = '<div class="empty-state">Nenhum curso disponível no momento.</div>';
        return;
    }

    ui.cardsCursos.innerHTML = state.cursos.map((curso) => {
        const progress = getCourseCompletionState(curso.id);
        const modulos = getModulosByCurso(curso.id);
        const aulas = getAulasByCurso(curso.id);

        return `
            <article class="course-card" data-curso-id="${curso.id}">
                <img class="course-cover" src="${COURSE_COVER_IMAGE}" alt="Capa do curso ${escapeHtml(curso.nome)}">
                <div class="course-body">
                    <strong>${escapeHtml(curso.nome)}</strong>
                    <p>${escapeHtml(curso.descricao || "Trilha prática para evolução profissional.")}</p>
                    <p>${modulos.length} módulos - ${aulas.length} aulas</p>
                    <div class="progress-track" aria-label="Progresso visual do curso">
                        <span style="width:${progress.percent}%"></span>
                    </div>
                    <p>${progress.watched}/${progress.total} aulas concluídas (${progress.percent}%)</p>
                </div>
            </article>
        `;
    }).join("");

    Array.from(ui.cardsCursos.querySelectorAll(".course-card")).forEach((card) => {
        card.addEventListener("click", () => {
            const cursoId = toNumericId(card.dataset.cursoId);
            if (cursoId === null) {
                return;
            }

            setStatus("Carregando trilha do curso...", UI_STATES.loading);
            openCurso(cursoId);
        });
    });
}

export function renderModulosCurso() {
    const modulos = getModulosByCurso(state.selectedCursoId);

    if (!modulos.length) {
        ui.listaModulosCurso.innerHTML = '<div class="empty-state">Esse curso ainda não possui módulos.</div>';
        toggleModuloAulasSection(false);
        return;
    }

    ui.listaModulosCurso.innerHTML = modulos.map((modulo) => {
        const progress = getModuloCompletionState(modulo.id);
        const active = toNumericId(modulo.id) === state.selectedModuloId;
        const complete = progress.total > 0 && progress.watched === progress.total;
        const moduloNome = modulo.titulo || "Módulo sem título";

        return `
            <button type="button" class="module-row ${active ? "is-active" : ""}" data-modulo-id="${modulo.id}">
                <div class="module-copy">
                    <strong>Módulo ${modulo.ordem ?? "-"}: ${escapeHtml(moduloNome)}</strong>
                    <small>${progress.watched}/${progress.total} aulas concluídas</small>
                    <div class="module-progress"><span style="width:${progress.percent}%"></span></div>
                </div>
                <span class="module-status ${complete ? "is-complete" : ""}">${progress.percent}%</span>
            </button>
        `;
    }).join("");

    Array.from(ui.listaModulosCurso.querySelectorAll(".module-row")).forEach((row) => {
        row.addEventListener("click", () => {
            const moduloId = toNumericId(row.dataset.moduloId);
            if (moduloId === null) {
                return;
            }

            if (moduloId === state.selectedModuloId) {
                return;
            }

            state.selectedModuloId = moduloId;
            state.selectedAulaId = null;

            setStatus("Carregando aulas do módulo...", UI_STATES.loading);
            toggleModuloAulasSection(true);
            renderAulasLoading();

            requestAnimationFrame(() => {
                renderModulosCurso();
                renderAulasModulo();
                setStatus("Módulo carregado. Escolha uma aula para iniciar.", UI_STATES.success);
            });
        });
    });
}

export function renderAulasModulo() {
    const modulo = getModuloById(state.selectedModuloId);

    if (!modulo) {
        toggleModuloAulasSection(false);
        ui.moduloSelecionadoResumo.textContent = "Selecione um módulo para visualizar as aulas.";
        ui.listaAulasCurso.innerHTML = '<div class="empty-state">Selecione um módulo.</div>';
        return;
    }

    toggleModuloAulasSection(true);

    const aulas = getAulasByModulo(modulo.id);
    const moduloNome = modulo.titulo || aulas[0]?.moduloTitulo || "Módulo sem título";
    ui.moduloSelecionadoResumo.textContent = `Módulo selecionado: ${moduloNome}`;

    if (!aulas.length) {
        ui.listaAulasCurso.innerHTML = '<div class="empty-state">Esse módulo ainda não possui aulas publicadas.</div>';
        return;
    }

    ui.listaAulasCurso.innerHTML = aulas.map((aula, idx) => {
        const watched = isAulaWatched(aula);
        const progress = getAulaProgressPercent(aula);
        const active = state.selectedAulaId === toNumericId(aula.id);
        const thumb = buildYouTubeThumbUrl(aula.linkYoutube, COURSE_COVER_IMAGE);
        const progressLabel = watched
            ? "Vídeo finalizado com sucesso"
            : progress > 0
                ? `Assistido ${progress}%`
                : "Não iniciada";

        return `
            <button type="button" class="lesson-row ${active ? "is-current" : ""} ${watched ? "is-watched" : ""}" data-aula-id="${aula.id}">
                <div class="lesson-thumb-wrap">
                    <img class="lesson-thumb" src="${thumb}" alt="Thumbnail da aula ${escapeHtml(aula.titulo || String(idx + 1))}">
                    <span class="lesson-check ${watched ? "is-watched" : ""}">${watched ? "&#10003;" : ""}</span>
                </div>
                <div class="lesson-copy">
                    <strong>Aula ${idx + 1} - ${escapeHtml(aula.titulo || "Sem título")}</strong>
                    <small>${escapeHtml(aula.descricao || "Sem descrição")}</small>
                    <span class="lesson-progress-label">${progressLabel}</span>
                    <span class="lesson-line"><span class="lesson-line-fill" style="width:${progress}%"></span></span>
                </div>
            </button>
        `;
    }).join("");

    Array.from(ui.listaAulasCurso.querySelectorAll(".lesson-row")).forEach((row) => {
        row.addEventListener("click", () => {
            const aulaId = toNumericId(row.dataset.aulaId);
            if (aulaId === null) {
                return;
            }

            openAula(aulaId);
        });
    });
}

export function renderCertificados() {
    if (!state.cursos.length) {
        ui.certificadosGrid.innerHTML = '<div class="empty-state">Nenhum curso cadastrado para gerar certificados.</div>';
        return;
    }

    ui.certificadosGrid.innerHTML = state.cursos.map((curso) => {
        const progress = getCourseCompletionState(curso.id);
        const isReleased = progress.total > 0 && progress.watched === progress.total;

        return `
            <article class="cert-card">
                <h4>${escapeHtml(curso.nome)}</h4>
                <p>${progress.watched}/${progress.total} aulas concluídas (${progress.percent}%)</p>
                <span class="cert-status ${isReleased ? "done" : "pending"}">${isReleased ? "Liberado" : "Em andamento"}</span>
                <button type="button" class="cert-action" data-cert-curso-id="${curso.id}" ${isReleased ? "" : "disabled"}>Baixar certificado</button>
            </article>
        `;
    }).join("");

    Array.from(ui.certificadosGrid.querySelectorAll(".cert-action")).forEach((button) => {
        button.addEventListener("click", () => {
            const cursoId = toNumericId(button.dataset.certCursoId);
            const curso = getCursoById(cursoId);
            setStatus(`Certificado de ${curso?.nome || "curso"} disponível para emissão.`, UI_STATES.success);
        });
    });
}

export function renderPerfilResumo() {
    const watchedAulas = state.aulas.filter((aula) => isAulaWatched(aula)).length;
    const totalAulas = state.aulas.length;
    const certificadosLiberados = getCompletedCourseCount();

    ui.perfilNome.textContent = state.user?.nome || "-";
    ui.perfilEmail.textContent = state.user?.email || "-";
    ui.perfilRole.textContent = state.user?.role || "-";

    ui.kpiCursos.textContent = String(state.cursos.length);
    ui.kpiAulasConcluidas.textContent = String(watchedAulas);
    ui.kpiAulasTotal.textContent = String(totalAulas);
    ui.kpiCertificados.textContent = String(certificadosLiberados);
}

function ensureRoleOption(role) {
    const normalizedRole = (role || "").trim().toUpperCase();
    if (!normalizedRole) {
        return;
    }

    const alreadyExists = Array.from(ui.usuarioRole.options)
        .some((option) => option.value === normalizedRole);

    if (alreadyExists) {
        return;
    }

    const option = document.createElement("option");
    option.value = normalizedRole;
    option.textContent = normalizedRole;
    ui.usuarioRole.appendChild(option);
}

function applyRolePolicy() {
    const role = (state.user?.role || "").toUpperCase();

    if (role === "ALUNO") {
        ui.usuarioRole.value = "ALUNO";
        ui.usuarioRole.disabled = true;
        ui.roleLockHint.textContent = "Seu perfil é ALUNO. Este campo é bloqueado e apenas um ADMIN pode alterar esse tipo de permissão.";
        return;
    }

    ui.usuarioRole.disabled = false;
    ui.roleLockHint.textContent = "";
}

export function syncProfileFormFromSession() {
    ensureRoleOption(state.user?.role);
    ui.usuarioNome.value = state.user?.nome || "";
    ui.usuarioEmail.value = state.user?.email || "";
    ui.usuarioRole.value = (state.user?.role || "").toUpperCase();
    ui.usuarioTelefone.value = "";
    ui.usuarioSenha.value = "";

    applyRolePolicy();
}

export function buildProfilePayload() {
    const nome = ui.usuarioNome.value.trim();
    const telefone = ui.usuarioTelefone.value.trim();
    const email = ui.usuarioEmail.value.trim();
    const senha = ui.usuarioSenha.value.trim();

    if (!nome || !telefone || !email || !senha) {
        throw new Error("Preencha nome, telefone, e-mail e senha.");
    }

    const role = ui.usuarioRole.disabled
        ? (state.user?.role || "").toUpperCase()
        : ui.usuarioRole.value.trim().toUpperCase();

    if (!role) {
        throw new Error("O perfil do usuário é obrigatório.");
    }

    return {
        nome,
        telefone,
        email,
        role,
        senha
    };
}

export function getCurrentModuloAulas() {
    if (state.selectedModuloId === null) {
        return [];
    }

    return getAulasByModulo(state.selectedModuloId);
}

export function updateAulaNavigation() {
    const aulas = getCurrentModuloAulas();
    const index = aulas.findIndex((aula) => toNumericId(aula.id) === state.selectedAulaId);

    if (index < 0) {
        ui.aulaPosicao.textContent = "Aula 0 de 0";
        ui.btnAulaAnterior.disabled = true;
        ui.btnAulaProxima.disabled = true;
        return;
    }

    ui.aulaPosicao.textContent = `Aula ${index + 1} de ${aulas.length}`;
    ui.btnAulaAnterior.disabled = index === 0;
    ui.btnAulaProxima.disabled = index === aulas.length - 1;
}

export function openAdjacentLesson(direction) {
    const aulas = getCurrentModuloAulas();
    const index = aulas.findIndex((aula) => toNumericId(aula.id) === state.selectedAulaId);

    if (index < 0) {
        return;
    }

    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= aulas.length) {
        return;
    }

    openAula(aulas[nextIndex].id);
}

export function openCurso(cursoId) {
    persistCurrentPlaybackSnapshot();

    state.selectedCursoId = toNumericId(cursoId);
    state.selectedModuloId = null;
    state.selectedAulaId = null;

    const curso = getCursoById(state.selectedCursoId);
    ui.cursoTitulo.textContent = curso?.nome || "Curso";
    ui.cursoDescricao.textContent = curso?.descricao || "Escolha um módulo para exibir as aulas.";

    toggleModuloAulasSection(false);
    ui.moduloSelecionadoResumo.textContent = "Selecione um módulo para visualizar as aulas.";
    ui.listaAulasCurso.innerHTML = '<div class="empty-state">As aulas aparecem aqui após selecionar um módulo.</div>';

    renderModulosCurso();
    updateAulaNavigation();

    setMenuActive("cursos");
    showView("curso");
    setStatus("Curso aberto. Selecione um módulo para continuar.", UI_STATES.success);
}

export function openAula(aulaId) {
    persistCurrentPlaybackSnapshot();

    const aula = getAulaById(aulaId);
    const modulo = getModuloById(aula?.moduloId);

    if (!aula) {
        setStatus("Aula não encontrada no catálogo.", UI_STATES.error);
        return;
    }

    state.selectedModuloId = toNumericId(aula.moduloId);
    if (modulo && (state.selectedCursoId === null || toNumericId(modulo.cursoId) !== state.selectedCursoId)) {
        state.selectedCursoId = toNumericId(modulo.cursoId);
    }

    const curso = getCursoById(state.selectedCursoId);
    state.selectedAulaId = toNumericId(aulaId);
    const moduloNome = modulo?.titulo || aula.moduloTitulo || "Módulo";

    ui.aulaHeading.textContent = `${curso?.nome || "Curso"} > ${moduloNome} > ${aula.titulo || "Aula"}`;
    ui.aulaSubheading.textContent = aula.descricao || "Continue sua evolução com esta aula.";

    ui.playerFallback.classList.remove("is-visible");

    renderAulasModulo();
    updateAulaNavigation();
    showView("aula");

    loadYoutubeAula(aula);
}

export function refreshUiFromProgress() {
    renderCursos();
    renderModulosCurso();
    renderAulasModulo();
    renderCertificados();
    renderPerfilResumo();
}
