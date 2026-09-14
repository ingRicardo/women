import { ChangeDetectorRef, Component, computed, effect, ElementRef, inject, model, OnInit, signal, ViewChild } from '@angular/core';
import { WomanService } from '../../services/woman.service';
import { WomanRatesService } from '../../services/woman-rates.service';
import { Woman } from '../models/woman.model';
import { NgOptimizedImage } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, } from '@angular/forms';
import { WomanRatingSummaryDto } from '../models/woman-rate.model';
import { catchError, retry, throwError, timeout } from 'rxjs';

@Component({
  selector: 'app-womanmain',
  imports: [NgOptimizedImage, FormsModule],
  standalone: true,
  templateUrl: './womanmain.html',
  styleUrl: './womanmain.css',
})

export class Womanmain implements OnInit {

  @ViewChild('womanName') womanNameElement!: ElementRef<HTMLInputElement>;
  @ViewChild('womanId') womanIdElement!: ElementRef<HTMLInputElement>;
  @ViewChild('womanAvatar') womanAvatarElement!: ElementRef<HTMLInputElement>;
  @ViewChild('womanStatus') womanStatusElement!: ElementRef<HTMLSelectElement>;
  @ViewChild('womanBirthday') womanBirthdayElement!: ElementRef<HTMLInputElement>;
  @ViewChild('womanCountry') womanCountryElement!: ElementRef<HTMLInputElement>;
  @ViewChild('womanRace') womanRaceElement!: ElementRef<HTMLSelectElement>;
  @ViewChild('womanEmail') womanEmailElement!: ElementRef<HTMLInputElement>;
  @ViewChild('womanAge') womanAgeElement!: ElementRef<HTMLInputElement>;

  private womenService = inject(WomanService);
  private womenRateService = inject(WomanRatesService);

  women = signal<Woman[]>([]);
  isLoading = signal<boolean>(false);
  //isAddopen = signal<boolean>(false);
  isNew = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  isWomanDisplayed = signal<boolean>(true);
  alertMessage = signal<string | null>(null);
  alertType = signal<'success' | 'error' | null>(null);
  isRateLoading = signal<boolean>(false);


  name = model('');
  avatar = model('');
  age = model(0);
  status = model('');
  dateOfBirth = model('');
  country = model('');
  race = model('');
  email = model('');

  currentPage = signal(1);
  pageSize = signal(5);
  selectedRate = model(0);
  totalPages = computed(() => Math.ceil(this.women().length / this.pageSize()));

  selectedWoman = signal<Woman | null>(null);
  selectedRowId: number | null = null;

  ngOnInit(): void {
    this.loadWomen();
    this.getAllWomanRates();
  }
  constructor() {
    effect(() => {
      const currentWomenList = this.women();
      console.log('The women list has changed!', currentWomenList);
      this.isLoading.set(false);
      const womanRates = this.getAllWomanRates();
      console.log('The Women Rates list has changed!', womanRates);
      this.isRateLoading.set(false);

    });
  }
  /*
  womanRate: number = 0;

  getWomanRate(woman: Woman) {
    // const womanId = this.selectedWoman()?.id; 

    // if (womanId !== undefined) { 
    console.log("womanId ====: ", woman.id);
    if (woman.id === undefined) {
      console.warn('Skipping service call because woman.id is undefined!');
      return;
    }

    this.womenRateService.getAverageRateForWoman(woman.id).pipe(
      retry({ count: 1, delay: 2000 }), // Reduced retries so you don't wait forever while debugging
      timeout(120000),                  // Increased to 120 seconds
      catchError((err) => throwError(() => err))
    ).subscribe({
      next: (summary: WomanRatingSummaryDto) => {
        console.log(summary);
        // 2. Extract the numeric property from the DTO (e.g., summary.averageRate or summary.rate)
        this.womanRate = summary.averageRate;
        console.log(this.womanRate);
      },
      error: (err) => {
        console.error('Error fetching woman rate:', err);
      }
    });
    //} 
  }*/
  womanRatesSignal = signal<WomanRatingSummaryDto[]>([]);

  getAllWomanRates() {
    this.isRateLoading.set(true);
    this.womenRateService.getAllAverageRates().pipe(
      retry({ count: 1, delay: 2000 }), // Reduced retries so you don't wait forever while debugging
      timeout(120000),                  // Increased to 120 seconds
      catchError((err) => throwError(() => err))
    ).subscribe({
      next: (response) => {
        console.log("ALL woman rates response ", response);
        this.isRateLoading.set(true);

        this.womanRatesSignal.set(response);
      }, error: (err) => {
        console.error('Error fetching ALL woman rates:', err);
        this.isRateLoading.set(true);

      }
    })
      this.isRateLoading.set(false);

  }
  rateList: number[] = Array.from({ length: 11 }, (_, i) => i);
  
  addRate(womanId : number){
    console.log("add rate: ",this.selectedRate());
    const dto = {
      womanId: womanId,
      rate: this.selectedRate(),
    };
    console.log(dto.rate, dto.womanId);
      this.isRateLoading.set(true);
      this.womenRateService.addRate(dto).pipe(
      retry({ count: 1, delay: 2000 }), // Reduced retries so you don't wait forever while debugging
      timeout(120000),                  // Increased to 120 seconds
      catchError((err) => throwError(() => err))
    ).subscribe({
      next: (response) => {
        console.log("ADD woman rate response ", response);
        //this.womanRatesSignal.set(response);
        this.showAlert("Woman rate added successfully!", "success");
        this.isRateLoading.set(false);
      }, error: (err) => {
        console.error('Error ADD woman rate:', err);
        this.showAlert("Woman rate added successfully!", "success");
        //this.getAllWomanRates();
        this.isRateLoading.set(false);

      }
    });
    this.selectedRate.set(0);
    this.showAlert("Woman rate is being processing!", "success");
    this.isRateLoading.set(true);
    this.getAllWomanRates();

   }
  newWoman() {
    this.isNew.set(true);
    this.isEdit.set(false);
    this.name.set('');
    this.avatar.set('');
    this.age.set(0);
    this.status.set('');
    this.dateOfBirth.set('');
    this.country.set('');
    this.race.set('');
    this.email.set('');
  }
  editWoman() {
    this.isEdit.set(true);
    this.isNew.set(false);
  }
  canceEditWoman() {
    this.isEdit.set(false);
    this.isNew.set(false);
    this.isWomanDisplayed.set(false);
    this.selectedRowId = null;
  }

