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

interface EditQuizProps { 
    editelement: Quiz | undefined; 
    is_public: boolean;
} 

export function StartQuiz({ editelement, is_public}: EditQuizProps) { 

    const [start, setstart] = useState(false);
    const [end, setend] = useState(false);
    const [notanswerd, setnotanswerd] = useState(true);
    const [at, setat] = useState(0);
    const [time, settime] = useState(editelement?.time || -1);
    const [stime, setstime] = useState("--:--");
    const [tainput, settainput] = useState("");
    const [countdownstarted, setcountdownstarted] = useState(false);
    const [score, setscore] = useState(0);
    const [is_correct, setis_correct] = useState(false);
    const [showcorrect, setshowcorrect] = useState(false);
    const [questions, setquestions] = useState<Question[]>([]);
    const [answers, setanswers] = useState<Answer[]>([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);

    useEffect(() => {
        if (time < 0 || !countdownstarted) return;

        if (time == 0) {
            handleaddscore(
                editelement?.id.toString() || "",
                (questions.length > 0 ? (score / questions.length) * 100 : 0).toString()
            );
            setend(true);
            return;
        }

        const interval = setInterval(() => {
            settime(t => t - 1);
            setstime(((time/60 - ((time/60) % 1))).toString() + ":" + (time % 60 < 10 ? "0" + (time % 60).toString() : (time % 60).toString()));
        }, 1000);

        return () => clearInterval(interval);
    }, [countdownstarted, time]);

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

    const handleaddscore = async (quiz_id: string, score: string) => {
        try {
        if(!is_public){
            return;
        }
        const formData = new FormData();
        formData.append("quiz_id", quiz_id);
        formData.append("score", score);
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

        const data = await response.json();
        setcountdownstarted(false);

        } catch (error) {
        console.error(`Fehler beim ausloggen:`, error);
        }
    };

    useEffect(() => {
        if (editelement?.id) {
            handlegetallquestions(editelement.id.toString());
        }
    }, [editelement?.id]);

    useEffect(() => {
        const qid = questions.at(at)?.id;
        if (qid) {
            handlegetallanswers(qid.toString());
        }
    }, [questions, at]);

    return ( 
        <div>
            {!(start) && <div> 
                <p>
                    Warnungen bitte lesen:<br></br>
                    <ul style={{marginLeft: 2}}>
                        <li>Wenn man geantwortet hat kann man nicht mehr korrigieren!!!</li>
                        <li>Wenn man auf weiter oder Resultat senden klickt kann man nicht mehr zurück!!!</li>
                        {((time) >= 0) && <li>Zum beantworten der Fragen haben sie nur <b>{((time/60 - ((time/60) % 1))).toString() + ":" + (time % 60 < 10 ? "0" + (time % 60).toString() : (time % 60).toString())}</b> min Zeit!!!</li>}
                    </ul>
                    Willst du das Quiz <b>{editelement?.name}</b> starten?
                </p> 
                <button onClick={() => {setstart(true); setcountdownstarted(true);}}>Start</button>
            </div>} 
            {end && <div>
                <p>
                    Resultat <b>{questions.length > 0 ? Math.round(((score / questions.length) * 100) * 100) / 100 : 0}%</b> wurde gesendet!!!
                </p>
            </div>}
            {start && !end && <div>
                <div class = "box">
                    <p style="text-align: right">{stime}</p>
                    <h3 style="text-align: center;">{questions.at(at)?.typ}</h3>
                    <p>{questions.at(at)?.text}</p>
                    {questions.at(at)?.typ != "Text Antwort" && <div> {answers.map(a => (
                        <div class = "form-row box">
                            <button onClick={() => {setscore(score + (notanswerd && a.is_true ? 1 : 0)); setnotanswerd(false); setis_correct(a.is_true); setshowcorrect(true);}}>{a.text}</button>
                        </div>
                    ))}</div>}
                    {questions.at(at)?.typ == "Text Antwort" && <div> 
                        <div class="form-row">
                            <label htmlFor="name">Antwort:</label>
                            <input type="text" id="name" name="name" maxlength={50} onInput={(e) => settainput((e.target as HTMLInputElement).value || "")}></input>
                        </div>
                        <button onClick={() => {setscore(score + (notanswerd && answers.length == 1 && answers.at(0)?.text === tainput ? 1 : 0)); setnotanswerd(false); setis_correct(answers.at(0)?.text === tainput); setshowcorrect(true);}}>Lösen</button>
                    </div>}
                    {showcorrect && <div>
                        {is_correct && (<span style={{ color: "green" }}>
                                Frage richig beantwortet
                            </span>)}
                        {!is_correct && (<span style={{ color: "red" }}>
                                Frage falsch beantwortet
                            </span>)}
                    </div>
                    }
                    {questions.length - 1 <= at && <button onClick={() => {handleaddscore(editelement?.id.toString() || "", (questions.length > 0 ? Math.round(((score / questions.length) * 100) * 100) / 100 : 0).toString()); setend(true)}}>Resultat senden</button>}
                    {questions.length - 1 > at &&<button onClick={() => {setat(at + 1); setnotanswerd(true); setshowcorrect(false);}}>Weiter</button>}
                </div>
            </div>
            } 
        </div>
    ); 
}