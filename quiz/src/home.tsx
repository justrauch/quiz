import './app.css'
import { useState } from 'preact/hooks';
import { route } from 'preact-router';

export function Home(props: any) {

  /* ---------------- View State ---------------- */
  const [showSignup, setShowSignup] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  /* ---------------- Error Handling ---------------- */
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* ---------------- Signup Form State ---------------- */
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordRepeat, setSignupPasswordRepeat] = useState("");

  /* ---------------- Login Form State ---------------- */
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const sendAuthRequest = async (
    username: string,
    password: string,
    endpoint: string
  ) => {
    try {
      setShowError(false);
      const formData = new FormData();
      formData.append("name", username);
      formData.append("pw", password);

      const response = await fetch(
        `http://localhost:8000/${endpoint}`,
        {
          method: "POST",
          body: formData,
          credentials: "include"
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setErrorMessage(
          response.status === 409 || response.status === 401
            ? data.detail
            : "Serverfehler – bitte erneut versuchen"
        );
        setShowError(true);
        return;
      }

      await response.json();

      if (endpoint === "log-in") {
        route('/quiz');
      }

      if (endpoint === "sign-up") {
        setShowLogin(true);
        setShowSignup(false);
      }

    } catch (error) {
      console.error(`Authentifizierungsanfrage fehlgeschlagen (${endpoint}):`, error);
    }
  };

  return (
    <>
      {/* ---------------- Navigation ---------------- */}
      {(showSignup || showLogin) && (
        <div class="div-buttons">
          <button
            name="btn-switch-login"
            onClick={() => {
              setShowLogin(true);
              setShowSignup(false);
            }}
          >
            Einloggen
          </button>

          <button
            name="btn-switch-signup"
            onClick={() => {
              setShowLogin(false);
              setShowSignup(true);
            }}
          >
            Registrieren
          </button>
        </div>
      )}

      <div>
        {/* ---------------- Fehlermeldung ---------------- */}
        {showError && (
          <span style={{ color: "red" }} data-testid="error-message">
            {errorMessage}
          </span>
        )}

        {/* ---------------- Registrierungsformular ---------------- */}
        {showSignup && (
          <form data-testid="form-signup">
            <div class="form-row">
              <label htmlFor="signup-username">Name:</label>
              <input
                id="signup-username"
                name="signup-username"
                type="text"
                maxLength={50}
                onInput={e => setSignupUsername((e.target as HTMLInputElement).value || "")}
              />
            </div>

            <div class="form-row">
              <label htmlFor="signup-password">Passwort:</label>
              <input
                id="signup-password"
                name="signup-password"
                type="password"
                onInput={e => setSignupPassword((e.target as HTMLInputElement).value || "")}
              />
            </div>

            {signupPassword !== signupPasswordRepeat && (
              <span style={{ color: "red" }} data-testid="signup-password-mismatch">
                Passwort stimmt nicht überein!
              </span>
            )}

            <div class="form-row">
              <label htmlFor="signup-password-repeat">Passwort wiederholen:</label>
              <input
                id="signup-password-repeat"
                name="signup-password-repeat"
                type="password"
                onInput={e => setSignupPasswordRepeat((e.target as HTMLInputElement).value || "")}
              />
            </div>

            <button
              type="button"
              name="btn-signup-submit"
              class="myButton"
              disabled={
                signupUsername.trim() === "" ||
                signupPassword.trim() === "" ||
                signupPassword !== signupPasswordRepeat
              }
              onClick={e => {
                e.preventDefault();
                sendAuthRequest(signupUsername, signupPassword, "sign-up");
              }}
            >
              Absenden
            </button>
          </form>
        )}

        {/* ---------------- Loginformular ---------------- */}
        {showLogin && (
          <form data-testid="login-form">
            <div class="form-row">
              <label htmlFor="login-username">Name:</label>
              <input
                id="login-username"
                name="login-username"
                type="text"
                maxLength={50}
                onInput={e => setLoginUsername((e.target as HTMLInputElement).value || "")}
              />
            </div>

            <div class="form-row">
              <label htmlFor="login-password">Passwort:</label>
              <input
                id="login-password"
                name="login-password"
                type="password"
                onInput={e => setLoginPassword((e.target as HTMLInputElement).value || "")}
              />
            </div>

            <button
              type="button"
              name="btn-login-submit"
              id = "btn-login-submit"
              class="myButton"
              disabled={loginUsername.trim() === "" || loginPassword.trim() === ""}
              onClick={e => {
                e.preventDefault();
                sendAuthRequest(loginUsername, loginPassword, "log-in");
              }}
            >
              Absenden
            </button>
          </form>
        )}
      </div>
    </>
  );
}
