"""
Database Setup, Engine, Sessionmaker, and Initial Seeder for DroneCraft.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.models.db_models import (
    Base,
    FrameModel,
    MotorModel,
    PropellerModel,
    EscModel,
    BatteryModelDB
)
from app.core.seed_data import (
    SEED_FRAMES,
    SEED_MOTORS,
    SEED_PROPELLERS,
    SEED_ESCS,
    SEED_BATTERIES
)

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI Dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes schema and populates with verified components if empty."""
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check and seed frames
        if db.query(FrameModel).count() == 0:
            for f in SEED_FRAMES:
                db.add(FrameModel(**f))
            db.commit()

        # Check and seed motors
        if db.query(MotorModel).count() == 0:
            for m in SEED_MOTORS:
                db.add(MotorModel(**m))
            db.commit()

        # Check and seed propellers
        if db.query(PropellerModel).count() == 0:
            for p in SEED_PROPELLERS:
                db.add(PropellerModel(**p))
            db.commit()

        # Check and seed ESCs
        if db.query(EscModel).count() == 0:
            for e in SEED_ESCS:
                db.add(EscModel(**e))
            db.commit()

        # Check and seed batteries
        if db.query(BatteryModelDB).count() == 0:
            for b in SEED_BATTERIES:
                db.add(BatteryModelDB(**b))
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error initializing DB seed: {e}")
    finally:
        db.close()
