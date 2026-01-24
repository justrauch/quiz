import requests

BASE_URL = "http://localhost:8000"

# -------------------------- User Signup/Login ----------------------------------------
# Registrierung User 1
resp = requests.post(f"{BASE_URL}/sign-up", data={"name": "testuser1", "pw": "password123"})
assert resp.status_code == 200, f"Signup fehlgeschlagen: {resp.text}"
assert resp.json()["message"] == "Registrierung erfolgreich"

# Login User 1 korrekt
resp = requests.post(f"{BASE_URL}/log-in", data={"name": "testuser1", "pw": "password123"})
assert resp.status_code == 200, f"Login fehlgeschlagen: {resp.text}"
assert "session_id" in resp.cookies
session_id_1 = resp.cookies.get("session_id")
assert resp.json()["message"] == "Login erfolgreich"

# Login User 1 falsch
resp = requests.post(f"{BASE_URL}/log-in", data={"name": "testuser1", "pw": "wrongpassword"})
assert resp.status_code == 401
assert resp.json()["detail"] == "Name oder Passwort falsch"

# -------------------------- Quiz Erstellung ----------------------------------------
# Public Quiz erstellen User 1
resp = requests.post(
    f"{BASE_URL}/add-quiz",
    data={"quiz_name": "testquizpublic", "is_public": "true", "time": "10"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Quiz erstellt"

# Quiz-ID für später speichern
quiz_id_public = requests.get(f"{BASE_URL}/quiz-get-all-public", cookies={"session_id": session_id_1}).json()[0]["id"]

# Public Quiz Duplikat erstellen User 1
resp = requests.post(
    f"{BASE_URL}/add-quiz",
    data={"quiz_name": "testquizpublic", "is_public": "true", "time": "10"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 409
assert resp.json()["detail"] == "Quiz-Name schon vorhanden"

# Private Quiz erstellen User 1
resp = requests.post(
    f"{BASE_URL}/add-quiz",
    data={"quiz_name": "testquizprivate", "is_public": "false", "time": "10"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Quiz erstellt"

quiz_id_private = requests.get(f"{BASE_URL}/quiz-get-all-private", cookies={"session_id": session_id_1}).json()[1]["id"]

# -------------------------- Quiz Abfrage ----------------------------------------
# Alle public Quizzes abrufen User 1
resp = requests.get(f"{BASE_URL}/quiz-get-all-public", cookies={"session_id": session_id_1})
assert resp.status_code == 200
assert len(resp.json()) == 1

# Registrierung & Login User 2
resp = requests.post(f"{BASE_URL}/sign-up", data={"name": "testuser2", "pw": "password123"})
assert resp.status_code == 200
resp = requests.post(f"{BASE_URL}/log-in", data={"name": "testuser2", "pw": "password123"})
session_id_2 = resp.cookies.get("session_id")

# Public Quiz erstellen User 2
resp = requests.post(
    f"{BASE_URL}/add-quiz",
    data={"quiz_name": "testquizpublic2", "is_public": "true", "time": "10"},
    cookies={"session_id": session_id_2}
)
assert resp.status_code == 200

# Public Quizzes abrufen User 1 (jetzt 2 public Quizzes)
resp = requests.get(f"{BASE_URL}/quiz-get-all-public", cookies={"session_id": session_id_1})
assert len(resp.json()) == 2

# -------------------------- Quiz Editieren ----------------------------------------
# Quiz bearbeiten: Name Duplikat (409)
resp = requests.post(
    f"{BASE_URL}/edit-quiz",
    data={"quiz_id": quiz_id_public, "quiz_name": "testquizpublic2", "is_public": "true", "time": "10"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 409
assert resp.json()["detail"] == "Quiz-Name schon vorhanden"

# Quiz bearbeiten: Name ändern
resp = requests.post(
    f"{BASE_URL}/edit-quiz",
    data={"quiz_id": quiz_id_public, "quiz_name": "testquizPublicRenamed", "is_public": "true", "time": "10"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Quiz Edit erfolgreich"

# Quiz bearbeiten: is_public ändern
resp = requests.post(
    f"{BASE_URL}/edit-quiz",
    data={"quiz_id": quiz_id_public, "quiz_name": "testquizPublicRenamed", "is_public": "false", "time": "10"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Quiz Edit erfolgreich"

# Quiz bearbeiten: time ändern
resp = requests.post(
    f"{BASE_URL}/edit-quiz",
    data={"quiz_id": quiz_id_public, "quiz_name": "testquizPublicRenamed", "is_public": "false", "time": "11"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Quiz Edit erfolgreich"

# -------------------------- Question Tests ----------------------------------------
question_ids = {}

# Text Antwort
resp = requests.post(
    f"{BASE_URL}/quiz/add-question",
    data={"quiz_id": quiz_id_public, "question_text": "Was ist 2+2?", "typ": "Text Antwort"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Question erstellt"

# Wahr/Falsch
resp = requests.post(
    f"{BASE_URL}/quiz/add-question",
    data={"quiz_id": quiz_id_public, "question_text": "Die Erde ist flach.", "typ": "Wahr/Falsch"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Question erstellt"

# Multiple Choice
resp = requests.post(
    f"{BASE_URL}/quiz/add-question",
    data={"quiz_id": quiz_id_public, "question_text": "Welche Farben hat die Flagge von Deutschland?", "typ": "Multiple choice"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Question erstellt"

# Alle Questions abrufen
resp = requests.get(f"{BASE_URL}/quiz/{quiz_id_public}/questions", cookies={"session_id": session_id_1})
questions = resp.json()
assert len(questions) == 3

# Question IDs speichern
for q in questions:
    question_ids[q["typ"]] = q["id"]

# Question bearbeiten (nur Text)
for typ, qid in question_ids.items():
    resp = requests.post(
        f"{BASE_URL}/quiz/edit-question",
        data={"question_id": qid, "question_text": f"{typ} Frage bearbeitet", "typ": typ},
        cookies={"session_id": session_id_1}
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Question bearbeited"

# -------------------------- Answer Tests ----------------------------------------
answer_ids = {}

# 1. Text Antwort anlegen (max 1 erlaubt)
resp = requests.post(
    f"{BASE_URL}/quiz/question/add-answer",
    data={"question_id": question_ids["Text Antwort"], "answer_text": "4", "is_true": True, "typ": "Text Antwort"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Answer erstellt"

# Versuch, zweite Text Antwort anzulegen (sollte scheitern)
resp = requests.post(
    f"{BASE_URL}/quiz/question/add-answer",
    data={"question_id": question_ids["Text Antwort"], "answer_text": "5", "is_true": False, "typ": "Text Antwort"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 409

# 2. Wahr/Falsch anlegen (1 -> automatisch werden 2 Antworten erstellt)
resp = requests.post(
    f"{BASE_URL}/quiz/question/add-answer",
    data={"question_id": question_ids["Wahr/Falsch"], "answer_text": "Wahr", "is_true": True, "typ": "Wahr/Falsch"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Answer erstellt"

# Prüfen, ob beide Antworten existieren
resp = requests.get(f"{BASE_URL}/quiz/question/{question_ids['Wahr/Falsch']}/answers", cookies={"session_id": session_id_1})
answers_wf = resp.json()
assert len(answers_wf) == 2

# Versuch, weitere Wahr/Falsch Antwort anzulegen (sollte scheitern)
resp = requests.post(
    f"{BASE_URL}/quiz/question/add-answer",
    data={"question_id": question_ids["Wahr/Falsch"], "answer_text": "Wahr", "is_true": True, "typ": "Wahr/Falsch"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 409

# 3. Multiple Choice anlegen (beliebig viele möglich, 2 anlegen)
resp = requests.post(
    f"{BASE_URL}/quiz/question/add-answer",
    data={"question_id": question_ids["Multiple choice"], "answer_text": "Schwarz", "is_true": False, "typ": "Multiple choice"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
resp = requests.post(
    f"{BASE_URL}/quiz/question/add-answer",
    data={"question_id": question_ids["Multiple choice"], "answer_text": "Rot", "is_true": False, "typ": "Multiple choice"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200

# Antworten abrufen und IDs speichern
for q_type in ["Text Antwort", "Wahr/Falsch", "Multiple choice"]:
    resp = requests.get(f"{BASE_URL}/quiz/question/{question_ids[q_type]}/answers", cookies={"session_id": session_id_1})
    for ans in resp.json():
        answer_ids[ans["text"]] = ans["id"]

# -------------------------- Answer Löschen ----------------------------------------
# Text Antwort löschen
resp = requests.post(
    f"{BASE_URL}/quiz/question/delete-answer",
    data={"answer_id": answer_ids["4"]},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "answer gelöscht"

# Wahr/Falsch löschen (beide Antworten sollten automatisch gelöscht)
resp = requests.post(
    f"{BASE_URL}/quiz/question/delete-answer",
    data={"answer_id": answer_ids["Wahr"]},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "answer gelöscht"

# Prüfen, dass nach Löschen keine Answers mehr existieren (5 Antworten erstellt 3 gelöscht sollten noch 2 sein)
resp = requests.get(f"{BASE_URL}/quiz/question/{qid}/answers", cookies={"session_id": session_id_1})
assert len(resp.json()) == 2

# -------------------------- Score Tests ----------------------------------------

# 1. User 1: Score für erstes Quiz anlegen
resp = requests.post(
    f"{BASE_URL}/user/quiz/score/add-score",
    data={"quiz_id": quiz_id_public, "score": "8"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Score erstellt"

# 2. User 1: Versuch, für dasselbe Quiz einen zweiten Score anzulegen (Update)
resp = requests.post(
    f"{BASE_URL}/user/quiz/score/add-score",
    data={"quiz_id": quiz_id_public, "score": "10"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Score erstellt"

# Prüfen, dass nur ein Score für User 1 und Quiz 1 existiert (der Score wurde aktualisiert)
resp = requests.get(f"{BASE_URL}/user/scores", cookies={"session_id": session_id_1})
scores_user1 = resp.json()
assert len(scores_user1) == 1
assert scores_user1[0]["score"] == "10"

# 3. User 1: Score für ein zweites Quiz (z. B. private Quiz) anlegen
resp = requests.post(
    f"{BASE_URL}/user/quiz/score/add-score",
    data={"quiz_id": quiz_id_private, "score": "11"},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Score erstellt"

# Prüfen, dass User 1 jetzt zwei Scores für zwei unterschiedliche Quizze hat
resp = requests.get(f"{BASE_URL}/user/scores", cookies={"session_id": session_id_1})
scores_user1 = resp.json()
assert len(scores_user1) == 2
quiz_scores = {s["quiz_name"]: s["score"] for s in scores_user1}

# User 2: Score für das erste Quiz anlegen
resp = requests.post(
    f"{BASE_URL}/user/quiz/score/add-score",
    data={"quiz_id": quiz_id_public, "score": "9"},
    cookies={"session_id": session_id_2}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Score erstellt"

# Prüfen, dass für das erste Quiz jetzt zwei Scores existieren
resp = requests.get(f"{BASE_URL}/quiz/{quiz_id_public}/scores", cookies={"session_id": session_id_1})
scores_quiz1 = resp.json()
assert len(scores_quiz1) == 2

# -------------------------- Questions Löschen -----------------------------------
for typ, qid in question_ids.items():
    resp = requests.post(
        f"{BASE_URL}/quiz/delete-question",
        data={"question_id": qid},
        cookies={"session_id": session_id_1}
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Question gelöscht"

# Prüfen, dass keine Questions mehr vorhanden sind
resp = requests.get(f"{BASE_URL}/quiz/{quiz_id_public}/questions", cookies={"session_id": session_id_1})
assert len(resp.json()) == 0

# -------------------------- Quiz Löschen ----------------------------------------
resp = requests.post(
    f"{BASE_URL}/delete-quiz",
    data={"quiz_id": quiz_id_public},
    cookies={"session_id": session_id_1}
)
assert resp.status_code == 200
assert resp.json()["message"] == "Quiz gelöscht"

# -------------------------- Logout & Cleanup ----------------------------------------
# Logout User 1
resp = requests.post(f"{BASE_URL}/log-out", cookies={"session_id": session_id_1})
assert resp.status_code == 200
assert resp.json()["message"] == "Logout erfolgreich"

# Benutzer löschen
resp = requests.post(f"{BASE_URL}/delete-user", data={"name": "testuser1"})
resp = requests.post(f"{BASE_URL}/delete-user", data={"name": "testuser2"})
