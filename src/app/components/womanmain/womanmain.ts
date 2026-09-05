import { ChangeDetectorRef, Component, computed, inject, model, OnInit, signal } from '@angular/core';
import {WomanService} from '../../services/woman.service';
import { Woman } from '../models/woman.model';
import {NgOptimizedImage} from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule,Validators } from '@angular/forms'; 

@Component({
  selector: 'app-womanmain',
  imports: [ NgOptimizedImage, FormsModule],
  standalone: true,
  templateUrl: './womanmain.html',
  styleUrl: './womanmain.css',
})

export class Womanmain implements OnInit{

  private womenService = inject(WomanService);
  women = signal<Woman[]>([]);
  
   ngOnInit(): void {
    this.loadWomen();
   }
   
    name = model('');
    avatar = model('');
    age = model(0);
    status = model('');
    dateOfBirth = model('');
    country = model('');
    race = model('');
    email = model('');
    
   saveWoman() {
 

      const payload: Omit<Woman, "id"> = {
        name: this.name(), // Fallback to an empty string if null/undefined
        avatar: this.avatar() ,
        age: this.age(),
        status:this.status(),
        dateOfBirth: this.dateOfBirth(),
        country: this.country(),
        race: this.race(),
        email: this.email()
      };

      console.log("payload", payload);
      this.womenService.createWomanv1(payload).subscribe({
        next: (response) => {
          console.log("women created succesfully!", response);
          alert("women created succesfully!");
          this.loadWomen();
        },
        error: (error) => {
          this.loadWomen();
          console.error('Registration failed', error);
          alert("women created succesfully");
        }
      });
        this.loadWomen();
   }
   loadWomen() {
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