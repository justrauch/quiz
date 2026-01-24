import { useState, useEffect } from 'preact/hooks';
import { Question } from './Question';

interface Quiz { 
    id: number; 
    name: string; 
    is_public: boolean; 
    creater: number; 
    time: number;
} 

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

interface StartQuizProps { 
    editelement: Quiz | undefined; 
    is_public: boolean;
} 

export function StartQuiz({ editelement, is_public}: StartQuizProps) { 

/* ---------------- Quiz-Status ---------------- */
const [quizStarted, setQuizStarted] = useState(false);
const [quizEnded, setQuizEnded] = useState(false);
const [score, setScore] = useState(0);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [questionNotAnswered, setQuestionNotAnswered] = useState(true);
const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);

/* ---------------- Timer / Zeit ---------------- */
const [remainingTime, setRemainingTime] = useState(editelement?.time || -1);
const [formattedTime, setFormattedTime] = useState("--:--");
const [countdownStarted, setCountdownStarted] = useState(false);

/* ---------------- Fragen & Antworten ---------------- */
const [questions, setQuestions] = useState<Question[]>([]);
const [answers, setAnswers] = useState<Answer[]>([]);
const [textAnswerInput, setTextAnswerInput] = useState("");


  /* ---------------- Countdown ---------------- */
  useEffect(() => {
    if (remainingTime < 0 || !countdownStarted) return;

    // Zeit abgelaufen
    if (remainingTime === 0) {
      handleAddScore(
        editelement?.id.toString() || "",
        (questions.length > 0 ? (score / questions.length) * 100 : 0).toString()
      );
      setQuizEnded(true);
      return;
    }

    const interval = setInterval(() => {
      setRemainingTime(t => t - 1);
      setFormattedTime(
        `${Math.floor(remainingTime / 60)}:${remainingTime % 60 < 10 ? "0" + (remainingTime % 60).toString() : remainingTime % 60}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [countdownStarted, remainingTime]);

  /* ---------------- Daten vom Backend ---------------- */
  // Antworten einer Frage abrufen
  const fetchAnswersForQuestion = async (questionId: string) => {
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

  // Fragen des Quiz abrufen
  const fetchQuestionsForQuiz = async (quizId: string) => {
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

  // Score an Backend senden
  const handleAddScore = async (quizId: string, scoreValue: string) => {
    try {
      if(!is_public){
        return; // Privat-Quiz -> Score nicht senden
      }

      const formData = new FormData();
      formData.append("quiz_id", quizId);
      formData.append("score", scoreValue);

      const response = await fetch(`http://localhost:8000/user/quiz/score/add-score`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) { 
        const data = await response.json(); 
        console.error(data.detail);
        return; 
      }

      await response.json();
      setCountdownStarted(false);

    } catch (error) {
      console.error(`Fehler beim Senden des Scores:`, error);
    }
  };

  /* ---------------- Effekte ---------------- */
  // Quizfragen laden, wenn Quiz ausgewählt wird
  useEffect(() => {
    if (editelement?.id) {
      fetchQuestionsForQuiz(editelement.id.toString());
    }
  }, [editelement?.id]);

  // Antworten laden, wenn aktuelle Frage sich ändert
  useEffect(() => {
    const questionId = questions.at(currentQuestionIndex)?.id;
    if (questionId) {
      fetchAnswersForQuestion(questionId.toString());
    }
  }, [questions, currentQuestionIndex]);

  /* ---------------- UI ---------------- */
  return ( 
    <div id="quiz-container">
      {/* ---------------- Quiz Starten ---------------- */}
      {!quizStarted && <div id="quiz-start">
        <p id="quiz-warning">
          Warnungen bitte lesen:<br/>
          <ul id="quiz-warning-list" style={{marginLeft: 2}}>
            <li id="warning-answers">Antworten können nach Bestätigung nicht mehr geändert werden.</li>
            <li id="warning-no-back">Nach Klick auf "Weiter" oder "Resultat senden" kann nicht zurückgegangen werden.</li>
            {remainingTime >= 0 && <li id="warning-time">Zum Beantworten der Fragen haben Sie nur <b id="time-remaining">{`${Math.floor(remainingTime / 60)}:${remainingTime % 60 < 10 ? "0" + (remainingTime % 60).toString() : remainingTime % 60}`}</b> min Zeit.</li>}
          </ul>
          Willst du das Quiz <b id="quiz-name">{editelement?.name}</b> starten?
        </p> 
        <button id="start-quiz-button" onClick={() => {setQuizStarted(true); setCountdownStarted(true);}}>Start</button>
      </div>} 

      {/* ---------------- Quiz Ende ---------------- */}
      {quizEnded && <div id="quiz-end">
        <p id="quiz-result">
          Resultat <b id="result-score">{questions.length > 0 ? Math.round(((score / questions.length) * 100) * 100) / 100 : 0}%</b> wurde gesendet!
        </p>
      </div>}

      {/* ---------------- Aktuelle Frage anzeigen ---------------- */}
      {quizStarted && !quizEnded && <div id="quiz-question-section">
        <div class="box" id="question-box">
          <p id="timer" style={{textAlign: "right"}}>{formattedTime}</p>
          <h3 id="question-type" style={{textAlign: "center"}}>{questions.at(currentQuestionIndex)?.typ}</h3>
          <p id="question-text">{questions.at(currentQuestionIndex)?.text}</p>

          {/* Multiple Choice Antworten */}
          {questions.at(currentQuestionIndex)?.typ !== "Text Antwort" && <div id="multiple-choice-answers">
            {answers.map(a => (
              <div class="form-row box" id={`answer-row-${a.id}`}>
                <button id={`answer-button-${a.id}`} onClick={() => {
                  setScore(score + (questionNotAnswered && a.is_true ? 1 : 0));
                  setQuestionNotAnswered(false);
                  setIsAnswerCorrect(a.is_true);
                  setShowAnswerFeedback(true);
                }}>{a.text}</button>
              </div>
            ))}
          </div>}

          {/* Text Antworten */}
          {questions.at(currentQuestionIndex)?.typ === "Text Antwort" && <div id="text-answer-section"> 
            <div class="form-row" id="text-answer-row">
              <label id="text-answer-label">Antwort:</label>
              <input id="text-answer-input" type="text" maxLength={50} onInput={(e) => setTextAnswerInput((e.target as HTMLInputElement).value || "")}/>
            </div>
            <button id="text-answer-submit" onClick={() => {
              setScore(score + (questionNotAnswered && answers.length === 1 && answers.at(0)?.text === textAnswerInput ? 1 : 0));
              setQuestionNotAnswered(false);
              setIsAnswerCorrect(answers.at(0)?.text === textAnswerInput);
              setShowAnswerFeedback(true);
            }}>Lösen</button>
          </div>}

          {/* Feedback zur Antwort */}
          {showAnswerFeedback && <div id="answer-feedback">
            {isAnswerCorrect && (<span id="feedback-correct" style={{ color: "green" }}>Frage richtig beantwortet</span>)}
            {!isAnswerCorrect && (<span id="feedback-wrong" style={{ color: "red" }}>Frage falsch beantwortet</span>)}
          </div>}

          {/* Buttons für Weiter oder Resultat senden */}
          {questions.length - 1 <= currentQuestionIndex && 
            <button id="submit-result-button" onClick={() => {
              handleAddScore(editelement?.id.toString() || "", 
                (questions.length > 0 ? Math.round(((score / questions.length) * 100) * 100) / 100 : 0).toString()
              ); 
              setQuizEnded(true);
            }}>Resultat senden</button>
          }
          {questions.length - 1 > currentQuestionIndex &&
            <button id="next-question-button" onClick={() => {
              setCurrentQuestionIndex(currentQuestionIndex + 1);
              setQuestionNotAnswered(true);
              setShowAnswerFeedback(false);
            }}>Weiter</button>
          }
        </div>
      </div>}
    </div>
  );
}
