from fastapi import FastAPI, Form, Response, Cookie, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, desc, cast
from sqlalchemy.orm import declarative_base, Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from passlib.context import CryptContext
import secrets

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions: dict[str, str] = {}

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    password = Column(String(255), nullable=False)

class Quiz(Base):
    __tablename__ = "quiz_table"
     
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    creator_id = Column(Integer, nullable=False)
    is_public = Column(Boolean, nullable=False)
    time = Column(Integer, nullable=False)

class Question(Base):
    __tablename__ = "question_table"

    id = Column(Integer, primary_key=True, autoincrement=True)
    text = Column(String(255), nullable=False)
    quiz_id = Column(Integer, nullable=False)
    typ = Column(String(255), nullable=False)

class Answer(Base):
    __tablename__ = "answer_table"

    id = Column(Integer, primary_key=True, autoincrement=True)
    text = Column(String(255), nullable=False)
    question_id = Column(Integer, nullable=False)
    is_true = Column(Boolean, nullable=False)

class Score(Base):
    __tablename__ = "score_table"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    quiz_id = Column(Integer, nullable=False)
    score = Column(String(50), nullable=False)

SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root@host.docker.internal:3306/quiz"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@app.post("/sign-up")
def sign_up(name: str = Form(...), pw: str = Form(...)):
    with Session(engine) as session:
        hashed_pw = pwd_context.hash(pw)
        new_user = User(name=name, password=hashed_pw)
        session.add(new_user)
        try:
            session.commit()
            return {"message": "Registrierung erfolgreich"}
        except IntegrityError:
            session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Name schon vorhanden"
            )
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="SQL Fehler"
            )
        except Exception:
            session.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unbekannter Fehler"
            )


@app.post("/log-in")
def log_in(response: Response, name: str = Form(...), pw: str = Form(...)):
    with Session(engine) as session:
        user = session.query(User).filter(User.name == name).first()
        if not user or not pwd_context.verify(pw, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Name oder Passwort falsch"
            )

        session_id = secrets.token_urlsafe(32)
        sessions[session_id] = name

        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            samesite="lax"
        )

        return {"message": "Login erfolgreich"}


@app.post("/log-out")
def logout(response: Response, session_id: str | None = Cookie(default=None)):
    if session_id and session_id in sessions:
        del sessions[session_id]

    response.delete_cookie("session_id")
    return {"message": "Logout erfolgreich"}

# Just for testing
@app.post("/delete-user")
def delete_user(name: str = Form(...)):
    with Session(engine) as session:
        user = session.query(User).filter(User.name == name).first()
        if not user:
            raise HTTPException(status_code=404, detail="Nicht gefunden")

        session.delete(user)
        try:
            session.commit()
            return {"message": "User gelöscht"}
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=500, detail="SQL Fehler")
        except Exception:
            session.rollback()
            raise HTTPException(status_code=500, detail="Unbekannter Fehler")


@app.get("/quiz-get-all-public")
def get_all_public_quizzes(session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nicht eingeloggt"
        )

    with Session(engine) as session:
        quizzes = session.query(Quiz).filter(Quiz.is_public == True).all()
        return [
            {
                "id": quiz.id,
                "name": quiz.name,
                "is_public": quiz.is_public,
                "creator_id": quiz.creator_id,
                "time": quiz.time
            }
            for quiz in quizzes
        ]


