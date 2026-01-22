import './app.css'
import { useState } from 'preact/hooks';
import { route } from 'preact-router';

export function Home(props: any) {
  const [showsignup, setsignup] = useState(true);
  const [showlogin, setlogin] = useState(false);

  const [showerror, seterror] = useState(false)
  const [errormessage, seterrormessage] = useState("");

  const [su_name, setsu_Name] = useState("");
  const [su_password, setsu_Password] = useState("");
  const [su_wpassword, setsu_wPassword] = useState("");

  const [li_name, setli_Name] = useState("");
  const [li_password, setli_Password] = useState("");

  const handlerequest = async (name: string, password: string, methode: string) => {
    try {
      seterror(false);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("pw", password);

      const response = await fetch(`http://localhost:8000/${methode}`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) { 
        const data = await response.json(); 
        seterrormessage(response.status === 409 || response.status === 401 ? data.detail : "Server Error versuchen sie es erneut");
        seterror(true);
        return; 
      }

      const data = await response.json();
      if(methode === "log-in"){
        seterror(false); setlogin(true); setsignup(false); route('/quiz');
      }
      if(methode === "sign-up"){
        setlogin(true); setsignup(false);
      }

    } catch (error) {
      console.error(`Fehler bei ${methode}:`, error);
    }
  };

  return (
    <>
      {(showsignup || showlogin) && <div class="div-buttons">
        <button onClick={() => { setlogin(true); setsignup(false);}}>Einloggen</button>
        <button onClick={() => { setlogin(false); setsignup(true);}}>Regestrieren</button>
      </div>}

      <div>

      {showerror && (
        <span style={{ color: "red" }}>
          {errormessage}
        </span>
      )}

      {showsignup && 
          <form>
            <div class="form-row">
              <label htmlFor="name">Name:</label>
              <input type="text" id="name" name="name" maxlength={50} onInput={(e) => setsu_Name((e.target as HTMLInputElement).value || "")}/>
            </div>

            <div class="form-row">
              <label htmlFor="pw">Password:</label>
              <input type="password" id="pw" name="pw" onInput={(e) => setsu_Password((e.target as HTMLInputElement).value || "")}/>
            </div>

            {su_password !== su_wpassword && (
              <span style={{ color: "red" }}>
                Passwort stimmt nicht überein!
              </span>
            )}

            <div class="form-row">
              <label htmlFor="pw">Password wiederholen:</label>
              <input type="password" id="wpw" name="wpw" onInput={(e) => setsu_wPassword((e.target as HTMLInputElement).value || "")}/>
            </div>

            <button type="button" class="myButton" onClick={(e) => {e.preventDefault(); handlerequest(su_name, su_password, "sign-up");}} disabled={ su_name.trim() === "" || su_password.trim() === "" || su_password !== su_wpassword }>Absenden</button>
          </form>
        }

        {showlogin && 
          <form>
            <div class="form-row">
              <label htmlFor="name">Name:</label>
              <input type="text" id="name" name="name" maxlength={50} onInput={(e) => setli_Name((e.target as HTMLInputElement).value || "")}/>
            </div>

            <div class="form-row">
              <label htmlFor="pw">Password:</label>
              <input type="password" id="pw" name="pw" onInput={(e) => setli_Password((e.target as HTMLInputElement).value || "")}/>
            </div>

            <button type="button" class="myButton" onClick={(e) => {e.preventDefault(); handlerequest(li_name, li_password, "log-in");}} disabled={ li_name.trim() === "" || li_password.trim() === ""}>Absenden</button>
          </form>
        }

      </div>
    </>
  )
}
