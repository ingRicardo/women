 import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WomanRatesService } from '../../services/woman-rates.service';
import { WomanRatingSummaryDto } from '../models/woman-rate.model';
import { Woman } from '../models/woman.model'; // Your existing Woman interface
import { WomanService } from '../../services/woman.service';


@Component({
  selector: 'app-woman-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './woman-list.html',
  styleUrl: './woman-list.css',
})
export class WomanList implements OnInit{

private readonly ratesService = inject(WomanRatesService);
private readonly womanService = inject(WomanService);

  // Signals
  women = signal<Woman[]>([]);
  ratingsMap = signal<Map<number, WomanRatingSummaryDto>>(new Map());
  
  // Form State
  selectedWomanForRating = signal<Woman | null>(null);
  selectedRate = signal<number>(5);

  ngOnInit(): void {
    this.loadWomen();
    this.loadRatings();
  }

  loadWomen(): void {
    this.womanService.getWomen().subscribe({
      next: (data) => this.women.set(data),
      error: (err) => console.error('Failed to load women list:', err)
    });
  }

  loadRatings(): void {
    this.ratesService.getAllAverageRates().subscribe({
      next: (summaries) => {
        const map = new Map<number, WomanRatingSummaryDto>();
        summaries.forEach(s => map.set(s.womanId, s));
        this.ratingsMap.set(map);
      },
      error: (err) => console.error('Failed to load ratings summary:', err)
    });
  }

  openRateModal(woman: Woman): void {
    this.selectedWomanForRating.set(woman);
    this.selectedRate.set(5);
  }

  closeRateModal(): void {
    this.selectedWomanForRating.set(null);
  }

  submitRating(): void {
    const woman = this.selectedWomanForRating();
    if (!woman) return;

    const dto = {
      womanId: woman.id,
      rate: this.selectedRate()
    };

    this.ratesService.addRate(dto).subscribe({
      next: () => {
        this.ratesService.getAverageRateForWoman(woman.id).subscribe(updatedSummary => {
          this.ratingsMap.update(map => {
            const newMap = new Map(map);
            newMap.set(woman.id, updatedSummary);
            return newMap;
          });
        });
        this.closeRateModal();
      },
      error: (err) => console.error('Error adding rating:', err)
    });
  }
}
