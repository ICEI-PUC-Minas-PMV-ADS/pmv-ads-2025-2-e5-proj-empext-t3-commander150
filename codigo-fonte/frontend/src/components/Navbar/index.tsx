import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./style.css";
import { useSessao } from '../../contextos/AuthContexto';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { logout, usuario } = useSessao();

    const navItems = [
        { 
            label: "Criar evento", 
            url: "/criar-evento",
            icon: "➕"
        },
        { 
            label: "Meus eventos", 
            url: "/meus-eventos",
            icon: "📅"
        },
        { 
            label: "Meus ingressos", 
            url: "/meus-ingressos",
            icon: "🎫"
        }
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
        logout();
    };

    const handleChangePassword = () => {
        setIsMenuOpen(false);
        navigate("/alterar-senha");
    };

    const handleLogoClick = () => {
        navigate("/");
    };

    const getInitials = (username: string | undefined) => {
        if (!username) return "??";
        return username
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header>
            <nav className="navbar">
                {/* Logo à esquerda */}
                <button className="logo-container" onClick={handleLogoClick}>
                    <img className="logo" src={logo} alt="System logo" />
                </button>

                {/* Navegação e perfil à direita */}
                <div className="navbar-right">
                    {/* Navegação */}
                    <div className="nav-items">
                        {navItems.map((item, index) => (
                            <a 
                                key={index} 
                                href={item.url} 
                                className="nav-item"
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </a>
                        ))}
                    </div>

                    {/* Perfil do usuário */}
                    <div className="nav-user" ref={menuRef}>
                    <button
                        className="nav-profile"
                        aria-expanded={isMenuOpen}
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                    >
                        <div className="hamburger-menu">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <div className="user-avatar">
                            {getInitials(usuario?.username)}
                        </div>
                    </button>

                    {isMenuOpen && (
                        <div className="dropdown-menu" role="menu">
                            <div className="user-info">
                                <div className="user-name">
                                    {usuario?.username || "Usuário"}
                                </div>
                                <div className="user-email">
                                    {usuario?.email || ""}
                                </div>
                            </div>
                            <hr className="divider" />
                            <button className="dropdown-item" onClick={handleChangePassword}>
                                Alterar senha
                            </button>
                            <button className="dropdown-item" onClick={handleLogout}>
                                Sair
                            </button>
                        </div>
                    )}
                    </div>
                </div>
            </nav>
        </header>
    );
}