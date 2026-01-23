import { Router } from 'preact-router';
import { Home } from './home';
import { Quiz } from './quiz';

export function App() {
  return (
    <div>
      <Router>
        {/* Startseite: Anmeldung (Login) und Registrierung (Sign-up) */}
        <Home path="/" />

        {/* Quiz-Seite:
            - Quiz erstellen, bearbeiten und löschen
            - Eigene Quizze anzeigen
            - Öffentliche Quizze anzeigen
            - Eigene Ergebnisse anzeigen
            - Ergebnisse anderer Nutzer für ein bestimmtes Quiz einsehen
            - Quiz testen und an Quizzen anderer teilnehmen
        */}
        <Quiz path="/quiz" />
      </Router>
    </div>
  );
}
