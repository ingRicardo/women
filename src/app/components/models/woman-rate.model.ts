export interface CreateRateDto {
  womanId: number;
  rate: number;
}

export interface WomanRatingSummaryDto {
  womanId: number;
  name: string;
  averageRate: number;
  totalRatings: number;
}