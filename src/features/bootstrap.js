import { AUTH_MODES, AUTH_STEPS, CADASTRO_STEPS, UI_STATES } from "../config/constants.js";
import { state, ui } from "../core/context.js";
import { closeSidebar, setAuthState, setMenuActive, setSidebarOpen, setStatus, showScene, showView } from "../core/feedback.js";
import { configureSessionHooks, resetSessionState } from "../core/session.js";
import { clearToken, initializeStorageState } from "../services/storage.js";
import {
    bindImageFallback,
    clearProfileFormFields,
    isValidEmail,
    login,
    logout,
    registerUser,
    savePerfil,
    setAuthMode,
    showAuthStep,
    showCadastroStep,
} from "./auth.js";
import {
    openAdjacentLesson,
    openCurso,
    renderAulasModulo,
    renderCertificados,
    renderCursos,
    renderModulosCurso,
    renderPerfilResumo,
    syncProfileFormFromSession
} from "./catalog.js";
import {
    clearFirstReadyTimeout,
    persistCurrentPlaybackSnapshot,
    setPlayerRefreshHook,
    stopPlayerInterval
} from "./player.js";
import { loadPlatformData, stopRealtimeSync } from "./realtime.js";

function bindEvents() {
    bindImageFallback();

    ui.btnModoLogin.addEventListener("click", () => {
        setAuthMode(AUTH_MODES.login, { resetStep: true });
    });

    ui.btnModoCadastro.addEventListener("click", () => {
        setAuthMode(AUTH_MODES.cadastro, { resetStep: true });
    });

    ui.btnIrCadastro.addEventListener("click", () => {
        setAuthMode(AUTH_MODES.cadastro, { resetStep: true });
    });

    ui.btnIrLogin.addEventListener("click", () => {
        setAuthMode(AUTH_MODES.login, { resetStep: true });
    });

    ui.formEmail.addEventListener("submit", (event) => {
        event.preventDefault();

        const email = ui.inputEmail.value.trim();
        if (!isValidEmail(email)) {
            setAuthState("Digite um e-mail válido.", UI_STATES.error);
            return;
        }

        state.pendingEmail = email;
        setAuthState("E-mail confirmado.", UI_STATES.success);
        showAuthStep(AUTH_STEPS.senha);
    });

    ui.formSenha.addEventListener("submit", (event) => {
        event.preventDefault();
        login();
    });

    ui.btnVoltarEmail.addEventListener("click", () => {
        showAuthStep(AUTH_STEPS.email);
    });

    ui.formCadastroEmail.addEventListener("submit", (event) => {
        event.preventDefault();

        const email = ui.cadastroEmail.value.trim();
        if (!isValidEmail(email)) {
            setAuthState("Digite um e-mail válido para cadastro.", UI_STATES.error);
            return;
        }

        state.pendingCadastroEmail = email;
        setAuthState("E-mail confirmado para cadastro.", UI_STATES.success);
        showCadastroStep(CADASTRO_STEPS.senha);
    });

    ui.formCadastroSenha.addEventListener("submit", (event) => {
        event.preventDefault();
        registerUser();
    });

    ui.btnVoltarCadastroEmail.addEventListener("click", () => {
        showCadastroStep(CADASTRO_STEPS.email);
    });

    ui.btnMenuToggle.addEventListener("click", () => {
        setSidebarOpen(!ui.sidebar.classList.contains("is-open"));
    });

    ui.sidebarOverlay.addEventListener("click", () => {
        closeSidebar();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            persistCurrentPlaybackSnapshot();
        }
    });

    window.addEventListener("beforeunload", () => {
        persistCurrentPlaybackSnapshot();
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 960) {
            closeSidebar();
        }
    });

    const menuActions = {
        cursos: () => {
            setMenuActive("cursos");
            showView("cursos");
            setStatus("Catálogo principal aberto.", UI_STATES.success);
        },
        certificados: () => {
            setMenuActive("certificados");
            renderCertificados();
            showView("certificados");
            setStatus("Área de certificados aberta.", UI_STATES.success);
        },
        perfil: () => {
            setMenuActive("perfil");
            renderPerfilResumo();
            syncProfileFormFromSession();
            showView("perfil");
            setStatus("Área de perfil aberta.", UI_STATES.success);
        }
    };

    ui.menuItems.forEach((item) => {
        item.addEventListener("click", () => {
            const action = item.dataset.action;
            const handler = menuActions[action];

            if (typeof handler === "function") {
                handler();
            }

            closeSidebar();
        });
    });

    ui.logoutButton.addEventListener("click", () => {
        logout();
    });

    ui.btnVoltarCursos.addEventListener("click", () => {
        showView("cursos");
        setStatus("Escolha outro curso para continuar.", UI_STATES.info);
    });

    ui.btnVoltarCurso.addEventListener("click", () => {
        if (state.selectedCursoId !== null) {
            openCurso(state.selectedCursoId);
        } else {
            showView("cursos");
        }
    });

    ui.btnAulaAnterior.addEventListener("click", () => {
        openAdjacentLesson(-1);
    });

    ui.btnAulaProxima.addEventListener("click", () => {
        openAdjacentLesson(1);
    });

    ui.usuarioForm.addEventListener("submit", savePerfil);

    ui.btnRecarregarPerfil.addEventListener("click", () => {
        syncProfileFormFromSession();
    });

    ui.btnLimparUsuario.addEventListener("click", () => {
        clearProfileFormFields();
    });
}

export async function bootstrapApp() {
    initializeStorageState();

    setPlayerRefreshHook(() => {
        renderCursos();
        renderModulosCurso();
        renderAulasModulo();
        renderCertificados();
        renderPerfilResumo();
    });

    configureSessionHooks({
        stopRealtimeSync,
        closeSidebar,
        stopPlayerInterval,
        clearFirstReadyTimeout
    });

    bindEvents();

    if (!state.token) {
        showScene("login");
        setAuthMode(AUTH_MODES.login, { resetStep: true });
        return;
    }

    try {
        showScene("plataforma");
        await loadPlatformData();
    } catch (error) {
        clearToken();
        resetSessionState();
        showScene("login");
        setAuthMode(AUTH_MODES.login, { resetStep: true });
        setStatus(`Sessão expirada: ${error.message}`, UI_STATES.error);
    }
}
