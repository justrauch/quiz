from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from passlib.context import CryptContext
from fastapi import HTTPException, status

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    password = Column(String(255), nullable=False)

SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root@host.docker.internal:3306/quiz"
engine = create_engine(SQLALCHEMY_DATABASE_URL)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@app.post("/sign-up")
def sign_up(name: str = Form(...), pw: str = Form(...)):
    with Session(engine) as session:
        ret = {"message": "Hello, FastAPI in Docker!"}
        hashed_pw = pwd_context.hash(pw)
        new_user = User(name=name, password=hashed_pw)
        session.add(new_user)
        try:
            session.commit()
        except IntegrityError as e:
            session.rollback()
            print("Error:", e)
            if "Duplicate entry" in str(e.orig):
                ret = {"message": "Name schon vorhanden"}
            elif "cannot be null" in str(e.orig):
                ret = {"message": "Ein Wert war null"}
        except SQLAlchemyError as e:
            print("Error:", e)
            session.rollback()
            ret = {"message": "Ein SQL Fehler ist aufgetreten"}
        except Exception as e:
            print("Error:", e)
            ret = {"message": "Ein Fehler ist aufgetreten"}

        return ret

@app.post("/log-in")
def log_in(name: str = Form(...), pw: str = Form(...)):
    with Session(engine) as session:
        user = session.query(User).filter(User.name == name).first()

        if not user or not pwd_context.verify(pw, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login fehlgeschlagen"
            )

        return {"message": "Login erfolgreich"}