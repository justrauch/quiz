import { useState,useEffect } from 'preact/hooks';
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

      const [showmyquiz, setshowmyquiz] = useState(false);
      const [showquizscore, setshowquizscore] = useState(false);
      const [showmyscores, setshowmyscores] = useState(false);
      const [showmyedit, setshowmyedit] = useState(false);
      const [startmyquiz, setstartmyquiz] = useState(false);
      const [startelement, setstartelement] = useState<Quiz | undefined>(undefined);
      const [is_public, setis_public] = useState(false);
      const [showmyquizbutton, setshowmyquizbutton] = useState(true);
      const [q_name, setq_Name] = useState("");
      const [q_time, setq_time] = useState(-1);
      const [selectedPublic, setSelectedPublic] = useState("false");
      const [showerroraddquiz, seterroraddquiz] = useState(false)
      const [errormessageaddquiz, seterrormessageaddquiz] = useState("");
      const [scores, setScores] = useState<Score[]>([]);
      const [qiuzzes, setqiuzzes] = useState<Quiz[]>([]);
      const [editelement, seteditelement] = useState<Quiz | undefined>(undefined);
      const [filter, setfilter] = useState("");
      const [filteredScores, setfilteredScores] = useState<Score[]>([]);
      const [filterdqiuzzes, setfilterdqiuzzes] = useState<Quiz[]>([]);

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
        setfilterdqiuzzes(data);
        setqiuzzes(data);

        } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
        }
    };

      const handlegetallscores = async () => {
        try {
        setScores([]);
        const response = await fetch(`http://localhost:8000/user/scores`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) { 
            const data = await response.json(); 
            console.error(`Fehler beim abfragen`);
            return; 
        }

        const data = await response.json();
        setfilteredScores(data);
        setScores(data);

        } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
        }
    };

    const handlegetallscoresquiz = async (quiz_id: string) => {
        try {
        setScores([]);
        const response = await fetch(`http://localhost:8000/quiz/${quiz_id}/scores`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) { 
            const data = await response.json(); 
            console.error(`Fehler beim abfragen`);
            return; 
        }

        const data = await response.json();
        setScores(data);
        setfilteredScores(data);

        } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
        }
    };

    const handleaddquiz = async (name: string, time: number) => {
        try {
        seterroraddquiz(false);
        const formData = new FormData();
        formData.append("quiz_name", name);
        formData.append("is_public", selectedPublic);
        formData.append("time", (time * 60 - (time * 60) % 1).toString());
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

    
    const handlelogout = async () => {
      try {
        const response = await fetch(`http://localhost:8000/log-out`, {
          method: "POST",
          credentials: "include"
        });

        if (!response.ok) { 
          const data = await response.json(); 
          console.error(`Fehler beim ausloggen`);
          return; 
        }

        const data = await response.json();
        route("/");

      } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
      }
    };

    return (
        <>
        <button class="myButton" style={{marginBottom: 5}} onClick={handlelogout}>Abmelden</button>
        {showquizscore && 
            <div>
              <div class="form-row">
                <label htmlFor="name">Filter:</label>
                <input
                  type="text"
                  value={filter}
                  onInput={e =>
                    setfilter((e.target as HTMLInputElement).value)
                  }
                />
                <button onClick={() => {setfilteredScores(scores.filter(s =>
                  s.user_name.toLowerCase().includes(filter.toLowerCase()) ||
                  (s.score.toString() + "%").includes(filter)
                ))}}>filtern</button>
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
              <button onClick={() => setshowquizscore(false)}>Zurück</button>
            </div>
        }
        {showmyedit && 
            <div>
                <EditQuiz editelement={editelement}></EditQuiz>
                <button onClick={() => {handlegetall("quiz-get-all-private"); setshowmyedit(false)}}>Zurück</button>
            </div>
        }
        {startmyquiz && 
            <div>
                <StartQuiz editelement={startelement} is_public={is_public}></StartQuiz>
                <button onClick={() => {setstartmyquiz(false); setshowmyscores(false); setshowmyquiz(true); setshowmyquizbutton(!is_public);}}>Zurück zu Meine Quizze</button>
            </div>
        }
        {!showmyedit && !startmyquiz && !showquizscore && <div>
            <div class="div-buttons">
            <button onClick={() => { setshowmyscores(false); setshowmyquiz(false)}}>Quiz erstellen</button>
            <button onClick={() => { setshowmyscores(false); setshowmyquizbutton(true); handlegetall("quiz-get-all-private"); setshowmyquiz(true);}}>Meine Quizze</button>
            <button onClick={() => { setshowmyscores(false); setshowmyquizbutton(false); handlegetall("quiz-get-all-public"); setshowmyquiz(true);}}>Öffenliche Quizze</button>
            <button onClick={() => { handlegetallscores(); setshowmyscores(true); setshowmyquiz(false);}}>Meine Scores</button>
          </div>
          {!showmyquiz && showmyscores && <div>
              <div class="form-row">
                <label htmlFor="name">Filter:</label>
                <input
                  type="text"
                  value={filter}
                  onInput={e =>
                    setfilter((e.target as HTMLInputElement).value)
                  }
                />
               <button onClick={() => {setfilteredScores(scores.filter(s =>
                  s.quiz_name.toLowerCase().includes(filter.toLowerCase()) ||
                  (s.score.toString() + "%").includes(filter)
                ))}}>filtern</button>
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
          {!showmyquiz && !showmyscores &&
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
                <label htmlFor="name">Maximal Zeit in min {"(leer lassen für kein Limit)"}:</label>
                <input type="number" id="time" name="time" onInput={(e) => {const value = (e.target as HTMLInputElement).value; setq_time(value === "" ? -1 : Number(value));}}/>
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
              <button type="button" class="myButton" onClick={(e) => {e.preventDefault(); handleaddquiz(q_name, q_time);}} disabled={ q_name.trim() === ""}>Absenden</button>
            </form>
          </div>}
          {showmyquiz &&
              <div >
                {!showmyquizbutton && <button onClick={() => handlegetall("quiz-get-all-public")}>Neuladen</button>}
                <div class="form-row">
                <label htmlFor="name">Filter:</label>
                <input
                  type="text"
                  value={filter}
                  onInput={e =>
                    setfilter((e.target as HTMLInputElement).value)
                  }
                />
                <button onClick={() => {setfilterdqiuzzes(qiuzzes.filter(q =>
                  q.name.toLowerCase().includes(filter.toLowerCase())))}}>filtern</button>
              </div>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                  {filterdqiuzzes.map(q => (
                    <tr>
                      <td>{q.name}</td>
                      <button onClick={() => {setstartelement(q); setstartmyquiz(true); setshowmyquiz(false); setis_public(!showmyquizbutton); setshowmyquizbutton(false);}}>{showmyquizbutton ? "test" : "start"}</button>
                      {!showmyquizbutton && <button onClick={() => {handlegetallscoresquiz(q.id.toString()); setshowquizscore(true)}}>Scores</button>}
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