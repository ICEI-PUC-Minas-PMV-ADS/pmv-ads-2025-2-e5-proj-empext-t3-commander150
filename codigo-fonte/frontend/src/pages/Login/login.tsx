import styles from "./LoginPage.module.css";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, getSessionId, getTipoUsuario } from "../../services/authServico";
import Swal from "sweetalert2";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [manterConectado, setManterConectado] = useState(false);
    const qtdCaracteresSenha = 4;

    const navigate = useNavigate();

    useEffect(() => {
        const session = getSessionId();
        const tipo = getTipoUsuario();

        if (session && tipo) {
        redirecionarUsuario(tipo);
        }
    }, []);

    const redirecionarUsuario = (tipo: string) => {
        switch (tipo) {
        case "medico":
            navigate("/consulta");
            break;
        case "enfermeiro":
            navigate("/triagem");
            break;
        case "secretario":
            navigate("/pacientes/novo");
            break;
        case "admin":
        default:
            navigate("/"); // Redireciona para home ou dashboard padrão
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (senha.length < qtdCaracteresSenha) {
        Swal.fire("Erro", `A senha deve ter pelo menos ${qtdCaracteresSenha} caracteres.`, "warning");
        return;
        }

        const dadosLogin = await login(email, senha);

        if (dadosLogin) {
        Swal.fire("Sucesso", "Login realizado com sucesso!", "success").then(() => {
            redirecionarUsuario(dadosLogin.tipo_usuario);
        });
        }
    };

    return (
        <div className={styles.container}>
        <form className={styles.card} onSubmit={handleSubmit}>
            <h2 className={styles.title}>Login</h2>

            <div className={styles.inputGroup}>
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="exemplo@exemplo.com"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                    className={styles.input}
                />
            </div>

            <div className={styles.inputGroup}>
                <label htmlFor="senha">Senha</label>
                <input
                    type="password"
                    id="senha"
                    name="senha"
                    placeholder="**********"
                    value={senha}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSenha(e.target.value)}
                    required
                    minLength={qtdCaracteresSenha}
                    className={styles.input}
                />
            </div>

            <div className={styles.checkboxRow}>
            <label className={styles.checkboxLabel}>
                <input
                type="checkbox"
                checked={manterConectado}
                onChange={(e) => setManterConectado(e.target.checked)}
                />
                Manter-me conectado
            </label>

            <Link to="/recuperar-senha" className={styles.link}>
                Esqueceu a senha?
            </Link>
            </div>

            <button
                type="submit"
                className={styles.submitButton}
            >
                Entrar
            </button>
        </form> 
        </div>
    );
}