@app.get("/quiz-get-all-private")
def get_all_private_quizzes(session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nicht eingeloggt"
        )

    with Session(engine) as session:
        username = sessions[session_id]
        user = session.query(User).filter(User.name == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User nicht gefunden")

        quizzes = session.query(Quiz).filter(Quiz.creator_id == user.id).all()
        return [
            {
                "id": quiz.id,
                "name": quiz.name,
                "is_public": quiz.is_public,
                "creator_id": quiz.creator_id,
                "time": quiz.time
            }
            for quiz in quizzes
        ]


@app.post("/add-quiz")
def add_quiz(session_id: str | None = Cookie(default=None), quiz_name: str = Form(...), is_public: str = Form(...), time: str = Form(...)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    username = sessions[session_id]
    with Session(engine) as session:
        user = session.query(User).filter(User.name == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User nicht gefunden")

        new_quiz = Quiz(name=quiz_name, creator_id=user.id, is_public=(is_public == "true"), time=int(time))
        session.add(new_quiz)
        try:
            session.commit()
            return {"message": "Quiz erstellt"}
        except IntegrityError:
            session.rollback()
            raise HTTPException(status_code=409, detail="Quiz-Name schon vorhanden")
        except SQLAlchemyError as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"SQL Fehler: {str(e)}")
        except Exception:
            session.rollback()
            raise HTTPException(status_code=500, detail="Unbekannter Fehler")


@app.post("/edit-quiz")
def edit_quiz(quiz_id: int = Form(...), quiz_name: str = Form(...), is_public: str = Form(...), time: str = Form(...), session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    with Session(engine) as session:
        quiz = session.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz nicht gefunden")

        username = sessions[session_id]
        user = session.query(User).filter(User.name == username).first()
        if quiz.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Nicht berechtigt, dieses Quiz zu bearbeiten")

        quiz.name = quiz_name
        quiz.is_public = is_public == "true"
        quiz.time = int(time)

        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            raise HTTPException(status_code=409, detail="Quiz-Name schon vorhanden")
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=500, detail="SQL Fehler beim Editieren")

    return {"message": "Quiz Edit erfolgreich"}


@app.post("/delete-quiz")
def delete_quiz(quiz_id: int = Form(...), session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    with Session(engine) as session:
        quiz = session.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Nicht gefunden")

        session.delete(quiz)
        try:
            session.commit()
            return {"message": "Quiz gelöscht"}
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=500, detail="SQL Fehler")
        except Exception:
            session.rollback()
            raise HTTPException(status_code=500, detail="Unbekannter Fehler")


@app.get("/quiz/{quiz_id}/questions")
def question_get_all(quiz_id: int, session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    with Session(engine) as session:
        username = sessions[session_id]
        user = session.query(User).filter(User.name == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User nicht gefunden")

        quiz = session.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz nicht gefunden")

        questions = session.query(Question).filter(Question.quiz_id == quiz.id).all()
        return [
            {
                "id": q.id,
                "text": q.text,
                "quiz_id": q.quiz_id,
                "typ": q.typ
            }
            for q in questions
        ]


@app.post("/quiz/add-question")
def add_question(quiz_id: int = Form(...), question_text: str = Form(...), typ: str = Form(...), session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    with Session(engine) as session:
        username = sessions[session_id]
        user = session.query(User).filter(User.name == username).first()

        quiz = session.query(Quiz).filter(Quiz.id == quiz_id, Quiz.creator_id == user.id).first()
        if not quiz:
            raise HTTPException(status_code=403, detail="Kein Quiz vorhanden oder keine Berechtigung")

        new_question = Question(text=question_text, quiz_id=quiz.id, typ=typ)

        session.add(new_question)
        try:
            session.commit()
            return {"message": "Question erstellt"}
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=500, detail="SQL Fehler")
        except Exception:
            session.rollback()
            raise HTTPException(status_code=500, detail="Unbekannter Fehler")


@app.post("/quiz/edit-question")
def edit_question(question_id: int = Form(...), question_text: str = Form(...), typ: str = Form(...), session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    with Session(engine) as session:
        username = sessions[session_id]
        user = session.query(User).filter(User.name == username).first()

        question = session.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question nicht gefunden")

        quiz = session.query(Quiz).filter(Quiz.id == question.quiz_id).first()
        if quiz.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Keine Berechtigung")

        question.text = question_text
        question.typ = typ

        try:
            session.commit()
            return {"message": "Question bearbeited"}
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=500, detail="SQL Fehler")
        except Exception:
            session.rollback()
            raise HTTPException(status_code=500, detail="Unbekannter Fehler")


@app.post("/quiz/delete-question")
def delete_question(question_id: int = Form(...), session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    with Session(engine) as session:
        username = sessions[session_id]
        user = session.query(User).filter(User.name == username).first()

        question = session.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Nicht gefunden")

        quiz = session.query(Quiz).filter(Quiz.id == question.quiz_id).first()
        if quiz.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Keine Berechtigung")

        session.delete(question)
        try:
            session.commit()
            return {"message": "Question gelöscht"}
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=500, detail="SQL Fehler")
        except Exception:
            session.rollback()
            raise HTTPException(status_code=500, detail="Unbekannter Fehler")


@app.get("/quiz/question/{question_id}/answers")
def answer_get_all(question_id: int, session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    with Session(engine) as session:
        username = sessions[session_id]
        user = session.query(User).filter(User.name == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User nicht gefunden")

        question = session.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question nicht gefunden")

        answers = session.query(Answer).filter(Answer.question_id == question.id).all()
        return [
            {
                "id": a.id,
                "text": a.text,
                "question_id": a.question_id,
                "is_true": a.is_true
            }
            for a in answers
        ]


@app.post("/quiz/question/add-answer")
def add_answer(question_id: int = Form(...), answer_text: str = Form(...), is_true: bool = Form(...), typ: str = Form(...), session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    with Session(engine) as session:
        username = sessions[session_id]
        user = session.query(User).filter(User.name == username).first()

        question = session.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question nicht gefunden")

        quiz = session.query(Quiz).filter(Quiz.id == question.quiz_id).first()
        if quiz.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Keine Berechtigung")

        anz = len(session.query(Answer).filter(Answer.question_id == question_id).all())
        if (typ == "Wahr/Falsch" and anz >= 1) or (typ == "Text Antwort" and anz == 1):
            raise HTTPException(status_code=409, detail="Maximale Anzahl an Antworten erreicht")
            
        answer = Answer(text=answer_text, question_id=question.id, is_true=is_true)
        session.add(answer)

        if (typ == "Wahr/Falsch" and anz == 0):
            answer = Answer(text=("Falsch" if answer_text == "Wahr" else "Wahr"), question_id=question.id, is_true=not is_true)
            session.add(answer)
            
        try:
            session.commit()
            return {"message": "Answer erstellt"}
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=500, detail="SQL Fehler")
        except Exception:
            session.rollback()
            raise HTTPException(status_code=500, detail="Unbekannter Fehler")


@app.post("/quiz/question/edit-answer")
def edit_answer(answer_id: int = Form(...), answer_text: str = Form(...), is_true: bool = Form(...), session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    with Session(engine) as session:
        username = sessions[session_id]
        user = session.query(User).filter(User.name == username).first()

        answer = session.query(Answer).filter(Answer.id == answer_id).first()
        if not answer:
            raise HTTPException(status_code=404, detail="Answer nicht gefunden")

        question = session.query(Question).filter(Question.id == answer.question_id).first()
        quiz = session.query(Quiz).filter(Quiz.id == question.quiz_id).first()
        if quiz.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Keine Berechtigung")

        answer.text = answer_text
        answer.is_true = is_true
        try:
            session.commit()
            return {"message": "Answer bearbeitet"}
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=500, detail="SQL Fehler")
        except Exception:
            session.rollback()
            raise HTTPException(status_code=500, detail="Unbekannter Fehler")


@app.post("/quiz/question/delete-answer")
def delete_answer(answer_id: int = Form(...), session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    with Session(engine) as session:
        username = sessions[session_id]
        user = session.query(User).filter(User.name == username).first()

        answer = session.query(Answer).filter(Answer.id == answer_id).first()
        if not answer:
            raise HTTPException(status_code=404, detail="Answer nicht gefunden")

        question = session.query(Question).filter(Question.id == answer.question_id).first()
        quiz = session.query(Quiz).filter(Quiz.id == question.quiz_id).first()
        if quiz.creator_id != user.id:
            raise HTTPException(status_code=403, detail="Keine Berechtigung")

        session.delete(answer)
        try:
            session.commit()
            return {"message": "answer gelöscht"}
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=500, detail="SQL Fehler")
        except Exception:
            session.rollback()
            raise HTTPException(status_code=500, detail="Unbekannter Fehler")

@app.get("/user/scores")
def score_get_all_user(session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    with Session(engine) as session:
        username = sessions[session_id]
        user_id = session.query(User).filter(User.name == username).first().id

        scores = session.query(Score, Quiz).join(Quiz, Score.quiz_id == Quiz.id).filter(Score.user_id == user_id).order_by(desc(cast(Score.score, Integer))).all()
        if not scores:
            raise HTTPException(status_code=404, detail="Score nicht gefunden")

        return [
            {"quiz_name": quiz.name, "score": score.score}
            for score, quiz in scores
        ]


@app.get("/quiz/{quiz_id}/scores")
def score_get_all_quiz(quiz_id: int, session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    with Session(engine) as session:
        quiz = session.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz nicht gefunden")

        scores = session.query(Score, User).join(User, Score.user_id == User.id).filter(Score.quiz_id == quiz_id).order_by(desc(cast(Score.score, Integer))).all()
        if not scores:
            raise HTTPException(status_code=404, detail="Score nicht gefunden")

        return [
            {"user_name": user.name, "score": score.score}
            for score, user in scores
        ]


@app.post("/user/quiz/score/add-score")
def add_score(quiz_id: str = Form(...), score: str = Form(...), session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=401, detail="Nicht eingeloggt")

    with Session(engine) as session:
        username = sessions[session_id]
        user = session.query(User).filter(User.name == username).first()
        user_id = user.id
        quiz = session.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not user or not quiz:
            raise HTTPException(status_code=404, detail="User oder Quiz nicht gefunden")

        existing_score = session.query(Score).filter(Score.user_id == user_id, Score.quiz_id == quiz_id).first()
        if existing_score:
            existing_score.score = score
        else:
            new_score = Score(user_id=user_id, quiz_id=quiz_id, score=score)
            session.add(new_score)
        try:
            session.commit()
            return {"message": "Score erstellt"}
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Fehler: {str(e)}")
