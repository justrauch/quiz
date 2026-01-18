import { useState } from 'preact/hooks';

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
    const [a_name, seta_Name] = useState("");
    const [answers, setanswers] = useState<Answer[]>([]);

    const handleaddquestion = async (question_id: string, answer_text: string, is_true: string) => {
      try {
        const formData = new FormData();
        formData.append("question_id", question_id);
        formData.append("answer_text", answer_text);
        formData.append("is_true", is_true);
        const response = await fetch("http://localhost:8000/quiz/question/add-answer", {
          method: "POST",
          body: formData,
          credentials: "include"
        })


        if (!response.ok) { 
            const data = await response.json(); 
            console.error(data.detail);
            return; 
        }

        const data = await response.json();

      } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
      }
    };

    const handlegetallquestions = async (question_id: string) => {
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
        handlegetallquestions(editelement?.id.toString() || "");

        } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
        }
    };

    return ( 
        <div> 
            <p>{editelement?.text} {editelement?.typ}</p>
            {answers.map(a => (
                <p>{a.text}</p>
            ))}
            <div class="form-row">
                <label htmlFor="name">Antwort:</label>
                <input type="text" id="name" name="name" maxlength={50} onInput={(e) => seta_Name((e.target as HTMLInputElement).value || "")}></input>
            </div>
            <button onClick={() => {handleaddquestion(editelement?.id.toString() || "", a_name, "false")}}>hinzufügen</button>
        </div> 
    ); 
}