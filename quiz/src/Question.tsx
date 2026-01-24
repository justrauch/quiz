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
    <div id={`edit-question-container-${editelement?.id.toString() || ""}`}> 
      {/* Frage bearbeiten */}
      <div id={`edit-question-header-${editelement?.id.toString() || ""}`}>
        <button 
          id={`edit-question-button-${editelement?.id.toString() || ""}`}
          class="myButton" 
          onClick={() => handleEditQuestion(editelement?.id.toString() || "", questionText || "", questionType || "")} 
          disabled={questionText === ""}
        >
          #
        </button>
      </div>

      <h3 id={`question-type-header-${editelement?.id.toString() || ""}`} style={{textAlign: "center"}}>{editelement?.typ}</h3>
      {showQuestionError && (
        <span id={`question-error-${editelement?.id.toString() || ""}`} style={{ color: questionErrorColor || "red" }}>
          {questionErrorMessage}
        </span>
      )}
      <input 
        id={`question-input-${editelement?.id.toString() || ""}`}
        class="input-full" 
        type="text" 
        maxLength={50} 
        defaultValue={questionText} 
        onInput={(e) => setQuestionText((e.target as HTMLInputElement).value || "")}
      />

      {/* Antworten anzeigen */}
      {answers.map(a => (
        <div class="form-row box" id={`answer-row-${editelement?.id.toString() || ""}-${a.id}`}>
          <p id={`answer-text-${editelement?.id.toString() || ""}-${a.id}`}>{a.text} ({a.is_true ? "Wahr" : "Falsch"})</p>
          <button id={`delete-answer-button-${editelement?.id.toString() || ""}-${a.id}`} onClick={() => handleDeleteAnswer(a.id.toString())}>X</button>
        </div>
      ))}

      {/* Neue Antwort hinzufügen */}
      <div class="box" id={`add-answer-section-${editelement?.id.toString() || ""}`}>
        <h3 id={`add-answer-header-${editelement?.id.toString() || ""}`} style={{textAlign: "center"}}>Antwort hinzufügen</h3>
        {showAnswerError && (
          <span id={`answer-error-${editelement?.id.toString() || ""}`} style={{ color: answerErrorColor || "red" }}>
            {answerErrorMessage}
          </span>
        )}

        {/* Antworttext, außer bei Wahr/Falsch-Fragen */}
        {editelement?.typ !== "Wahr/Falsch" && <div class="form-row" id={`new-answer-text-row-${editelement?.id.toString() || ""}`}>
          <label id={`new-answer-label-${editelement?.id.toString() || ""}`}>Antwort:</label>
          <input 
            id={`new-answer-input-${editelement?.id.toString() || ""}`}
            type="text" 
            maxLength={50} 
            onInput={(e) => setNewAnswerText((e.target as HTMLInputElement).value || "")}
          />
        </div>}

        {/* Richtigkeit auswählen */}
        <div class="form-row" id={`new-answer-correctness-row-${editelement?.id.toString() || ""}`}>
          <label id={`correctness-label-${editelement?.id.toString() || ""}`}>Richtigkeit:</label>
          <div id={`correctness-options-${editelement?.id.toString() || ""}`}>
            {editelement?.typ !== "Text Antwort" && <label id={`correct-false-label-${editelement?.id.toString() || ""}`}>
              <input 
                id={`correct-false-radio-${editelement?.id.toString() || ""}`}
                type="radio" 
                name={`correct-${editelement?.id.toString() || ""}`} 
                value="false" 
                checked={selectedAnswerCorrect === "false"} 
                onChange={(e) => setSelectedAnswerCorrect((e.target as HTMLInputElement).value || "")}
              /> 
              Falsch
            </label>}

            <label id={`correct-true-label-${editelement?.id.toString() || ""}`}>
              <input 
                id={`correct-true-radio-${editelement?.id.toString() || ""}`}
                type="radio" 
                name={`correct-${editelement?.id.toString() || ""}`}
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
          id={`add-answer-button-${editelement?.id.toString() || ""}`}
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
