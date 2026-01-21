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

interface Question { 
    id: number; 
    text: string; 
    typ: string; 
} 

interface EditQuizProps { 
    editelement: Quiz | undefined; 
} 

export function EditQuiz({ editelement }: EditQuizProps) { 

    const [q_name, setq_Name] = useState(editelement?.name || "");
    const [q_time, setq_time] = useState(editelement?.time ? (editelement.time >= 0 ? editelement.time : undefined) : undefined);
    const [quest_name, setquest_Name] = useState(editelement?.name || "");
    const [selectedPublic, setSelectedPublic] = useState(editelement?.is_public ? "true" : "false");
    const [showerror, seterroraddquiz] = useState(false);
    const [showerrorquest, seterroraddquest] = useState(false);
    const [errormessageaddquiz, seterrormessageaddquiz] = useState("");
    const [errorcolor, seterrorcolor] = useState("rot");
    const [showquestions, setshowquestions] = useState(false);
    const [questions, setquestions] = useState<Question[]>([]);
    const [selectvalue, setselectvalue] = useState("Multiple choice");


    const handleeditquiz = async () => {
        try {
        const formData = new FormData();
        formData.append("quiz_id", editelement?.id.toString() || "");
        formData.append("quiz_name", q_name);
        formData.append("is_public", selectedPublic);
        formData.append("time", (q_time ? (q_time * 60 - (q_time * 60) % 1).toString() : "-1"));
        const response = await fetch(`http://localhost:8000/edit-quiz`, {
            method: "POST",
            body: formData,
            credentials: "include"
        });

        seterroraddquiz(true);

        if (!response.ok) { 
            const data = await response.json(); 
            seterrorcolor("red");
            seterrormessageaddquiz(response.status === 409 || response.status === 401 ? data.detail : "Server Error versuchen sie es erneut");
            console.error(data.detail);
            return; 
        }
        seterrorcolor("green");
        seterrormessageaddquiz("Änderung wurde vorgenommen")
        const data = await response.json();

        } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
        }
    };

    const handlegetallquestions = async (quiz_id: string) => {
        try {
        const response = await fetch(`http://localhost:8000/quiz/${quiz_id}/questions`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) { 
            const data = await response.json(); 
            console.error(data.detail);
            return; 
        }
        const data = await response.json();
        setquestions(data);

        } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
        }
    };

    const handleaddquestion = async (question_text: string, questions_type: string) => {
      try {
        const formData = new FormData();
        formData.append("quiz_id", editelement?.id.toString() || "");
        formData.append("question_text", question_text);
        formData.append("typ", questions_type);
        const response = await fetch("http://localhost:8000/quiz/add-question", {
          method: "POST",
          body: formData,
          credentials: "include"
        })

        seterroraddquest(true);

        if (!response.ok) { 
            const data = await response.json(); 
            seterrorcolor("red");
            seterrormessageaddquiz(response.status === 409 || response.status === 401 ? data.detail : "Server Error versuchen sie es erneut");
            console.error(data.detail);
            return; 
        }
        seterrorcolor("green");
        seterrormessageaddquiz("Änderung wurde vorgenommen")
        const data = await response.json();
        handlegetallquestions(editelement?.id.toString() || "");

      } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
      }
    };

    const handledeletequestion = async (question_id: string) => {
        try {
        const formData = new FormData();
        formData.append("question_id", question_id);
        const response = await fetch(`http://localhost:8000/quiz/delete-question`, {
            method: "POST",
            body: formData,
            credentials: "include"
        });

        if (!response.ok) { 
            const data = await response.json(); 
            console.error(`Fehler beim abfragen`);
            return; 
        }

        const data = await response.json();
        handlegetallquestions(editelement?.id.toString() || "");

        } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
        }
    };

    return (
        <div> 
            <div class="div-buttons">
              <button onClick={() => { seterroraddquiz(false); setshowquestions(false); }}>Quiz</button>
              <button onClick={() => { handlegetallquestions(editelement?.id.toString() || ""); seterroraddquest(false); setshowquestions(true); }}>Questions</button>
            </div>
            {showquestions && 
              <div> 
                {showerrorquest && (
                    <span style={{ color: errorcolor || "red" }}>
                    {errormessageaddquiz}
                    </span>
                )}
                <div class = "box">
                <h3 style="text-align: center">Frage erstellen</h3>
                <div class="form-row">
                  <label htmlFor="name">Frage:</label>
                  <input type="text" id="name" name="name" maxlength={50} onInput={(e) => setquest_Name((e.target as HTMLInputElement).value || "")}></input>
                </div>
                <div class="form-row">
                    <label htmlFor="name">Typ:</label>
                    <select
                      value={selectvalue}
                      onChange={(e) => setselectvalue((e.target as HTMLSelectElement).value)}
                    >
                      <option value="Multiple choice">Multiple choice</option>
                      <option value="Wahr/Falsch">Wahr/Falsch</option>
                      <option value="Text Antwort">Text Antwort</option>
                    </select>
                </div>
                <button class = "myButton" onClick={() => {handleaddquestion(quest_name, selectvalue);}} disabled={ quest_name.trim() === ""}>hinzufügen</button>
                </div>
                  <table>
                    <tbody>
                    {questions.map(q => (
                      <tr>
                        <td>
                          <div class = "box">
                            <div class = "form-row">
                              <button class = "myButton" onClick={() => {handledeletequestion(q.id.toString())}}>X</button>
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
            {!showquestions &&
            <form>
              {showerror && (
                <span style={{ color: errorcolor || "red" }}>
                {errormessageaddquiz}
                </span>
              )}
              <div class="form-row">
                <label htmlFor="name">Name:</label>
                <input type="text" id="name" name="name" maxlength={50} defaultValue = {q_name} onInput={(e) => setq_Name((e.target as HTMLInputElement).value || "")}></input>
              </div>
                <div class="form-row">
                  <label htmlFor="name">Maximal Zeit in s {"(leer lassen für kein Limit)"}:</label>
                  <input type="number" id="time" step="0.1" name="time" defaultValue={q_time} onInput={(e) => {const value = (e.target as HTMLInputElement).value; setq_time(value === "" ? -1 : Number(value));}}/>
                </div>
              <div class="form-row">
                <label htmlFor="name">Sichbarkeit:</label>
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
                    Öffenlich
                  </label>
                </div>
              </div>

              <button type="button" class="myButton" onClick={(e) => {e.preventDefault(); handleeditquiz();}} disabled={ q_name.trim() === ""}>Absenden</button>
            </form>}
        </div> 
    ); 
}