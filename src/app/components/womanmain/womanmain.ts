import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
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
 
}