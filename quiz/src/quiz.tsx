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
      <button class="myButton" style={{marginBottom: 5}} onClick={logout}>Abmelden</button>

      {/* ---------------- Quiz Scores anzeigen ---------------- */}
      {showQuizScores && 
        <div>
          <div class="form-row">
            <label>Filter:</label>
            <input
              type="text"
              value={filterText}
              onInput={e => setFilterText((e.target as HTMLInputElement).value)}
            />
            <button onClick={() => {
              setFilteredScores(scores.filter(s =>
                s.user_name.toLowerCase().includes(filterText.toLowerCase()) ||
                (s.score.toString() + "%").includes(filterText)
              ));
            }}>filtern</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nutzer Name</th>
                <th>Bester Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredScores.map(s => (
                <tr>
                  <td>{s.user_name}</td>
                  <td>{s.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setShowQuizScores(false)}>Zurück</button>
        </div>
      }

      {/* ---------------- Quiz bearbeiten ---------------- */}
      {showEditQuiz && 
        <div>
          <EditQuiz editelement={editQuizItem}></EditQuiz>
          <button onClick={() => {fetchAllQuizzes("quiz-get-all-private"); setShowEditQuiz(false)}}>Zurück</button>
        </div>
      }

      {/* ---------------- Quiz starten ---------------- */}
      {startQuiz && 
        <div>
          <StartQuiz editelement={selectedQuiz} is_public={quizIsPublic}></StartQuiz>
          <button onClick={() => {
            setStartQuiz(false); 
            setShowMyScores(false); 
            setShowQuizList(true); 
            setShowCreateQuizButton(!quizIsPublic);
          }}>Zurück zu Meine Quizze</button>
        </div>
      }

      {/* ---------------- Hauptansicht: Quiz erstellen / Listen / Scores ---------------- */}
      {!showEditQuiz && !startQuiz && !showQuizScores && 
        <div>
          {/* Buttons oben */}
          <div class="div-buttons">
            <button onClick={() => { setShowMyScores(false); setShowQuizList(false)}}>Quiz erstellen</button>
            <button onClick={() => { setShowMyScores(false); setShowCreateQuizButton(true); fetchAllQuizzes("quiz-get-all-private"); setShowQuizList(true);}}>Meine Quizze</button>
            <button onClick={() => { setShowMyScores(false); setShowCreateQuizButton(false); fetchAllQuizzes("quiz-get-all-public"); setShowQuizList(true);}}>Öffentliche Quizze</button>
            <button onClick={() => { fetchAllUserScores(); setShowMyScores(true); setShowQuizList(false);}}>Meine Scores</button>
          </div>

          {/* ---------------- Eigene Scores anzeigen ---------------- */}
          {!showQuizList && showMyScores && <div>
            <div class="form-row">
              <label>Filter:</label>
              <input type="text" value={filterText} onInput={e => setFilterText((e.target as HTMLInputElement).value)} />
              <button onClick={() => {
                setFilteredScores(scores.filter(s =>
                  s.quiz_name.toLowerCase().includes(filterText.toLowerCase()) ||
                  (s.score.toString() + "%").includes(filterText)
                ));
              }}>filtern</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Quiz Name</th>
                  <th>Bester Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredScores.map(s => (
                  <tr>
                    <td>{s.quiz_name}</td>
                    <td>{s.score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}

          {/* ---------------- Quiz erstellen ---------------- */}
          {!showQuizList && !showMyScores &&
            <div>
              <form>
                {showAddQuizError && (
                  <span style={{ color: "red" }}>
                    {addQuizErrorMessage}
                  </span>
                )}
                <div class="form-row">
                  <label>Name:</label>
                  <input type="text" maxLength={50} onInput={(e) => setQuizNameInput((e.target as HTMLInputElement).value || "")}/>
                </div>
                <div class="form-row">
                  <label>Maximal Zeit in min (leer lassen für kein Limit):</label>
                  <input type="number" onInput={(e) => {const value = (e.target as HTMLInputElement).value; setQuizTimeInput(value === "" ? -1 : Number(value));}}/>
                </div>
                <div class="form-row">
                  <label>Sichtbarkeit:</label>
                  <div>
                    <label>
                      <input type="radio" name="public" value="false" checked={selectedVisibility === "false"} onChange={(e) => setSelectedVisibility((e.target as HTMLInputElement).value || "")}/> Privat
                    </label>
                    <label>
                      <input type="radio" name="public" value="true" checked={selectedVisibility === "true"} onChange={(e) => setSelectedVisibility((e.target as HTMLInputElement).value || "")}/> Öffentlich
                    </label>
                  </div>
                </div>
                <button type="button" class="myButton" onClick={(e) => {e.preventDefault(); addQuiz(quizNameInput, quizTimeInput);}} disabled={quizNameInput.trim() === ""}>Absenden</button>
              </form>
            </div>
          }

          {/* ---------------- Quiz Liste anzeigen ---------------- */}
          {showQuizList &&
            <div>
              {!showCreateQuizButton && <button onClick={() => fetchAllQuizzes("quiz-get-all-public")}>Neuladen</button>}
              <div class="form-row">
                <label>Filter:</label>
                <input type="text" value={filterText} onInput={e => setFilterText((e.target as HTMLInputElement).value)} />
                <button onClick={() => { setFilteredQuizzes(quizzes.filter(q => q.name.toLowerCase().includes(filterText.toLowerCase())))}}>filtern</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuizzes.map(q => (
                    <tr>
                      <td>{q.name}</td>
                      <button onClick={() => { setSelectedQuiz(q); setStartQuiz(true); setShowQuizList(false); setQuizIsPublic(!showCreateQuizButton); setShowCreateQuizButton(false);}}>
                        {showCreateQuizButton ? "test" : "start"}
                      </button>
                      {!showCreateQuizButton && <button onClick={() => {fetchScoresForQuiz(q.id.toString()); setShowQuizScores(true)}}>Scores</button>}
                      {showCreateQuizButton &&
                        <td>
                          <button onClick={() => {setEditQuizItem(q); setShowEditQuiz(true);}}>edit</button>
                          <button onClick={() => deleteQuiz(q.id + "")}>delete</button>
                        </td>
                      }
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
