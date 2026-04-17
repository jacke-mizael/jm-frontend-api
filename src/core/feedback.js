import { STATUS_MESSAGE_SUPPRESSION_PATTERNS, UI_STATES } from "../config/constants.js";
import { ui } from "./context.js";

function removeStateClasses(element) {
    element.classList.remove("is-loading", "is-success", "is-error");
}

function setFeedback(element, message, type = UI_STATES.info, withVisibility = false) {
    if (!element) {
        return;
    }

    removeStateClasses(element);
    element.textContent = message || "";

    if (type !== UI_STATES.info) {
        element.classList.add(`is-${type}`);
    }

    if (withVisibility) {
        element.classList.toggle("is-visible", Boolean(message));
    }
}

export function setAuthState(message, type = UI_STATES.info) {
    setFeedback(ui.authState, message, type, true);
}

function shouldSuppressStatusMessage(message) {
    if (!message) {
        return false;
    }

    const normalized = String(message).trim().toLowerCase();
    if (!normalized) {
        return false;
    }

    return STATUS_MESSAGE_SUPPRESSION_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function setStatus(message, type = UI_STATES.info) {
    if (shouldSuppressStatusMessage(message)) {
        return;
    }

    setFeedback(ui.statusLine, message, type);
}

export function setProfileFeedback(message, type = UI_STATES.info) {
    setFeedback(ui.perfilFeedback, message, type);
}

export function setButtonBusy(button, isBusy, busyLabel) {
    if (!button) {
        return;
    }

    if (isBusy) {
        if (!button.dataset.defaultLabel) {
            button.dataset.defaultLabel = button.textContent;
        }

        button.disabled = true;
        button.classList.add("is-busy");
        if (busyLabel) {
            button.textContent = busyLabel;
        }
        return;
    }

    button.disabled = false;
    button.classList.remove("is-busy");

    if (button.dataset.defaultLabel) {
        button.textContent = button.dataset.defaultLabel;
    }
}

export function showScene(name) {
    ui.sceneLogin.classList.toggle("is-visible", name === "login");
    ui.scenePlataforma.classList.toggle("is-visible", name === "plataforma");
}

export function setMenuActive(action) {
    ui.menuItems.forEach((item) => {
        item.classList.toggle("is-active", item.dataset.action === action);
    });
}

export function setSidebarOpen(isOpen) {
    const open = Boolean(isOpen);

    ui.sidebar.classList.toggle("is-open", open);
    ui.sidebarOverlay.classList.toggle("is-visible", open);
    ui.btnMenuToggle.setAttribute("aria-expanded", String(open));
}

export function closeSidebar() {
    setSidebarOpen(false);
}

export function showView(view) {
    ui.viewCursos.classList.toggle("is-visible", view === "cursos");
    ui.viewCertificados.classList.toggle("is-visible", view === "certificados");
    ui.viewPerfil.classList.toggle("is-visible", view === "perfil");
    ui.viewCurso.classList.toggle("is-visible", view === "curso");
    ui.viewAula.classList.toggle("is-visible", view === "aula");
}

export function toggleModuloAulasSection(isVisible) {
    ui.moduloAulasSection.classList.toggle("is-visible", isVisible);
}
