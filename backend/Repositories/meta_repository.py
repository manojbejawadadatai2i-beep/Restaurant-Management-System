from sqlalchemy.orm import Session
from models import Region, District, Store

class MetaRepository:
    @staticmethod
    def get_meta_data(db: Session):
        regions = db.query(Region.id, Region.region_name.label("name")).order_by(Region.id.asc()).all()
        
        districts = db.query(
            District.id,
            District.district_name.label("name"),
            District.region_id
        ).order_by(District.id.asc()).all()
        
        stores = db.query(
            Store.id,
            Store.store_name.label("name"),
            Store.district_id,
            # We can get region_id by joining with districts
            District.region_id
        ).join(District, Store.district_id == District.id)\
         .order_by(Store.id.asc()).all()
         
        return {
            "regions": [dict(r._mapping) for r in regions],
            "districts": [dict(d._mapping) for d in districts],
            "stores": [dict(s._mapping) for s in stores]
        }
