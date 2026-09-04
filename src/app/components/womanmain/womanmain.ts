import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import {WomanService} from '../../services/woman.service';
import { Woman } from '../models/woman.model';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-womanmain',
  imports: [ NgOptimizedImage],
  standalone: true,
  templateUrl: './womanmain.html',
  styleUrl: './womanmain.css',
})

export class Womanmain implements OnInit{
onAddWoman() {
  alert('under construction');
 }
 
  private womenService = inject(WomanService);
  women = signal<Woman[]>([]);

  ngOnInit(): void {
    console.log('Fetching women data...');
    this.womenService.getWomenv1().subscribe({
      next: (data) => {
        this.women.set(data);
       },
      error: (err) => {
        console.error('Error fetching women:', err);
      }
    });
    console.log('Women data fetched:', this.women());
  }

  currentPage = signal(1);
  pageSize = signal(5);

   paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.women().slice(start, end);
  });

   totalPages = computed(() => Math.ceil(this.women().length / this.pageSize()));

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

    // Writable signal to hold the selected row data
  selectedWoman = signal<Woman | null>(null);

  onRowClick(rowData: Woman): void {
    console.log('Row Data Captured:', rowData);
    this.selectedWoman.set(rowData); // Update the signal state
  }

}