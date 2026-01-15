import './app.css'
import { useState } from 'preact/hooks';


export function App() {
  const [showsignup, setsignup] = useState(true)
  const [showlogin, setlogin] = useState(false)

  const [su_name, setsu_Name] = useState("");
  const [su_password, setsu_Password] = useState("");
  const [su_wpassword, setsu_wPassword] = useState("");

  const [li_name, setli_Name] = useState("");
  const [li_password, setli_Password] = useState("");

  return (
    <>
      <div class="div-buttons">
        <button onClick={() => { setlogin(true); setsignup(false);}}>Einloggen</button>
        <button onClick={() => { setlogin(false); setsignup(true);}}>Regestrieren</button>
      </div>
      <div>

        {showsignup && 
          <form action="http://localhost:8000/sign-up" method="post">
            <div class="form-row">
              <label htmlFor="name">Name:</label>
              <input type="text" id="name" name="name" onInput={(e) => setsu_Name((e.target as HTMLInputElement).value || "")}/>
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

            <button type="submit" class="myButton" disabled={ su_name.trim() === "" || su_password.trim() === "" || su_password !== su_wpassword }>Absenden</button>
          </form>
        }

        {showlogin && 
          <form action="http://localhost:8000/log-in" method="post">
            <div class="form-row">
              <label htmlFor="name">Name:</label>
              <input type="text" id="name" name="name" onInput={(e) => setli_Name((e.target as HTMLInputElement).value || "")}/>
            </div>

            <div class="form-row">
              <label htmlFor="pw">Password:</label>
              <input type="password" id="pw" name="pw" onInput={(e) => setli_Password((e.target as HTMLInputElement).value || "")}/>
            </div>

            <button type="submit" class="myButton" disabled={ li_name.trim() === "" || li_password.trim() === ""}>Absenden</button>
          </form>
        }

      </div>
    </>
  )
}
