from fastapi import FastAPI
from sqlalchemy import text

from app.database import Base, engine
from app.models import User

Base.metadata.create_all(bind=engine)

from app.routes.auth import router as auth_router

app = FastAPI()
app.include_router(auth_router)

from app.routes.users import router as users_router

app.include_router(users_router)

@app.get("/")
def root():
    return {"message": "Swigato API running"}


@app.get("/health/db")
def db_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "success",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "failed",
            "error": str(e)
        }