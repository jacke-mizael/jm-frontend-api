import { AUTH_MODES, AUTH_STEPS, CADASTRO_STEPS, UI_STATES } from "../config/constants.js";
import { playerRuntime, state, ui } from "../core/context.js";
import {
    setAuthState,
    setButtonBusy,
    setProfileFeedback,
    showScene
} from "../core/feedback.js";
import { resetSessionState } from "../core/session.js";
import { api } from "../services/api.js";
import { clearToken, saveToken } from "../services/storage.js";
import {
    buildProfilePayload,
    renderPerfilResumo,
    renderWelcome,
    syncProfileFormFromSession
} from "./catalog.js";
import { persistCurrentPlaybackSnapshot } from "./player.js";
import { loadPlatformData } from "./realtime.js";

export function isValidEmail(email) {
    return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

export function setAuthMode(mode, options = {}) {
    const { resetStep = true } = options;
    const isLogin = mode === AUTH_MODES.login;

    state.authMode = isLogin ? AUTH_MODES.login : AUTH_MODES.cadastro;

    ui.btnModoLogin.classList.toggle("is-active", isLogin);
    ui.btnModoLogin.setAttribute("aria-selected", String(isLogin));
    ui.btnModoCadastro.classList.toggle("is-active", !isLogin);
    ui.btnModoCadastro.setAttribute("aria-selected", String(!isLogin));

    ui.authFlowLogin.classList.toggle("is-visible", isLogin);
    ui.authFlowLogin.setAttribute("aria-hidden", String(!isLogin));
    ui.authFlowCadastro.classList.toggle("is-visible", !isLogin);
    ui.authFlowCadastro.setAttribute("aria-hidden", String(isLogin));

    if (isLogin) {
        if (resetStep) {
            showAuthStep(AUTH_STEPS.email);
            setAuthState("Informe seu e-mail para continuar.", UI_STATES.info);
        }
        return;
    }

    if (resetStep) {
        showCadastroStep(CADASTRO_STEPS.email);
        setAuthState("Crie sua conta para entrar na plataforma.", UI_STATES.info);
    }
}

export function showAuthStep(step) {
    ui.formEmail.classList.toggle("is-visible", step === AUTH_STEPS.email);
    ui.formSenha.classList.toggle("is-visible", step === AUTH_STEPS.senha);

    if (step === AUTH_STEPS.senha) {
        ui.senhaEmailHint.textContent = `Entrando com: ${state.pendingEmail || "-"}`;
        ui.inputSenha.focus();
    } else {
        ui.inputEmail.focus();
    }
}

export function showCadastroStep(step) {
    ui.formCadastroEmail.classList.toggle("is-visible", step === CADASTRO_STEPS.email);
    ui.formCadastroSenha.classList.toggle("is-visible", step === CADASTRO_STEPS.senha);

    if (step === CADASTRO_STEPS.senha) {
        ui.cadastroEmailHint.textContent = `Cadastro para: ${state.pendingCadastroEmail || "-"}`;
        ui.cadastroNome.focus();
        return;
    }

    ui.cadastroEmail.focus();
}

export function resetCadastroForm() {
    state.pendingCadastroEmail = "";
    ui.cadastroEmail.value = "";
    ui.cadastroNome.value = "";
    ui.cadastroTelefone.value = "";
    ui.cadastroSenha.value = "";
    ui.cadastroSenhaConfirmacao.value = "";
    showCadastroStep(CADASTRO_STEPS.email);
}

export async function login() {
    if (!isValidEmail(state.pendingEmail)) {
        setAuthState("Informe seu e-mail antes de entrar.", UI_STATES.error);
        showAuthStep(AUTH_STEPS.email);
        return;
    }

    const senha = ui.inputSenha.value.trim();

    if (!senha) {
        setAuthState("Informe sua senha.", UI_STATES.error);
        return;
    }

    setButtonBusy(ui.btnEntrar, true, "Entrando...");

    try {
        setAuthState("Validando credenciais...", UI_STATES.loading);

        const payload = await api("/auth/login", {
            method: "POST",
            auth: false,
            body: {
                email: state.pendingEmail,
                senha
            }
        });

        if (!payload.token) {
            throw new Error("Token JWT nao retornado pelo backend.");
        }

        saveToken(payload.token);
        ui.inputSenha.value = "";

        setAuthState("Acesso liberado!", UI_STATES.success);

        showScene("plataforma");
        await loadPlatformData();
    } catch (error) {
        setAuthState(error.message, UI_STATES.error);
        showScene("login");
        setAuthMode(AUTH_MODES.login, { resetStep: false });
        showAuthStep(AUTH_STEPS.senha);
    } finally {
        setButtonBusy(ui.btnEntrar, false);
    }
}

export async function registerUser() {
    const nome = ui.cadastroNome.value.trim();
    const telefone = ui.cadastroTelefone.value.trim();
    const senha = ui.cadastroSenha.value.trim();
    const senhaConfirmacao = ui.cadastroSenhaConfirmacao.value.trim();

    if (!isValidEmail(state.pendingCadastroEmail)) {
        setAuthState("Informe um e-mail valido para cadastro.", UI_STATES.error);
        showCadastroStep(CADASTRO_STEPS.email);
        return;
    }

    if (!nome || !telefone || !senha || !senhaConfirmacao) {
        setAuthState("Preencha nome, telefone, senha e confirmacao de senha.", UI_STATES.error);
        return;
    }

    if (senha.length < 6) {
        setAuthState("A senha deve ter ao menos 6 caracteres.", UI_STATES.error);
        return;
    }

    if (senha !== senhaConfirmacao) {
        setAuthState("A confirmacao de senha precisa ser igual a senha.", UI_STATES.error);
        return;
    }

    setButtonBusy(ui.btnCriarConta, true, "Criando conta...");

    try {
        setAuthState("Criando sua conta...", UI_STATES.loading);

        await api("/usuarios", {
            method: "POST",
            auth: false,
            body: {
                nome,
                telefone,
                email: state.pendingCadastroEmail,
                senha,
                role: "ALUNO"
            }
        });

        state.pendingEmail = state.pendingCadastroEmail;
        ui.inputEmail.value = state.pendingEmail;
        ui.inputSenha.value = "";

        resetCadastroForm();
        setAuthMode(AUTH_MODES.login, { resetStep: false });
        showAuthStep(AUTH_STEPS.senha);
        setAuthState("Cadastro concluido. Agora informe sua senha para entrar.", UI_STATES.success);
    } catch (error) {
        setAuthState(error.message, UI_STATES.error);
    } finally {
        setButtonBusy(ui.btnCriarConta, false);
    }
}

export async function logout() {
    persistCurrentPlaybackSnapshot();

    try {
        if (state.token) {
            await api("/auth/logout", { method: "POST" });
        }
    } catch (_error) {
        // Mesmo que o backend recuse, a sessao local deve ser encerrada no frontend.
    }

    clearToken();
    resetSessionState();

    if (playerRuntime.instance && typeof playerRuntime.instance.stopVideo === "function") {
        playerRuntime.instance.stopVideo();
    }

    showScene("login");
    resetCadastroForm();
    setAuthMode(AUTH_MODES.login, { resetStep: true });
    setAuthState("Sessao encerrada.", UI_STATES.success);
}

export function bindImageFallback() {
    if (!ui.loginPrototypeImage || !ui.loginImageFallback) {
        return;
    }

    ui.loginPrototypeImage.addEventListener("load", () => {
        ui.loginPrototypeImage.style.display = "block";
        ui.loginImageFallback.classList.remove("is-visible");
    });

    ui.loginPrototypeImage.addEventListener("error", () => {
        ui.loginPrototypeImage.style.display = "none";
        ui.loginImageFallback.classList.add("is-visible");
    });
}

export async function savePerfil(event) {
    event.preventDefault();

    let payload;
    try {
        payload = buildProfilePayload();
    } catch (error) {
        setProfileFeedback(error.message, UI_STATES.error);
        return;
    }

    const userId = state.user?.usuarioId;
    if (!userId) {
        setProfileFeedback("Sessao invalida para atualizar o perfil.", UI_STATES.error);
        return;
    }

    setButtonBusy(ui.btnSalvarUsuario, true, "Salvando...");

    try {
        setProfileFeedback("Atualizando seu perfil...", UI_STATES.loading);

        const response = await api(`/usuarios/${userId}`, {
            method: "PUT",
            body: payload
        });

        state.user = {
            ...state.user,
            nome: response.nome,
            email: response.email,
            role: response.role
        };

        renderWelcome();
        renderPerfilResumo();
        syncProfileFormFromSession();

        setProfileFeedback("Perfil atualizado com sucesso.", UI_STATES.success);
    } catch (error) {
        setProfileFeedback(error.message, UI_STATES.error);
    } finally {
        setButtonBusy(ui.btnSalvarUsuario, false);
    }
}

export function clearProfileFormFields() {
    ui.usuarioTelefone.value = "";
    ui.usuarioSenha.value = "";
    setProfileFeedback("Campos de telefone e senha limpos.", UI_STATES.info);
}
