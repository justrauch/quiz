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

interface EditQuizProps { 
    editelement: Question | undefined; 
} 

export function Question({ editelement }: EditQuizProps) { 
    const [q_name, setq_Name] = useState(editelement?.text);
    const [q_typ, setq_typ] = useState(editelement?.typ);
    const [a_name, seta_Name] = useState("");
    const [answers, setanswers] = useState<Answer[]>([]);
    const [selectedTrue, setselectedTrue] = useState(editelement?.typ == "Text Antwort" ? "true" : "false");
    const [showerroransw, seterroransw] = useState(false);
    const [errormessageansw, seterrormessageansw] = useState("");
    const [errorcolor, seterrorcolor] = useState("rot");
    const [showerrorquest, seterrorquest] = useState(false);
    const [errormessagequest, seterrormessagequest] = useState("");
    const [errorcolorquest, seterrorcolorquest] = useState("rot");

    const handleaddanswer = async (question_id: string, answer_text: string, is_true: string) => {
      try {
        const formData = new FormData();
        formData.append("question_id", question_id);
        formData.append("answer_text", editelement?.typ == "Wahr/Falsch" ? "Wahr" : answer_text);
        formData.append("is_true", is_true);
        formData.append("typ", editelement?.typ.toString() || "");
        const response = await fetch("http://localhost:8000/quiz/question/add-answer", {
          method: "POST",
          body: formData,
          credentials: "include"
        })

        seterroransw(true);

        if (!response.ok) { 
            const data = await response.json(); 
            seterrorcolor("red")
            seterrormessageansw(response.status === 409 || response.status === 401 ? data.detail : "Server Error versuchen sie es erneut");
            console.error(data.detail);
            return; 
        }

        seterrorcolor("green");
        seterrormessageansw("Änderung wurde vorgenommen")
        const data = await response.json();
        handlegetallanswers(editelement?.id.toString() || "");

      } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
      }
    };

    const handlegetallanswers = async (question_id: string) => {
        try {
        const response = await fetch(`http://localhost:8000/quiz/question/${question_id}/answers`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) { 
            const data = await response.json(); 
            console.error(data.detail);
            return; 
        }

        const data = await response.json();
        setanswers(data);

        } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
        }
    };

    const handledelete = async (answer_id: string) => {
        try {
        const formData = new FormData();
        formData.append("answer_id", answer_id);
        const response = await fetch(`http://localhost:8000/quiz/question/delete-answer`, {
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
        handlegetallanswers(editelement?.id.toString() || "");

        } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
        }
    };

    const handleeditquestion = async (quiz_id : string, question_text: string, questions_type: string) => {
      try {
        const formData = new FormData();
        formData.append("question_id", editelement?.id.toString() || "");
        formData.append("question_text", question_text);
        formData.append("typ", questions_type);
        const response = await fetch("http://localhost:8000/quiz/edit-question", {
          method: "POST",
          body: formData,
          credentials: "include"
        })

        seterrorquest(true);

        if (!response.ok) { 
            const data = await response.json(); 
            seterrorcolorquest("red")
            seterrormessagequest(response.status === 409 || response.status === 401 ? data.detail : "Server Error versuchen sie es erneut");
            console.error(data.detail);
            return; 
        }

        seterrorcolorquest("green");
        seterrormessagequest("Änderung wurde vorgenommen")
        const data = await response.json();

      } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
      }
    };

    useEffect(() => {
        if (editelement?.id) {
            handlegetallanswers(editelement.id.toString());
        }
    }, [editelement?.id]);

    return ( 
        <div> 
            <div>
                <button class = "myButton" onClick={() => {handleeditquestion(editelement?.id.toString() || "",q_name || "",q_typ || "")}} disabled = {q_name === ""}>#</button>
            </div>
            <h3 style="text-align: center;">{editelement?.typ}</h3>
            {showerrorquest && (
                    <span style={{ color: errorcolorquest || "red" }}>
                    {errormessagequest}
                    </span>
            )}
            <input class = "input-full" type="text" id="name" name="name" maxlength={50} defaultValue = {q_name} onInput={(e) => setq_Name((e.target as HTMLInputElement).value || "")}></input>
            {answers.map(a => (
                <div class = "form-row box">
                    <p>{a.text} ({a.is_true ? "Wahr" : "Falsch"})</p>
                    <button onClick={() => handledelete(a.id.toString())}>X</button>
                </div>
            ))}
            <div class = "box">
                <h3 style = "text-align: center"> Anwort hinzufügen</h3>
                {showerroransw && (
                    <span style={{ color: errorcolor || "red" }}>
                    {errormessageansw}
                    </span>
                )}
                {editelement?.typ != "Wahr/Falsch" && <div class="form-row">
                    <label htmlFor="name">Antwort:</label>
                    <input type="text" id="name" name="name" maxlength={50} onInput={(e) => seta_Name((e.target as HTMLInputElement).value || "")}></input>
                </div>}
                    <div class="form-row">
                    <label htmlFor="name">Richtigkeit:</label>
                    <div>
                    {editelement?.typ != "Text Antwort" && <label>
                        <input 
                        type="radio" 
                        name={`public-${editelement?.id}`} 
                        value="false" 
                        checked={selectedTrue === "false"} 
                        onChange={(e) => setselectedTrue((e.target as HTMLInputElement).value || "")}
                        /> 
                        Falsch
                    </label>}

                    <label>
                        <input 
                        type="radio" 
                        name={`public-${editelement?.id}`}
                        value="true" 
                        checked={selectedTrue === "true"} 
                        onChange={(e) => setselectedTrue((e.target as HTMLInputElement).value || "")}
                        /> 
                        Wahr
                    </label>
                    </div>
                </div>
                <button style="  display: block; margin-left: auto;" onClick={() => {handleaddanswer(editelement?.id.toString() || "", a_name, selectedTrue)}} disabled={ editelement?.typ != "Wahr/Falsch" && a_name.trim() === ""}>hinzufügen</button>
            </div>
        </div> 
    ); 
}