  updateWoman() {
    console.log("update " + this.isEdit());
    console.log("new " + this.isNew());

    if (this.isEdit() == true) {
      if (this.womanNameElement.nativeElement.value
        && this.womanAvatarElement.nativeElement.value && +this.womanAgeElement.nativeElement.value > 0
        && this.womanStatusElement.nativeElement.value && this.womanRaceElement.nativeElement.value
        && this.womanBirthdayElement.nativeElement.value && this.womanCountryElement.nativeElement.value
        && this.womanEmailElement.nativeElement.value
      ) {
        const womanNameValue = this.womanNameElement.nativeElement.value;
        const womanIDValue = +this.womanIdElement.nativeElement.value;
        const womanAvatarValue = this.womanAvatarElement.nativeElement.value;
        const womanAgeValue = +this.womanAgeElement.nativeElement.value;
        const womanStatusValue = this.womanStatusElement.nativeElement.value;
        const womanBirthValue = this.womanBirthdayElement.nativeElement.value;
        const womanCountryValue = this.womanCountryElement.nativeElement.value;
        const womanRaceValue = this.womanRaceElement.nativeElement.value;
        const womanEmailValue = this.womanEmailElement.nativeElement.value;

        const payload = {
          id: womanIDValue,
          name: womanNameValue, // Fallback to an empty string if null/undefined
          avatar: womanAvatarValue,
          age: womanAgeValue,
          status: womanStatusValue,
          dateOfBirth: womanBirthValue,
          country: womanCountryValue,
          race: womanRaceValue,
          email: womanEmailValue
        };
        console.log(payload);
        this.womenService.updateWomanV1(womanIDValue, payload).subscribe({
          next: (response) => {
            console.log("women updated succesfully!", response);
            this.showAlert("Woman updated successfully!", "success");
            this.loadWomen();
            this.isLoading.set(true);
            this.isEdit.set(false);
            this.isWomanDisplayed.set(false);

          },
          error: (error) => {
            this.loadWomen();
            this.isEdit.set(false);
            this.isWomanDisplayed.set(false);
            console.error('Update failed', error);
            this.showAlert("Error updating profile. Please try again.", "error");
          }
        })
        this.isLoading.set(false);
        this.isEdit.set(false);
        this.isWomanDisplayed.set(false);
        this.loadWomen();
      } else
        this.showAlert("Error updating profile. Please try again.", "error");
    }

    if (this.isNew() == true) {
      this.saveWoman();
    }
  }

  showAlert(message: string, type: 'success' | 'error') {
    this.alertMessage.set(message);
    this.alertType.set(type);

    setTimeout(() => {
      this.alertMessage.set(null);
      this.alertType.set(null);
    }, 5000);
  }

  saveWoman() {
    const payload: Omit<Woman, "id"> = {
      name: this.name(), // Fallback to an empty string if null/undefined
      avatar: this.avatar(),
      age: this.age(),
      status: this.status(),
      dateOfBirth: this.dateOfBirth(),
      country: this.country(),
      race: this.race(),
      email: this.email()
    };

    console.log("payload", payload);
    this.womenService.createWomanv1(payload).subscribe({
      next: (response) => {
        console.log("women created succesfully!", response);
        this.showAlert("Woman created successfully!", "success");
        this.name.set('');
        this.avatar.set('');
        this.age.set(0);
        this.status.set('');
        this.dateOfBirth.set('');
        this.country.set('');
        this.race.set('');
        this.email.set('');
        this.isEdit.set(false);
        this.loadWomen();
        this.isLoading.set(true);

      },
      error: (error) => {
        this.loadWomen();
        this.isEdit.set(false);
        this.isWomanDisplayed.set(false);
        console.error('Registration failed', error);
        this.showAlert("Error creating profile. Please try again.", "error");
      }
    });
    this.isLoading.set(false);
    this.isEdit.set(false);
    this.loadWomen();

  }
  loadWomen() {
    this.isWomanDisplayed.set(false);
    console.log('Fetching women data...');
    this.womenService.getWomenv1().subscribe({
      next: (data) => {
        this.women.set(data);
        console.log('Women data fetched:', this.women());
        this.isLoading.set(true);
      },
      error: (err) => {
        console.error('Error fetching women:', err);
      }
    });
    this.isLoading.set(false);
  }

  checkifloading() {
    if (this.isLoading())
      return true;
    else return false;
  }

  paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.women().slice(start, end);
  });


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

  firstPage() {
    if (this.currentPage() >= 1) {
      this.currentPage.update(p => 1);
    }
  }
  lastPage() {
    if (this.currentPage() >= 1) {
      this.currentPage.update(p => this.totalPages());
    }
  }

  onRowClick(rowData: Woman): void {
    this.selectedRowId = rowData.id;
    this.isNew.set(false);
    this.isEdit.set(false);
    this.isWomanDisplayed.set(true);
    console.log('Row Data Captured:', rowData);
    this.selectedWoman.set(rowData); // Update the signal state
    console.log("should call woman rate --");
    //this.getWomanRate(rowData);
  }


}