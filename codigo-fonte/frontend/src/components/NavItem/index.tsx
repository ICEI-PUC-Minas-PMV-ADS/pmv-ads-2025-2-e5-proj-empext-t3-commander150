// components/NavItem.tsx
import { NavLink } from "react-router-dom";
import "./style.css";

type NavItemProps = {
    label: string;
    url: string;
};

    export default function NavItem({ label, url }: NavItemProps) {
    return (
        <li className="nav-item">
        <NavLink
            to={url}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
            {label}
        </NavLink>
        </li>
    );
}