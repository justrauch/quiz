import { useState } from 'preact/hooks';
import { EditQuiz } from './editquiz';

export function Quiz(){

      const [showmyquiz, setshowmyquiz] = useState(false);
      const [showmyedit, setshowmyedit] = useState(false);
    
      const [showmyquizbutton, setshowmyquizbutton] = useState(true);
      const [q_name, setq_Name] = useState("");
      const [selectedPublic, setSelectedPublic] = useState("false");
      const [showerroraddquiz, seterroraddquiz] = useState(false)
      const [errormessageaddquiz, seterrormessageaddquiz] = useState("");
    
      interface Quiz {
        id: number;
        name: string;
        is_public: boolean;
        creater: number;
      }
      const [qiuzzes, setqiuzzes] = useState<Quiz[]>([]);
      const [editelement, seteditelement] = useState<Quiz | undefined>(undefined);

      const handlegetall = async (methode: string) => {
        try {
        const response = await fetch(`http://localhost:8000/${methode}`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) { 
            const data = await response.json(); 
            console.error(`Fehler beim abfragen`);
            return; 
        }

        const data = await response.json();
        setqiuzzes(data);

        } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
        }
    };

    const handleaddquiz = async (name: string) => {
        try {
        seterroraddquiz(false);
        const formData = new FormData();
        formData.append("quiz_name", name);
        formData.append("is_public", selectedPublic);
        const response = await fetch(`http://localhost:8000/add-quiz`, {
            method: "POST",
            body: formData,
            credentials: "include"
        });

        if (!response.ok) { 
            const data = await response.json(); 
            seterrormessageaddquiz(response.status === 409 || response.status === 401 ? data.detail : "Server Error versuchen sie es erneut");
            seterroraddquiz(true);
            console.error(data.detail);
            return; 
        }

        const data = await response.json();
        handlegetall("quiz-get-all-private"); setshowmyquiz(true);

        } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
        }
    };

    const handledelete = async (quiz_id: string) => {
        try {
        const formData = new FormData();
        formData.append("quiz_id", quiz_id);
        const response = await fetch(`http://localhost:8000/delete-quiz`, {
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
        handlegetall("quiz-get-all-private"); setshowmyquiz(true);

        } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
        }
    };
    return (
        <>
        {showmyedit && 
            <div>
                <EditQuiz editelement={editelement}></EditQuiz>
                <button onClick={() => setshowmyedit(false)}>Zurück</button>
            </div>
        }
        {!showmyedit && <div>
            <div class="div-buttons">
            <button onClick={() => { setshowmyquiz(false)}}>Quiz erstellen</button>
            <button onClick={() => { handlegetall("quiz-get-all-private"); setshowmyquiz(true); setshowmyquizbutton(true);}}>Meine Quizze</button>
            <button onClick={() => { handlegetall("quiz-get-all-public"); setshowmyquiz(true); setshowmyquizbutton(false);}}>Öffenliche Quizze</button>
          </div>
          {!showmyquiz &&
          <div>
            <form>
              {showerroraddquiz && (
                <span style={{ color: "red" }}>
                  {errormessageaddquiz}
                </span>
              )}
              <div class="form-row">
                <label htmlFor="name">Name:</label>
                <input type="text" id="name" name="name" maxlength={50} onInput={(e) => setq_Name((e.target as HTMLInputElement).value || "")}/>
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

              <button type="button" class="myButton" onClick={(e) => {e.preventDefault(); handleaddquiz(q_name);}} disabled={ q_name.trim() === ""}>Absenden</button>
            </form>
          </div>}
          {showmyquiz &&
              <div >
                {!showmyquizbutton && <button onClick={() => handlegetall("quiz-get-all-public")}>Neuladen</button>}
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                  {qiuzzes.map(q => (
                    <tr>
                      <td>{q.name}</td>
                      <button>start</button>
                      {showmyquizbutton &&
                      <td>
                        <button onClick={() => {seteditelement(q); setshowmyedit(true);}}>edit</button>
                        <button onClick={() => handledelete(q.id + "")}>delete</button>
                      </td>}
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          }
        </div>}
        </>
    )

}