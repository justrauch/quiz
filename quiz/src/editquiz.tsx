import { useState } from 'preact/hooks';
import { Question } from './Question';
import './app.css'

interface Quiz { 
    id: number; 
    name: string; 
    is_public: boolean; 
    creater: number; 
    time: number;
} 

interface QuestionItem { 
    id: number; 
    text: string; 
    typ: string; 
} 

interface EditQuizProps { 
    editelement: Quiz | undefined; 
} 

export function EditQuiz({ editelement }: EditQuizProps) { 

  /* ---------------- Quiz ---------------- */
  const [quizName, setQuizName] = useState(editelement?.name || "");
  const [quizTime, setQuizTime] = useState(editelement?.time ? (editelement.time >= 0 ? editelement.time : undefined) : undefined);
  const [selectedPublic, setSelectedPublic] = useState(editelement?.is_public ? "true" : "false");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [showQuestions, setShowQuestions] = useState(false);

  /* ---------------- Neue Frage ---------------- */
  const [newQuestionText, setNewQuestionText] = useState(editelement?.name || "");
  const [questionTypeSelect, setQuestionTypeSelect] = useState("Multiple choice");

  /* ---------------- Fehler / Feedback ---------------- */
  const [showQuizError, setShowQuizError] = useState(false);
  const [showQuestionError, setShowQuestionError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorColor, setErrorColor] = useState("red");


  /* ---------------- Backend-Funktionen ---------------- */
  // Quiz bearbeiten
  const handleEditQuiz = async () => {
    try {
      const formData = new FormData();
      formData.append("quiz_id", editelement?.id.toString() || "");
      formData.append("quiz_name", quizName);
      formData.append("is_public", selectedPublic);
      formData.append("time", (quizTime ? (quizTime * 60 - (quizTime * 60) % 1).toString() : "-1"));

      const response = await fetch(`http://localhost:8000/edit-quiz`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      setShowQuizError(true);

      if (!response.ok) { 
        const data = await response.json(); 
        setErrorColor("red");
        setErrorMessage(response.status === 409 || response.status === 401 ? data.detail : "Serverfehler – bitte erneut versuchen");
        console.error(data.detail);
        return; 
      }

      setErrorColor("green");
      setErrorMessage("Änderung wurde vorgenommen");
      await response.json();

    } catch (error) {
      console.error(`Fehler beim Bearbeiten des Quiz:`, error);
    }
  };

  // Alle Fragen des Quiz abrufen
  const fetchAllQuestions = async (quizId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/quiz/${quizId}/questions`, {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) { 
        const data = await response.json(); 
        console.error(data.detail);
        return; 
      }

      const data = await response.json();
      setQuestions(data);

    } catch (error) {
      console.error(`Fehler beim Abrufen der Fragen:`, error);
    }
  };

  // Neue Frage hinzufügen
  const handleAddQuestion = async (questionText: string, questionType: string) => {
    try {
      const formData = new FormData();
      formData.append("quiz_id", editelement?.id.toString() || "");
      formData.append("question_text", questionText);
      formData.append("typ", questionType);

      const response = await fetch("http://localhost:8000/quiz/add-question", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      setShowQuestionError(true);

      if (!response.ok) { 
        const data = await response.json(); 
        setErrorColor("red");
        setErrorMessage(response.status === 409 || response.status === 401 ? data.detail : "Serverfehler – bitte erneut versuchen");
        console.error(data.detail);
        return; 
      }

      setErrorColor("green");
      setErrorMessage("Änderung wurde vorgenommen");
      await response.json();
      fetchAllQuestions(editelement?.id.toString() || "");

    } catch (error) {
      console.error(`Fehler beim Hinzufügen der Frage:`, error);
    }
  };

  // Frage löschen
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const formData = new FormData();
      formData.append("question_id", questionId);

      const response = await fetch(`http://localhost:8000/quiz/delete-question`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) { 
        const data = await response.json(); 
        console.error(`Fehler beim Löschen der Frage`);
        return; 
      }

      await response.json();
      fetchAllQuestions(editelement?.id.toString() || "");

    } catch (error) {
      console.error(`Fehler beim Löschen der Frage:`, error);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div> 
      {/* Navigation zwischen Quiz- und Fragenbereich */}
      <div class="div-buttons">
        <button onClick={() => { setShowQuizError(false); setShowQuestions(false); }}>Quiz</button>
        <button onClick={() => { fetchAllQuestions(editelement?.id.toString() || ""); setShowQuestionError(false); setShowQuestions(true); }}>Fragen</button>
      </div>

      {/* Fragenbereich */}
      {showQuestions && 
        <div> 
          {showQuestionError && (
            <span style={{ color: errorColor || "red" }}>
              {errorMessage}
            </span>
          )}

          <div class="box">
            <h3 style={{textAlign: "center"}}>Frage erstellen</h3>

            {/* Neue Frage */}
            <div class="form-row">
              <label>Frage:</label>
              <input type="text" maxLength={50} onInput={(e) => setNewQuestionText((e.target as HTMLInputElement).value || "")}></input>
            </div>

            <div class="form-row">
              <label>Typ:</label>
              <select value={questionTypeSelect} onChange={(e) => setQuestionTypeSelect((e.target as HTMLSelectElement).value)}>
                <option value="Multiple choice">Multiple choice</option>
                <option value="Wahr/Falsch">Wahr/Falsch</option>
                <option value="Text Antwort">Text Antwort</option>
              </select>
            </div>

            <button class="myButton" 
              onClick={() => handleAddQuestion(newQuestionText, questionTypeSelect)} 
              disabled={newQuestionText.trim() === ""}
            >
              hinzufügen
            </button>
          </div>

          {/* Liste aller Fragen */}
          <table>
            <tbody>
              {questions.map(q => (
                <tr key={q.id}>
                  <td>
                    <div class="box">
                      <div class="form-row">
                        <button class="myButton" onClick={() => handleDeleteQuestion(q.id.toString())}>X</button>
                      </div>
                      <Question editelement={q}></Question>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }

      {/* Quiz bearbeiten Bereich */}
      {!showQuestions &&
        <form>
          {showQuizError && (
            <span style={{ color: errorColor || "red" }}>
              {errorMessage}
            </span>
          )}

          <div class="form-row">
            <label>Name:</label>
            <input type="text" maxLength={50} defaultValue={quizName} onInput={(e) => setQuizName((e.target as HTMLInputElement).value || "")}></input>
          </div>

          <div class="form-row">
            <label>Maximale Zeit in min {"(leer lassen für kein Limit)"}:</label>
            <input type="number" step="0.1" defaultValue={quizTime ? quizTime/60 : ""} onInput={(e) => { const value = (e.target as HTMLInputElement).value; setQuizTime(value === "" ? -1 : Number(value)); }}/>
          </div>

          <div class="form-row">
            <label>Sichtbarkeit:</label>
            <div>
              <label>
                <input 
                  type="radio" 
                  name="public" 
                  value="false" 
                  checked={selectedPublic === "false"} 
                  onChange={(e) => setSelectedPublic((e.target as HTMLInputElement).value || "")}
                /> 
                Privat
              </label>

              <label>
                <input 
                  type="radio" 
                  name="public" 
                  value="true" 
                  checked={selectedPublic === "true"} 
                  onChange={(e) => setSelectedPublic((e.target as HTMLInputElement).value || "")}
                /> 
                Öffentlich
              </label>
            </div>
          </div>

          <button type="button" class="myButton" onClick={(e) => { e.preventDefault(); handleEditQuiz(); }} disabled={quizName.trim() === ""}>Absenden</button>
        </form>
      }
    </div> 
  ); 
}
