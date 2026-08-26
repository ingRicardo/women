import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Woman, WomanRatingSummary, CreateRateDto } from '../components/models/woman.model';

@Injectable({
  providedIn: 'root',
})
export class WomanService {
  private http = inject(HttpClient);

  // Update URL/port to match your ASP.NET Core API configuration
  //private apiUrl = 'https://localhost:7099/api/Women';
  private apiUrl = 'https://womenapi.onrender.com/api/Women';
  //private rateApiUrl = 'https://localhost:7099/api/WomanRates';
  private rateApiUrl = 'https://womenapi.onrender.com/api/WomanRates';
  // --- CRUD Operations ---

  getWomen(): Observable<Woman[]> {
    return this.http.get<Woman[]>(this.apiUrl);
  }

  getWomanById(id: number): Observable<Woman> {
    return this.http.get<Woman>(`${this.apiUrl}/${id}`);
  }

  createWoman(woman: Omit<Woman, 'id'>): Observable<Woman> {
    return this.http.post<Woman>(this.apiUrl, woman);
  }

  updateWoman(id: number, woman: Woman): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, woman);
  }

  deleteWoman(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // --- Rating Operations ---

  addRating(dto: CreateRateDto): Observable<void> {
    return this.http.post<void>(this.rateApiUrl, dto);
  }

  getAverageRating(womanId: number): Observable<WomanRatingSummary> {
    return this.http.get<WomanRatingSummary>(`${this.rateApiUrl}/average/${womanId}`);
  }

  getAllAverageRatings(): Observable<WomanRatingSummary[]> {
    return this.http.get<WomanRatingSummary[]>(`${this.rateApiUrl}/averages`);
  }
}