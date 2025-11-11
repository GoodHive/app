export interface IJobSection {
  id?: string;
  job_id?: string;
  heading: string;
  content: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface IJobOffer {
  id: string;
  user_id: string;
  title: string;
  type_engagement: string;
  description: string;
  duration: string;
  budget: string;
  chain: string;
  currency: string;
  skills: string; // This is a text field in db, can be parsed as string[]
  city: string;
  country: string;
  company_name: string;
  image_url: string;
  job_type: string;
  project_type: string;
  talent: string;
  recruiter: string;
  mentor: string;
  wallet_address: string;
  escrow_amount: string;
  posted_at: string;
  job_id: number;
  created_at: string;
  in_saving_stage: boolean;
  block_id: number;
  published: boolean;
  sections?: IJobSection[]; // New field for job sections
}
