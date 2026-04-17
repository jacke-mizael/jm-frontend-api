import { AUTH_MODES, STORAGE_KEYS } from "../config/constants.js";

export const state = {
    pendingEmail: "",
    pendingCadastroEmail: "",
    authMode: AUTH_MODES.login,
    token: localStorage.getItem(STORAGE_KEYS.token) || "",
    user: null,
    cursos: [],
    modulos: [],
    aulas: [],
    selectedCursoId: null,
    selectedModuloId: null,
    selectedAulaId: null,
    watchMetrics: {},
    realtimeTimerId: null,
    contentSignature: ""
};

export const playerRuntime = {
    apiPromise: null,
    instance: null,
    intervalId: null,
    firstReadyTimeoutId: null,
    pendingVideoId: null,
    pendingStartSeconds: 0,
    activeAulaId: null,
    accumulatedSeconds: 0,
    lastPlayerTime: 0,
    lastUiRefreshAt: 0
};

export const ui = {
    sceneLogin: document.getElementById("sceneLogin"),
    scenePlataforma: document.getElementById("scenePlataforma"),

    loginPrototypeImage: document.getElementById("loginPrototypeImage"),
    loginImageFallback: document.getElementById("loginImageFallback"),

    btnModoLogin: document.getElementById("btnModoLogin"),
    btnModoCadastro: document.getElementById("btnModoCadastro"),
    authFlowLogin: document.getElementById("authFlowLogin"),
    authFlowCadastro: document.getElementById("authFlowCadastro"),

    formEmail: document.getElementById("formEmail"),
    formSenha: document.getElementById("formSenha"),
    inputEmail: document.getElementById("inputEmail"),
    inputSenha: document.getElementById("inputSenha"),
    btnContinuarEmail: document.getElementById("btnContinuarEmail"),
    btnEntrar: document.getElementById("btnEntrar"),
    btnVoltarEmail: document.getElementById("btnVoltarEmail"),
    btnIrCadastro: document.getElementById("btnIrCadastro"),

    formCadastroEmail: document.getElementById("formCadastroEmail"),
    formCadastroSenha: document.getElementById("formCadastroSenha"),
    cadastroEmail: document.getElementById("cadastroEmail"),
    cadastroNome: document.getElementById("cadastroNome"),
    cadastroTelefone: document.getElementById("cadastroTelefone"),
    cadastroSenha: document.getElementById("cadastroSenha"),
    cadastroSenhaConfirmacao: document.getElementById("cadastroSenhaConfirmacao"),
    cadastroEmailHint: document.getElementById("cadastroEmailHint"),
    btnContinuarCadastroEmail: document.getElementById("btnContinuarCadastroEmail"),
    btnVoltarCadastroEmail: document.getElementById("btnVoltarCadastroEmail"),
    btnCriarConta: document.getElementById("btnCriarConta"),
    btnIrLogin: document.getElementById("btnIrLogin"),

    authState: document.getElementById("authState"),
    senhaEmailHint: document.getElementById("senhaEmailHint"),

    sidebar: document.getElementById("sidebar"),
    sidebarOverlay: document.getElementById("sidebarOverlay"),
    btnMenuToggle: document.getElementById("btnMenuToggle"),

    menuItems: Array.from(document.querySelectorAll(".menu-item")),
    logoutButton: document.querySelector(".logout-item"),

    statusLine: document.getElementById("statusLine"),
    welcomeTitle: document.getElementById("welcomeTitle"),
    welcomeText: document.getElementById("welcomeText"),

    viewCursos: document.getElementById("viewCursos"),
    viewCertificados: document.getElementById("viewCertificados"),
    viewPerfil: document.getElementById("viewPerfil"),
    viewCurso: document.getElementById("viewCurso"),
    viewAula: document.getElementById("viewAula"),

    cardsCursos: document.getElementById("cardsCursos"),
    certificadosGrid: document.getElementById("certificadosGrid"),

    cursoTitulo: document.getElementById("cursoTitulo"),
    cursoDescricao: document.getElementById("cursoDescricao"),
    listaModulosCurso: document.getElementById("listaModulosCurso"),
    moduloAulasSection: document.getElementById("moduloAulasSection"),
    moduloSelecionadoResumo: document.getElementById("moduloSelecionadoResumo"),
    listaAulasCurso: document.getElementById("listaAulasCurso"),

    perfilNome: document.getElementById("perfilNome"),
    perfilEmail: document.getElementById("perfilEmail"),
    perfilRole: document.getElementById("perfilRole"),

    kpiCursos: document.getElementById("kpiCursos"),
    kpiAulasConcluidas: document.getElementById("kpiAulasConcluidas"),
    kpiAulasTotal: document.getElementById("kpiAulasTotal"),
    kpiCertificados: document.getElementById("kpiCertificados"),

    usuarioForm: document.getElementById("usuarioForm"),
    usuarioNome: document.getElementById("usuarioNome"),
    usuarioTelefone: document.getElementById("usuarioTelefone"),
    usuarioEmail: document.getElementById("usuarioEmail"),
    usuarioRole: document.getElementById("usuarioRole"),
    usuarioSenha: document.getElementById("usuarioSenha"),
    btnSalvarUsuario: document.getElementById("btnSalvarUsuario"),
    btnRecarregarPerfil: document.getElementById("btnRecarregarPerfil"),
    btnLimparUsuario: document.getElementById("btnLimparUsuario"),
    roleLockHint: document.getElementById("roleLockHint"),
    perfilFeedback: document.getElementById("perfilFeedback"),

    btnVoltarCursos: document.getElementById("btnVoltarCursos"),
    btnVoltarCurso: document.getElementById("btnVoltarCurso"),

    aulaHeading: document.getElementById("aulaHeading"),
    aulaSubheading: document.getElementById("aulaSubheading"),
    aulaFrame: document.getElementById("aulaFrame"),
    playerFallback: document.getElementById("playerFallback"),
    btnAulaAnterior: document.getElementById("btnAulaAnterior"),
    btnAulaProxima: document.getElementById("btnAulaProxima"),
    aulaPosicao: document.getElementById("aulaPosicao")
};
