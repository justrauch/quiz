from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
import pymysql

connection = pymysql.connect(
    host="localhost",
    user="root",
    password=""
)

try:
    with connection.cursor() as cursor:
        cursor.execute("CREATE DATABASE IF NOT EXISTS quiz")
finally:
    connection.close()

SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root@localhost:3306/quiz"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)

    quizzes = relationship("Quiz", back_populates="creator", cascade="all, delete-orphan")


class Quiz(Base):
    __tablename__ = "quiz_table"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_public = Column(Boolean, nullable=False)

    creator = relationship("User", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "question_table"

    id = Column(Integer, primary_key=True)
    text = Column(String(50), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quiz_table.id", ondelete="CASCADE"), nullable=False)
    typ = Column(String(50), nullable=False)

    quiz = relationship("Quiz", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answer_table"

    id = Column(Integer, primary_key=True)
    text = Column(String(50), nullable=False)
    question_id = Column(Integer, ForeignKey("question_table.id", ondelete="CASCADE"), nullable=False)
    is_true = Column(Boolean, nullable=False)

    question = relationship("Question", back_populates="answers")

Base.metadata.create_all(bind=engine)
