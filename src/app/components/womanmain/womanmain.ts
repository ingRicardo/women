import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import {WomanService} from '../../services/woman.service';
import { Woman } from '../models/woman.model';
import {NgOptimizedImage} from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule,Validators } from '@angular/forms'; 

@Component({
  selector: 'app-womanmain',
  imports: [ NgOptimizedImage, ReactiveFormsModule],
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

   womanForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    avatar: new FormControl('', [Validators.required]),
    age: new FormControl(null, [Validators.min(0)]),
    status: new FormControl('', [Validators.required]),
    dateOfBirth: new FormControl('', [Validators.required]),
    country: new FormControl('', [Validators.required],), 
    race: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email])
   });

   onSubmit() {
    if (this.womanForm.valid) {
      console.log('Form Submitted:', this.womanForm.value);      
      // Perform your API call or backend submission here

      this.womanForm.reset(); // Reset the form after submission
    }else {
      console.log('Form is invalid. Please fill out all required fields correctly.');
      this.womanForm.markAllAsTouched(); // Mark all fields as touched to show validation errors
    }


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
    this.closeForm(); // Close the form when a row is clicked
  }

 
 
   // Track whether the form is visible using a Signal
  isFormOpen = signal<boolean>(false);

  openForm() {
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
  }

}