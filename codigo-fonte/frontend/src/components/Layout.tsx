import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const pathsSemNavbar = ["/login", "/recuperar-senha", "/redefinir-senha"];
    const ocultarNavbar = pathsSemNavbar.includes(location.pathname);

    return (
        <>
        {!ocultarNavbar && <Navbar />}
        {children}
        </>
    );
}