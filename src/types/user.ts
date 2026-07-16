export interface User {
  id: number;
  username: string;
  role: string;
  assigned_store_id: number | null;
  store_name: string | null;
  assigned_district_id: number | null;
  district_name: string | null;
  assigned_region_id: number | null;
  region_name: string | null;
  email?: string | null;
  password?: string | null;
}
