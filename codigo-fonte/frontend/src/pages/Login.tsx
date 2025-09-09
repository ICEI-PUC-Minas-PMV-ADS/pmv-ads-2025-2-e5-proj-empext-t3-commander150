export default function LoginPage() {
    return (
        <div className="login-page">
            <h1>Login</h1>
            <form>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email" />
                </div>
                <div>
                    <label htmlFor="password">Senha:</label>
                    <input type="password" id="password" name="password" />
                </div>
                <button type="submit">Entrar</button>
            </form>
        </div>
    );
}
