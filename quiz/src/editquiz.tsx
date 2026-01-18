import { useState } from 'preact/hooks';
import { Question } from './Question';

interface Quiz { 
    id: number; 
    name: string; 
    is_public: boolean; 
    creater: number; 
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

        seterroraddquiz(true);

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

    return (
        <div> 
            <div class="div-buttons">
              <button onClick={() => { seterroraddquiz(false); setshowquestions(false); }}>Quiz</button>
              <button onClick={() => { seterroraddquest(false); handlegetallquestions(editelement?.id.toString() || ""); setshowquestions(true); }}>Questions</button>
            </div>
            {showquestions && 
              <div> 
                {showerrorquest && (
                    <span style={{ color: errorcolor || "red" }}>
                    {errormessageaddquiz}
                    </span>
                )}
                <div class="form-row">
                  <label htmlFor="name">Frage:</label>
                  <input type="text" id="name" name="name" maxlength={50} onInput={(e) => setquest_Name((e.target as HTMLInputElement).value || "")}></input>
                </div>
                    <select
                      value={selectvalue}
                      onChange={(e) => setselectvalue((e.target as HTMLSelectElement).value)}
                    >
                      <option value="Multiple choice">Multiple choice</option>
                      <option value="Wahr/Falsch">Wahr/Falsch</option>
                      <option value="Text Antwort">Text Antwort</option>
                    </select>
                <button onClick={() => {handleaddquestion(quest_name, selectvalue);}}>Absenden</button>
                  <table>
                    <tbody>
                    {questions.map(q => (
                      <tr>
                        <td>
                          <Question editelement={q}></Question>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>}
            {!showquestions &&
            <form>
              {showerror && (
                <span style={{ color: errorcolor || "red" }}>
                {errormessageaddquiz}
                </span>
              )}
              <div class="form-row">
                <label htmlFor="name">Name:</label>
                <input type="text" id="name" name="name" maxlength={50} defaultValue = {editelement?.name} onInput={(e) => setq_Name((e.target as HTMLInputElement).value || "")}></input>
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