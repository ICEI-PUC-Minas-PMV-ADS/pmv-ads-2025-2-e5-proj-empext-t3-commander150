import api from "./api";
import Swal from "sweetalert2";

/**
 * Realiza login na API utilizando email e senha.
 * Armazena o sessionid, tipo_usuario e nome no localStorage e configura o header Authorization.
 *
 * @param email - Email do usuário
 * @param senha - Senha do usuário
 * @returns Objeto com sessionid e tipo_usuario se login for bem-sucedido
 */
export async function login(
    email: string,
    senha: string
): Promise<{ sessionid: string; tipo_usuario: string; nome: string; usuario_id: string } | null> {
    try {
        const response = await api.post("/login/", { email, senha });

        const sessionid = response.data?.sessionid;
        const tipo_usuario = response.data?.tipo_usuario;
        const nome = response.data?.nome;
        const usuario_id = response.data?.id;

        localStorage.setItem("sessionid", sessionid);
        localStorage.setItem("tipo_usuario", tipo_usuario);
        localStorage.setItem("nome", nome);
        localStorage.setItem("usuario_id", usuario_id);

        api.defaults.headers.common["Authorization"] = `Bearer ${sessionid}`;

        return { sessionid, tipo_usuario, nome, usuario_id };
    } catch (error: any) {
        if (error.response) {
        const { status, data } = error.response;

        if (status === 400 || status === 401) {
            Swal.fire("Erro de login", data?.erro || "Credenciais inválidas.", "error");
        } else if (status === 404) {
            Swal.fire(
            "Usuário não encontrado",
            data?.erro || "Verifique o email informado.",
            "warning"
            );
        } else {
            Swal.fire("Erro inesperado", `Tente novamente mais tarde. ${error}`, "error");
        }
        } else {
        Swal.fire("Erro de rede", `Não foi possível conectar ao servidor. ${error}`, "error");
        }

        return null;
    }
}

export function getSessionId(): string | null {
    return localStorage.getItem("sessionid");
}

export function getTipoUsuario(): string | null {
    return localStorage.getItem("tipo_usuario");
}

/**
 * Retorna os dados do usuário logado armazenados localmente.
 * @returns { nome: string | null, tipo_usuario: string | null }
 */
export function getDadosUsuario(): { nome: string | null; tipo_usuario: string | null; usuario_id: string | null; } {
    return {
        nome: localStorage.getItem("nome"),
        tipo_usuario: localStorage.getItem("tipo_usuario"),
        usuario_id: localStorage.getItem("usuario_id"),
    };
}

export async function logout(): Promise<void> {
    try {
        const sessionid = getSessionId();

        if (sessionid) {
        await api.post("/logout/");
        }

        localStorage.removeItem("sessionid");
        localStorage.removeItem("tipo_usuario");
        localStorage.removeItem("usuario_id");
        localStorage.removeItem("nome");
        delete api.defaults.headers.common["Authorization"];

        Swal.fire("Logout", "Sessão encerrada com sucesso.", "success");
    } catch (error) {
        Swal.fire("Erro", "Erro ao encerrar sessão. Tente novamente.", "error");
    }
}

/**
 * Verifica com o back-end se o sessionid armazenado localmente ainda é válido.
 * Em caso de 401/403, limpa a sessão local para evitar loops.
 *
 * @returns boolean
 */
export async function isAuthenticated(): Promise<boolean> {
    const sessionid = getSessionId();

    if (!sessionid) return false;

    try {
        const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/validar-sessao/`,
        {
            method: "GET",
            headers: {
            Authorization: `Bearer ${sessionid}`,
            },
        }
    );

    if (response.ok) return true;

    // Sessão inválida → limpa localStorage e headers
    localStorage.removeItem("sessionid");
    localStorage.removeItem("tipo_usuario");
    localStorage.removeItem("usuario_id");
    localStorage.removeItem("nome");
    delete api.defaults.headers.common["Authorization"];
    return false;
    } catch {
        return false;
    }
}