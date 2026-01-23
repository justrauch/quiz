import { useState, useEffect } from 'preact/hooks';
import './app.css'

interface Question { 
    id: number; 
    text: string; 
    typ: string; 
} 

interface Answer { 
    id: number; 
    text: string; 
    question_id: number;
    is_true: boolean; 
}

interface QuestionEditorProps { 
    editelement: Question | undefined; 
} 

export function Question({ editelement }: QuestionEditorProps) { 

    /* ---------------- Frage ---------------- */
    const [questionText, setQuestionText] = useState(editelement?.text);
    const [questionType, setQuestionType] = useState(editelement?.typ);

    /* ---------------- Antworten ---------------- */
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [newAnswerText, setNewAnswerText] = useState("");
    const [selectedAnswerCorrect, setSelectedAnswerCorrect] = useState(editelement?.typ === "Text Antwort" ? "true" : "false");

    /* ---------------- Fehler / Feedback ---------------- */
    const [showAnswerError, setShowAnswerError] = useState(false);
    const [answerErrorMessage, setAnswerErrorMessage] = useState("");
    const [answerErrorColor, setAnswerErrorColor] = useState("red");

    const [showQuestionError, setShowQuestionError] = useState(false);
    const [questionErrorMessage, setQuestionErrorMessage] = useState("");
    const [questionErrorColor, setQuestionErrorColor] = useState("red");


  /* ---------------- Backend-Funktionen ---------------- */
  // Neue Antwort hinzufügen
  const handleAddAnswer = async (questionId: string, answerText: string, isTrue: string) => {
    try {
      const formData = new FormData();
      formData.append("question_id", questionId);
      formData.append("answer_text", editelement?.typ === "Wahr/Falsch" ? "Wahr" : answerText);
      formData.append("is_true", isTrue);
      formData.append("typ", editelement?.typ.toString() || "");

      const response = await fetch("http://localhost:8000/quiz/question/add-answer", {
        method: "POST",
        body: formData,
        credentials: "include"
      })

      setShowAnswerError(true);

      if (!response.ok) { 
        const data = await response.json(); 
        setAnswerErrorColor("red");
        setAnswerErrorMessage(response.status === 409 || response.status === 401 ? data.detail : "Serverfehler – bitte erneut versuchen");
        console.error(data.detail);
        return; 
      }

      setAnswerErrorColor("green");
      setAnswerErrorMessage("Änderung wurde vorgenommen");
      await response.json();
      fetchAllAnswers(editelement?.id.toString() || "");

    } catch (error) {
      console.error(`Fehler beim Hinzufügen der Antwort:`, error);
    }
  };

  // Alle Antworten der Frage abrufen
  const fetchAllAnswers = async (questionId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/quiz/question/${questionId}/answers`, {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) { 
        const data = await response.json(); 
        console.error(data.detail);
        return; 
      }

      const data = await response.json();
      setAnswers(data);

    } catch (error) {
      console.error(`Fehler beim Abrufen der Antworten:`, error);
    }
  };

  // Antwort löschen
  const handleDeleteAnswer = async (answerId: string) => {
    try {
      const formData = new FormData();
      formData.append("answer_id", answerId);

      const response = await fetch(`http://localhost:8000/quiz/question/delete-answer`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) { 
        const data = await response.json(); 
        console.error(`Fehler beim Löschen der Antwort`);
        return; 
      }

      await response.json();
      fetchAllAnswers(editelement?.id.toString() || "");

    } catch (error) {
      console.error(`Fehler beim Löschen der Antwort:`, error);
    }
  };

  // Frage bearbeiten
  const handleEditQuestion = async (quizId: string, questionText: string, questionType: string) => {
    try {
      const formData = new FormData();
      formData.append("question_id", editelement?.id.toString() || "");
      formData.append("question_text", questionText);
      formData.append("typ", questionType);

      const response = await fetch("http://localhost:8000/quiz/edit-question", {
        method: "POST",
        body: formData,
        credentials: "include"
      })

      setShowQuestionError(true);

      if (!response.ok) { 
        const data = await response.json(); 
        setQuestionErrorColor("red");
        setQuestionErrorMessage(response.status === 409 || response.status === 401 ? data.detail : "Serverfehler – bitte erneut versuchen");
        console.error(data.detail);
        return; 
      }

      setQuestionErrorColor("green");
      setQuestionErrorMessage("Änderung wurde vorgenommen");
      await response.json();

    } catch (error) {
      console.error(`Fehler beim Bearbeiten der Frage:`, error);
    }
  };

  /* ---------------- Effekte ---------------- */
  // Antworten laden, wenn Frage gesetzt wird
  useEffect(() => {
    if (editelement?.id) {
      fetchAllAnswers(editelement.id.toString());
    }
  }, [editelement?.id]);

  /* ---------------- UI ---------------- */
  return ( 
    <div> 
      {/* Frage bearbeiten */}
      <div>
        <button class="myButton" 
          onClick={() => handleEditQuestion(editelement?.id.toString() || "", questionText || "", questionType || "")} 
          disabled={questionText === ""}>#</button>
      </div>

      <h3 style={{textAlign: "center"}}>{editelement?.typ}</h3>
      {showQuestionError && (
        <span style={{ color: questionErrorColor || "red" }}>
          {questionErrorMessage}
        </span>
      )}
      <input 
        class="input-full" 
        type="text" 
        maxLength={50} 
        defaultValue={questionText} 
        onInput={(e) => setQuestionText((e.target as HTMLInputElement).value || "")}
      />

      {/* Antworten anzeigen */}
      {answers.map(a => (
        <div class="form-row box">
          <p>{a.text} ({a.is_true ? "Wahr" : "Falsch"})</p>
          <button onClick={() => handleDeleteAnswer(a.id.toString())}>X</button>
        </div>
      ))}

      {/* Neue Antwort hinzufügen */}
      <div class="box">
        <h3 style={{textAlign: "center"}}>Antwort hinzufügen</h3>
        {showAnswerError && (
          <span style={{ color: answerErrorColor || "red" }}>
            {answerErrorMessage}
          </span>
        )}

        {/* Antworttext, außer bei Wahr/Falsch-Fragen */}
        {editelement?.typ !== "Wahr/Falsch" && <div class="form-row">
          <label>Antwort:</label>
          <input type="text" maxLength={50} onInput={(e) => setNewAnswerText((e.target as HTMLInputElement).value || "")}/>
        </div>}

        {/* Richtigkeit auswählen */}
        <div class="form-row">
          <label>Richtigkeit:</label>
          <div>
            {editelement?.typ !== "Text Antwort" && <label>
              <input 
                type="radio" 
                name={`correct-${editelement?.id}`} 
                value="false" 
                checked={selectedAnswerCorrect === "false"} 
                onChange={(e) => setSelectedAnswerCorrect((e.target as HTMLInputElement).value || "")}
              /> 
              Falsch
            </label>}

            <label>
              <input 
                type="radio" 
                name={`correct-${editelement?.id}`}
                value="true" 
                checked={selectedAnswerCorrect === "true"} 
                onChange={(e) => setSelectedAnswerCorrect((e.target as HTMLInputElement).value || "")}
              /> 
              Wahr
            </label>
          </div>
        </div>

        {/* Button zum Hinzufügen */}
        <button 
          style={{ display: "block", marginLeft: "auto" }} 
          onClick={() => handleAddAnswer(editelement?.id.toString() || "", newAnswerText, selectedAnswerCorrect)}
          disabled={editelement?.typ !== "Wahr/Falsch" && newAnswerText.trim() === ""}
        >
          hinzufügen
        </button>
      </div>
    </div> 
  ); 
}
