import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import profile from "../../assets/profile.png";
import NavItem from "../NavItem";
import "./style.css";
import { logout, getDadosUsuario } from "../../services/authService";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const { nome, tipo_usuario } = getDadosUsuario(); // Dados do usuário

    const navItems = [
        { label: "Teste", url: "/teste" },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsMenuOpen(false);
        await logout();
        navigate("/login");
    };

    const handleChangePassword = () => {
        setIsMenuOpen(false);
        navigate("/alterar-senha");
    };

    return (
        <header>
        <nav className="navbar">
            <a href="/pacientes">
            <img className="logo" src={logo} alt="System logo" />
            </a>

            <ul className="nav-items">
            {navItems.map((item, index) => (
                <NavItem key={index} label={item.label} url={item.url} />
            ))}
            </ul>

            <div className="nav-user" ref={menuRef}>
            <button
                className="nav-info"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((prev) => !prev)}
            >
                <div>
                <p className="nav-name">{nome || "Usuário"}</p>
                </div>
                <p className="nav-name">{nome || "Sair"}</p>
            </button>

            {isMenuOpen && (
                <div className="dropdown-menu" role="menu">
                <button className="dropdown-item" onClick={handleChangePassword}>
                    Alterar senha
                </button>
                <button className="dropdown-item" onClick={handleLogout}>
                    Sair
                </button>
                </div>
            )}
            </div>
        </nav>
        </header>
    );
}