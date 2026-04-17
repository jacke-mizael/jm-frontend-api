const STORAGE_KEYS = {
    token: "jm.jwt",
    apiBaseUrl: "jm.apiBaseUrl"
};

const API_BASE_URL = (window.API_BASE_URL || localStorage.getItem(STORAGE_KEYS.apiBaseUrl) || "http://localhost:8081").replace(/\/$/, "");

const statusBox = document.getElementById("status");
const inputEmail = document.getElementById("email");
const inputSenha = document.getElementById("senha");
const btnLogin = document.getElementById("btnLogin");
const btnMe = document.getElementById("btnMe");
const btnLogout = document.getElementById("btnLogout");

function setStatus(texto, isError = false) {
    statusBox.textContent = texto;
    statusBox.style.background = isError ? "#fef0f0" : "#f6f7f8";
}

function getToken() {
    return localStorage.getItem(STORAGE_KEYS.token);
}

function saveToken(token) {
    if (!token) {
        return;
    }
    localStorage.setItem(STORAGE_KEYS.token, token);
}

function clearToken() {
    localStorage.removeItem(STORAGE_KEYS.token);
}

async function callApi(path, method, body, withAuth = true) {
    const headers = {
        "Content-Type": "application/json"
    };

    if (withAuth) {
        const token = getToken();
        if (!token) {
            throw new Error("Faça login para continuar");
        }
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(payload.mensagem || "Erro na requisição");
    }

    return payload;
}

btnLogin.addEventListener("click", async () => {
    const email = inputEmail.value.trim();
    const senha = inputSenha.value;

    try {
        const data = await callApi("/auth/login", "POST", { email, senha }, false);
        saveToken(data.token);
        setStatus(`Login OK\nUsuário: ${data.nome} (${data.email})\nPerfil: ${data.role}\nJWT salvo no navegador.`);
    } catch (err) {
        setStatus(err.message, true);
    }
});

btnMe.addEventListener("click", async () => {
    try {
        const data = await callApi("/auth/me", "GET");
        setStatus(`Sessão ativa\nUsuário: ${data.nome} (${data.email})\nPerfil: ${data.role}`);
    } catch (err) {
        setStatus(err.message, true);
    }
});

btnLogout.addEventListener("click", async () => {
    try {
        const data = await callApi("/auth/logout", "POST");
        clearToken();
        setStatus(data.mensagem);
    } catch (err) {
        setStatus(err.message, true);
    }
});

if (getToken()) {
    setStatus("Token JWT encontrado. Use 'Quem sou eu' para validar.");
}
