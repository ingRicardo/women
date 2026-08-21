import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateRateDto, WomanRatingSummaryDto } from '../components/models/woman-rate.model';

@Injectable({
  providedIn: 'root'
})
export class WomanRatesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:7099/api/WomanRates';

  // GET: api/WomanRates/averages
  getAllAverageRates(): Observable<WomanRatingSummaryDto[]> {
    return this.http.get<WomanRatingSummaryDto[]>(`${this.apiUrl}/averages`);
  }

  // GET: api/WomanRates/average/{womanId}
  getAverageRateForWoman(womanId: number): Observable<WomanRatingSummaryDto> {
    return this.http.get<WomanRatingSummaryDto>(`${this.apiUrl}/average/${womanId}`);
  }

  // POST: api/WomanRates
  addRate(dto: CreateRateDto): Observable<any> {
    return this.http.post(`${this.apiUrl}`, dto);
  }
}