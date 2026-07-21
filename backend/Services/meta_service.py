from sqlalchemy.orm import Session
from Repositories.meta_repository import MetaRepository

class MetaService:
    @staticmethod
    def get_meta_data(db: Session):
        return MetaRepository.get_meta_data(db)
