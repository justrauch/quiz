from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, declarative_base
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
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    password = Column(String(255), nullable=False)

Base.metadata.create_all(bind=engine)
