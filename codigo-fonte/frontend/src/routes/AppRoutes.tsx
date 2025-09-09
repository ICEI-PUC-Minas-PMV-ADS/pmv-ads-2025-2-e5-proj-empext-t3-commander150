import { Routes, Route } from "react-router-dom";
import Layout from "../components/Layout";
import LoginPage from "../pages/Login";
import App from "../App";

export default function AppRoutes() {
    return (
    <Layout>
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<LoginPage />} />
        </Routes>
    </Layout>
    );
}