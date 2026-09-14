import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CreateRateDto, WomanRatingSummaryDto } from '../components/models/woman-rate.model';

@Injectable({
  providedIn: 'root'
})
export class WomanRatesService {
  private readonly http = inject(HttpClient);
  //private readonly apiUrl = 'https://localhost:7099/api/WomanRates';
  private readonly apiUrl = 'https://womenapi.onrender.com/api/WomanRates';
  // GET: api/WomanRates/averages
  getAllAverageRates(): Observable<WomanRatingSummaryDto[]> {
        console.log('Full ALL RATES request URL:', `${this.apiUrl}/averages`);

    return this.http.get<WomanRatingSummaryDto[]>(`${this.apiUrl}/averages`).pipe(
      tap({
      next: (data) => console.log('ALL Rates data received by service:', data),
      error: (err) => console.error('Service error:', err)
    })
    );
  }

  // GET: api/WomanRates/average/{womanId}
  getAverageRateForWoman(womanId: number): Observable<WomanRatingSummaryDto> {
    console.log("rate inside service ", womanId);
    console.log('Full SINGLE RATE request URL:', `${this.apiUrl}/average/${womanId}`);
    return this.http.get<WomanRatingSummaryDto>(`${this.apiUrl}/average/${womanId}`).pipe(
      tap({
      next: (data) => console.log('Rate data received by service:', data),
      error: (err) => console.error('Service error:', err)
    })
    );
  }

  // POST: api/WomanRates
  addRate(dto: CreateRateDto): Observable<any> {
    console.log('Full SINGLE RATE POST URL:', `${this.apiUrl}`);
    return this.http.post(`${this.apiUrl}`, dto).pipe(
      tap({
      next: (data) => console.log('Rate data posted by service:', data),
      error: (err) => console.error('Service error:', err)
    })
  );
  }
}