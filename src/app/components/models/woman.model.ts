export interface Woman {
  id: number;
  name: string;
  avatar?: string;
  age?: number;
  status: string;
  dateOfBirth?: string;
  country: string;
  race?: string;
  email: string;
}

export interface WomanRatingSummary {
  womanId: number;
  name: string;
  averageRate: number;
  totalRatings: number;
}

export interface CreateRateDto {
  womanId: number;
  rate: number;
}