import { useState, useEffect } from 'preact/hooks';
import { EditQuiz } from './editquiz';
import { StartQuiz } from './startquiz';
import { route } from 'preact-router';

interface Score {
  user_name: string;
  quiz_name: string;
  score: number;
}

interface Quiz {
  id: number;
  name: string;
  is_public: boolean;
  creater: number;
  time: number;
}

export function Quiz(props: any){

  /* ---------------- Anzeigezustände ---------------- */
  const [showQuizList, setShowQuizList] = useState(false);
  const [showQuizScores, setShowQuizScores] = useState(false);
  const [showMyScores, setShowMyScores] = useState(false);
  const [showEditQuiz, setShowEditQuiz] = useState(false);
  const [startQuiz, setStartQuiz] = useState(false);

  /* ---------------- Aktuell ausgewähltes Quiz ---------------- */
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | undefined>(undefined);
  const [editQuizItem, setEditQuizItem] = useState<Quiz | undefined>(undefined);
  const [quizIsPublic, setQuizIsPublic] = useState(false);

  /* ---------------- Formulare und Eingaben ---------------- */
  const [showCreateQuizButton, setShowCreateQuizButton] = useState(true);
  const [quizNameInput, setQuizNameInput] = useState("");
  const [quizTimeInput, setQuizTimeInput] = useState(-1);
  const [selectedVisibility, setSelectedVisibility] = useState("false");

  /* ---------------- Fehlerbehandlung ---------------- */
  const [showAddQuizError, setShowAddQuizError] = useState(false);
  const [addQuizErrorMessage, setAddQuizErrorMessage] = useState("");

  /* ---------------- Daten ---------------- */
  const [scores, setScores] = useState<Score[]>([]);
  const [filteredScores, setFilteredScores] = useState<Score[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);

  /* ---------------- Filter ---------------- */
  const [filterText, setFilterText] = useState("");

  /**
   * Holt alle Quizze vom Backend (privat oder öffentlich)
   * @param endpoint - API-Endpunkt wie "quiz-get-all-private" oder "quiz-get-all-public"
   */
  const fetchAllQuizzes = async (endpoint: string) => {
    try {
      const response = await fetch(`http://localhost:8000/${endpoint}`, {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) { 
        const data = await response.json(); 
        console.error(`Fehler beim Abrufen der Quizze`);
        return; 
      }

      const data = await response.json();
      setFilteredQuizzes(data);
      setQuizzes(data);

    } catch (error) {
      console.error(`Fehler beim Abrufen der Quizze:`, error);
    }
  };

  /**
   * Holt alle Scores des angemeldeten Users
   */
  const fetchAllUserScores = async () => {
    try {
      setScores([]);
      const response = await fetch(`http://localhost:8000/user/scores`, {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) { 
        const data = await response.json(); 
        console.error(`Fehler beim Abrufen der Scores`);
        return; 
      }

      const data = await response.json();
      setFilteredScores(data);
      setScores(data);

    } catch (error) {
      console.error(`Fehler beim Abrufen der Scores:`, error);
    }
  };

  /**
   * Holt alle Scores eines bestimmten Quiz
   * @param quizId - ID des Quiz
   */
  const fetchScoresForQuiz = async (quizId: string) => {
    try {
      setScores([]);
      const response = await fetch(`http://localhost:8000/quiz/${quizId}/scores`, {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) { 
        const data = await response.json(); 
        console.error(`Fehler beim Abrufen der Scores`);
        return; 
      }

      const data = await response.json();
      setScores(data);
      setFilteredScores(data);

    } catch (error) {
      console.error(`Fehler beim Abrufen der Scores:`, error);
    }
  };

  /**
   * Neues Quiz erstellen
   * @param name - Name des Quiz
   * @param time - Zeitlimit in Minuten
   */
  const addQuiz = async (name: string, time: number) => {
    try {
      setShowAddQuizError(false);
      const formData = new FormData();
      formData.append("quiz_name", name);
      formData.append("is_public", selectedVisibility);
      formData.append("time", (time * 60 - (time * 60) % 1).toString());

      const response = await fetch(`http://localhost:8000/add-quiz`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) { 
        const data = await response.json(); 
        setAddQuizErrorMessage(
          response.status === 409 || response.status === 401
            ? data.detail
            : "Server Error – versuchen Sie es erneut"
        );
        setShowAddQuizError(true);
        console.error(data.detail);
        return; 
      }

      const data = await response.json();
      fetchAllQuizzes("quiz-get-all-private"); 
      setShowQuizList(true);

    } catch (error) {
      console.error(`Fehler beim Hinzufügen des Quiz:`, error);
    }
  };

  /**
   * Löscht ein Quiz
   * @param quizId - ID des Quiz
   */
  const deleteQuiz = async (quizId: string) => {
    try {
      const formData = new FormData();
      formData.append("quiz_id", quizId);

      const response = await fetch(`http://localhost:8000/delete-quiz`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) { 
        const data = await response.json(); 
        console.error(`Fehler beim Löschen des Quiz`);
        return; 
      }

      const data = await response.json();
      fetchAllQuizzes("quiz-get-all-private"); 
      setShowQuizList(true);

    } catch (error) {
      console.error(`Fehler beim Löschen des Quiz:`, error);
    }
  };

  /**
   * Logout-Funktion
   */
  const logout = async () => {
    try {
      const response = await fetch(`http://localhost:8000/log-out`, {
        method: "POST",
        credentials: "include"
      });

      if (!response.ok) { 
        const data = await response.json(); 
        console.error(`Fehler beim Logout`);
        return; 
      }

      await response.json();
      route("/"); // Weiterleitung zur Startseite

    } catch (error) {
      console.error(`Fehler beim Logout:`, error);
    }
  };

  return (
    <>
      {/* ---------------- Logout Button ---------------- */}
      <button id="logout-button" class="myButton" style={{marginBottom: 5}} onClick={logout}>Abmelden</button>

      {/* ---------------- Quiz Scores anzeigen ---------------- */}
      {showQuizScores && 
        <div id="quiz-scores-section">
          <div class="form-row" id="quiz-scores-filter-row">
            <label id="quiz-scores-filter-label">Filter:</label>
            <input
              id="quiz-scores-filter-input"
              type="text"
              value={filterText}
              onInput={e => setFilterText((e.target as HTMLInputElement).value)}
            />
            <button id="quiz-scores-filter-button" onClick={() => {
              setFilteredScores(scores.filter(s =>
                s.user_name.toLowerCase().includes(filterText.toLowerCase()) ||
                (s.score.toString() + "%").includes(filterText)
              ));
            }}>filtern</button>
          </div>
          <table id="quiz-scores-table">
            <thead>
              <tr>
                <th id="scores-user-name-header">Nutzer Name</th>
                <th id="scores-score-header">Bester Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredScores.map((s, idx) => (
                <tr id={`score-row-${idx}`}>
                  <td id={`score-user-${idx}`}>{s.user_name}</td>
                  <td id={`score-value-${idx}`}>{s.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button id="quiz-scores-back-button" onClick={() => setShowQuizScores(false)}>Zurück</button>
        </div>
      }

      {/* ---------------- Quiz bearbeiten ---------------- */}
      {showEditQuiz && 
        <div id="edit-quiz-section">
          <EditQuiz editelement={editQuizItem}></EditQuiz>
          <button id="edit-quiz-back-button" onClick={() => {fetchAllQuizzes("quiz-get-all-private"); setShowEditQuiz(false)}}>Zurück</button>
        </div>
      }

      {/* ---------------- Quiz starten ---------------- */}
      {startQuiz && 
        <div id="start-quiz-section">
          <StartQuiz editelement={selectedQuiz} is_public={quizIsPublic}></StartQuiz>
          <button id="start-quiz-back-button" onClick={() => {
            setStartQuiz(false); 
            setShowMyScores(false); 
            setShowQuizList(true); 
            setShowCreateQuizButton(!quizIsPublic);
          }}>Zurück zu Meine Quizze</button>
        </div>
      }

      {/* ---------------- Hauptansicht: Quiz erstellen / Listen / Scores ---------------- */}
      {!showEditQuiz && !startQuiz && !showQuizScores && 
        <div id="main-quiz-section">
          {/* Buttons oben */}
          <div class="div-buttons" id="main-buttons">
            <button id="create-quiz-button" onClick={() => { setShowMyScores(false); setShowQuizList(false)}}>Quiz erstellen</button>
            <button id="my-quizzes-button" onClick={() => { setShowMyScores(false); setShowCreateQuizButton(true); fetchAllQuizzes("quiz-get-all-private"); setShowQuizList(true);}}>Meine Quizze</button>
            <button id="public-quizzes-button" onClick={() => { setShowMyScores(false); setShowCreateQuizButton(false); fetchAllQuizzes("quiz-get-all-public"); setShowQuizList(true);}}>Öffentliche Quizze</button>
            <button id="my-scores-button" onClick={() => { fetchAllUserScores(); setShowMyScores(true); setShowQuizList(false);}}>Meine Scores</button>
          </div>

          {/* ---------------- Eigene Scores anzeigen ---------------- */}
          {!showQuizList && showMyScores && 
            <div id="my-scores-section">
              <div class="form-row" id="my-scores-filter-row">
                <label id="my-scores-filter-label">Filter:</label>
                <input id="my-scores-filter-input" type="text" value={filterText} onInput={e => setFilterText((e.target as HTMLInputElement).value)} />
                <button id="my-scores-filter-button" onClick={() => {
                  setFilteredScores(scores.filter(s =>
                    s.quiz_name.toLowerCase().includes(filterText.toLowerCase()) ||
                    (s.score.toString() + "%").includes(filterText)
                  ));
                }}>filtern</button>
              </div>
              <table id="my-scores-table">
                <thead>
                  <tr>
                    <th id="my-scores-quiz-name-header">Quiz Name</th>
                    <th id="my-scores-score-header">Bester Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScores.map((s, idx) => (
                    <tr id={`my-score-row-${idx}`}>
                      <td id={`my-score-quiz-${idx}`}>{s.quiz_name}</td>
                      <td id={`my-score-value-${idx}`}>{s.score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }

          {/* ---------------- Quiz erstellen ---------------- */}
          {!showQuizList && !showMyScores &&
            <div id="create-quiz-section">
              <form id="create-quiz-form">
                {showAddQuizError && (
                  <span id="add-quiz-error" style={{ color: "red" }}>
                    {addQuizErrorMessage}
                  </span>
                )}
                <div class="form-row" id="quiz-name-row">
                  <label id="quiz-name-label">Name:</label>
                  <input id="quiz-name-input" type="text" maxLength={50} onInput={(e) => setQuizNameInput((e.target as HTMLInputElement).value || "")}/>
                </div>
                <div class="form-row" id="quiz-time-row">
                  <label id="quiz-time-label">Maximal Zeit in min (leer lassen für kein Limit):</label>
                  <input id="quiz-time-input" type="number" onInput={(e) => {const value = (e.target as HTMLInputElement).value; setQuizTimeInput(value === "" ? -1 : Number(value));}}/>
                </div>
                <div class="form-row" id="quiz-visibility-row">
                  <label id="quiz-visibility-label">Sichtbarkeit:</label>
                  <div id="quiz-visibility-options">
                    <label id="quiz-visibility-private-label">
                      <input id="quiz-visibility-private-radio" type="radio" name="public" value="false" checked={selectedVisibility === "false"} onChange={(e) => setSelectedVisibility((e.target as HTMLInputElement).value || "")}/> Privat
                    </label>
                    <label id="quiz-visibility-public-label">
                      <input id="quiz-visibility-public-radio" type="radio" name="public" value="true" checked={selectedVisibility === "true"} onChange={(e) => setSelectedVisibility((e.target as HTMLInputElement).value || "")}/> Öffentlich
                    </label>
                  </div>
                </div>
                <button id="create-quiz-submit" type="button" class="myButton" onClick={(e) => {e.preventDefault(); addQuiz(quizNameInput, quizTimeInput);}} disabled={quizNameInput.trim() === ""}>Absenden</button>
              </form>
            </div>
          }

          {/* ---------------- Quiz Liste anzeigen ---------------- */}
          {showQuizList &&
            <div id="quiz-list-section">
              {!showCreateQuizButton && <button id="reload-quizzes-button" onClick={() => fetchAllQuizzes("quiz-get-all-public")}>Neuladen</button>}
              <div class="form-row" id="quiz-list-filter-row">
                <label id="quiz-list-filter-label">Filter:</label>
                <input id="quiz-list-filter-input" type="text" value={filterText} onInput={e => setFilterText((e.target as HTMLInputElement).value)} />
                <button id="quiz-list-filter-button" onClick={() => { setFilteredQuizzes(quizzes.filter(q => q.name.toLowerCase().includes(filterText.toLowerCase())))}}>filtern</button>
              </div>
              <table id="quiz-list-table">
                <thead>
                  <tr>
                    <th id="quiz-list-name-header">Name</th>
                    <th id="quiz-list-actions-header"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuizzes.map((q, idx) => (
                    <tr id={`quiz-row-${idx}`}>
                      <td id={`quiz-name-${idx}`}>{q.name}</td>
                      <td id={`quiz-action-buttons-${idx}`}>
                        <button id={`quiz-start-button-${idx}`} onClick={() => { setSelectedQuiz(q); setStartQuiz(true); setShowQuizList(false); setQuizIsPublic(!showCreateQuizButton); setShowCreateQuizButton(false);}}>
                          {showCreateQuizButton ? "test" : "start"}
                        </button>
                        {!showCreateQuizButton && <button id={`quiz-scores-button-${idx}`} onClick={() => {fetchScoresForQuiz(q.id.toString()); setShowQuizScores(true)}}>Scores</button>}
                        {showCreateQuizButton &&
                          <>
                            <button id={`quiz-edit-button-${idx}`} onClick={() => {setEditQuizItem(q); setShowEditQuiz(true);}}>edit</button>
                            <button id={`quiz-delete-button-${idx}`} onClick={() => deleteQuiz(q.id + "")}>delete</button>
                          </>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </>
  )

}
