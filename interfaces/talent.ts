interface Talent {
  title: string;
  description: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  phoneCountryCode: number;
  phoneNumber: number;
  email: string;
  aboutWork: string;
  telegram: string;
  rate: number;
  currency: string;
  skills: string[];
  imageUrl: string;
  freelancer: boolean;
  remote: boolean;
  availability: boolean;
  last_active: Date;
}

export default Talent;
