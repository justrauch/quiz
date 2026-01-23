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

  /**
   * Sendet Authentifizierungsanfragen (Login oder Registrierung) an das Backend
   *
   * @param username - eingegebener Benutzername
   * @param password - eingegebenes Passwort
   * @param endpoint - "log-in" oder "sign-up"
   */
  const sendAuthRequest = async (
    username: string,
    password: string,
    endpoint: string
  ) => {
    try {
      // Fehlerzustand vor jeder Anfrage zurücksetzen
      setShowError(false);

      // FormData für die Anfrage erstellen
      const formData = new FormData();
      formData.append("name", username);
      formData.append("pw", password);

      // Anfrage an das Backend
      const response = await fetch(
        `http://localhost:8000/${endpoint}`,
        {
          method: "POST",
          body: formData,
          credentials: "include"
        }
      );

      // Fehlerbehandlung bei ungültiger Antwort
      if (!response.ok) {
        const data = await response.json();

        // Backend-Fehlermeldung bei bekannten Statuscodes anzeigen
        setErrorMessage(
          response.status === 409 || response.status === 401
            ? data.detail
            : "Serverfehler – bitte erneut versuchen"
        );

        setShowError(true);
        return;
      }

      await response.json();

      // Erfolgreicher Login → Weiterleitung zur Quiz-Seite
      if (endpoint === "log-in") {
        route('/quiz');
      }

      // Erfolgreiche Registrierung → Wechsel zur Login-Ansicht
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
          {/* Button zum Wechseln zum Login */}
          <button
            onClick={() => {
              setShowLogin(true);
              setShowSignup(false);
            }}
          >
            Einloggen
          </button>

          {/* Button zum Wechseln zur Registrierung */}
          <button
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
          <span style={{ color: "red" }}>
            {errorMessage}
          </span>
        )}

        {/* ---------------- Registrierungsformular ---------------- */}
        {showSignup && (
          <form>
            <div class="form-row">
              <label>Name:</label>
              <input
                type="text"
                maxLength={50}
                onInput={e =>
                  setSignupUsername(
                    (e.target as HTMLInputElement).value || ""
                  )
                }
              />
            </div>

            <div class="form-row">
              <label>Passwort:</label>
              <input
                type="password"
                onInput={e =>
                  setSignupPassword(
                    (e.target as HTMLInputElement).value || ""
                  )
                }
              />
            </div>

            {/* Warnung bei nicht übereinstimmenden Passwörtern */}
            {signupPassword !== signupPasswordRepeat && (
              <span style={{ color: "red" }}>
                Passwort stimmt nicht überein!
              </span>
            )}

            <div class="form-row">
              <label>Passwort wiederholen:</label>
              <input
                type="password"
                onInput={e =>
                  setSignupPasswordRepeat(
                    (e.target as HTMLInputElement).value || ""
                  )
                }
              />
            </div>

            {/* Absenden Button für Registrierung */}
            <button
              type="button"
              class="myButton"
              disabled={
                signupUsername.trim() === "" ||
                signupPassword.trim() === "" ||
                signupPassword !== signupPasswordRepeat
              }
              onClick={e => {
                e.preventDefault();
                sendAuthRequest(
                  signupUsername,
                  signupPassword,
                  "sign-up"
                );
              }}
            >
              Absenden
            </button>
          </form>
        )}

        {/* ---------------- Loginformular ---------------- */}
        {showLogin && (
          <form>
            <div class="form-row">
              <label>Name:</label>
              <input
                type="text"
                maxLength={50}
                onInput={e =>
                  setLoginUsername(
                    (e.target as HTMLInputElement).value || ""
                  )
                }
              />
            </div>

            <div class="form-row">
              <label>Passwort:</label>
              <input
                type="password"
                onInput={e =>
                  setLoginPassword(
                    (e.target as HTMLInputElement).value || ""
                  )
                }
              />
            </div>

            {/* Absenden Button für Login */}
            <button
              type="button"
              class="myButton"
              disabled={
                loginUsername.trim() === "" ||
                loginPassword.trim() === ""
              }
              onClick={e => {
                e.preventDefault();
                sendAuthRequest(
                  loginUsername,
                  loginPassword,
                  "log-in"
                );
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
