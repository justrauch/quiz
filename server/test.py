import requests

BASE_URL = "http://localhost:8000"

# Regestrierung valide
resp = requests.post(f"{BASE_URL}/sign-up", data={"name": "testuser", "pw": "password123"})
assert resp.status_code == 200, f"Signup fehlgeschlagen: {resp.text}"
assert resp.json()["message"] == "Registrierung erfolgreich"

# Login mit richtigem Passwort
resp = requests.post(f"{BASE_URL}/log-in", data={"name": "testuser", "pw": "password123"})
assert resp.status_code == 200, f"Login fehlgeschlagen: {resp.text}"
assert "session_id" in resp.cookies, "Keine Session-Cookie erhalten"
session_id = resp.cookies.get("session_id")
assert resp.json()["message"] == "Login erfolgreich"

# Login mit falschem Passwort
resp = requests.post(f"{BASE_URL}/log-in", data={"name": "testuser", "pw": "wrongpassword"})
assert resp.status_code == 401, f"Login mit falschem Passwort sollte 401 sein, war: {resp.status_code}"
assert resp.json()["detail"] == "Name oder Passwort falsch"

# Logout mit falschem Passwort
resp = requests.post(f"{BASE_URL}/log-out" , cookies={"session_id": session_id})
assert resp.status_code == 200, f"Logout fehlgeschlagen: {resp.text}"
assert resp.json()["message"] == "Logout erfolgreich"

resp = requests.post(f"{BASE_URL}/delete-user", data={"name": "testuser"})
