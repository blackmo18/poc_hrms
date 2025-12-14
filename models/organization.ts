
export interface Organization {
  id: number;
  name: string;
  email?: string;
  contact_number?: string;
  address?: string;
  logo?: string;
  website?: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  departments?: any[];
  employees?: any[];
  admins?: any[];
}