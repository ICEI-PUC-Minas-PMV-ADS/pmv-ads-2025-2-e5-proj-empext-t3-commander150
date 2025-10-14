// src/components/Navbar/index.tsx

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import logoMobile from "../../assets/logo_mobile.png";
import "./style.css";
import { useSessao } from "../../contextos/AuthContexto";
import Button from "../Button";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout, usuario } = useSessao();

  const navItems = [
    { label: "Criar evento", url: "/criar-evento", icon: "➕" },
    { label: "Meus eventos", url: "/historico", icon: "📅" },
  ];

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
      if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        const toggleButton = document.querySelector(".mobile-menu-toggle");
        if (!toggleButton?.contains(target)) {
          setIsMobileMenuOpen(false);
        }
      }
    };
    if (isMenuOpen || isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen, isMobileMenuOpen]);

  // Ações de sessão
  const handleLogout = async () => {
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
    logout();
  };

  const handleChangePassword = () => {
    setIsMenuOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/alterar-senha");
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavItemClick = (url: string) => {
    setIsMobileMenuOpen(false);
    navigate(url);
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const getInitials = (username: string | undefined) => {
    if (!username) return "??";
    return username
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header>
      <nav className="navbar">
        {/* Logo */}
        <button className="logo-container" onClick={handleLogoClick}>
          <img className="logo logo-desktop" src={logo} alt="System logo" />
          <img className="logo logo-mobile" src={logoMobile} alt="System logo" />
        </button>

        {/* Botão do menu mobile */}
        <button
          className="mobile-menu-toggle"
          onClick={handleMobileMenuToggle}
          aria-label="Toggle mobile menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* ==== Lado direito (desktop) ==== */}
        <div className="navbar-right">
          {usuario ? (
            <>
              {/* Navegação */}
              <div className="nav-items">
                {navItems.map((item, index) => (
                  <a key={index} href={item.url} className="nav-item">
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
                  <div className="user-avatar">{getInitials(usuario?.username)}</div>
                </button>

                {isMenuOpen && (
                  <div className="dropdown-menu" role="menu">
                    <div className="user-info">
                      <div className="user-name">{usuario?.username || "Usuário"}</div>
                      <div className="user-email">{usuario?.email || ""}</div>
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
            </>
          ) : (
            <>
              {/* Botões para deslogado */}
              <Button
                label="Login"
                type="button"
                onClick={() => navigate("/login")}
                backgroundColor="var(--var-cor-primaria)"
                />
                <Button
                label="Cadastrar"
                type="button"
                onClick={() => navigate("/cadastrar")}
                backgroundColor="var(--var-cor-secundaria)"
                />
            </>
          )}
        </div>

        {/* ==== Menu mobile ==== */}
        {isMobileMenuOpen && (
          <>
            <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="mobile-menu" ref={mobileMenuRef}>
              <div className="mobile-menu-content">
                {usuario ? (
                  <>
                    {/* Navegação */}
                    <div className="mobile-nav-items">
                      {navItems.map((item, index) => (
                        <button
                          key={index}
                          className="mobile-nav-item"
                          onClick={() => handleNavItemClick(item.url)}
                        >
                          <span className="nav-icon">{item.icon}</span>
                          <span className="nav-label">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Perfil mobile */}
                    <div className="mobile-user-section">
                      <div className="mobile-user-info">
                        <div className="user-avatar">{getInitials(usuario?.username)}</div>
                        <div className="user-details">
                          <div className="user-name">{usuario?.username || "Usuário"}</div>
                          <div className="user-email">{usuario?.email || ""}</div>
                        </div>
                      </div>
                      <hr className="divider" />
                      <div className="mobile-menu-actions">
                        <button className="mobile-dropdown-item" onClick={handleChangePassword}>
                          Alterar senha
                        </button>
                        <button className="mobile-dropdown-item" onClick={handleLogout}>
                          Sair
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mobile-menu-actions">
                    <button
                      className="mobile-dropdown-item"
                      onClick={() => handleNavItemClick("/login")}
                    >
                      Login
                    </button>
                    <button
                      className="mobile-dropdown-item"
                      onClick={() => handleNavItemClick("/cadastro")}
                    >
                      Cadastrar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}