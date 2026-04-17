import { API_BASE_URL } from "../config/constants.js";
import { state } from "../core/context.js";
import { clearToken } from "./storage.js";

function extractApiErrorMessage(payload, status) {
    if (!payload || typeof payload !== "object") {
        return `Erro ${status}`;
    }

    if (payload.mensagem) {
        return payload.mensagem;
    }

    if (payload.error) {
        return payload.error;
    }

    if (payload.message) {
        return payload.message;
    }

    if (Array.isArray(payload.errors) && payload.errors.length) {
        return payload.errors.join(", ");
    }

    if (payload.errors && typeof payload.errors === "object") {
        return Object.values(payload.errors).join(", ");
    }

    return `Erro ${status}`;
}

export async function api(path, options = {}) {
    const {
        method = "GET",
        body,
        auth = true
    } = options;

    const headers = {
        "Content-Type": "application/json"
    };

    if (auth) {
        if (!state.token) {
            throw new Error("Sessao expirada. Faca login novamente.");
        }
        headers.Authorization = `Bearer ${state.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            clearToken();
        }

        throw new Error(extractApiErrorMessage(payload, response.status));
    }

    return payload;
}
