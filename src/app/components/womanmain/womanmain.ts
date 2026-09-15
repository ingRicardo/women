import { ChangeDetectorRef, Component, computed, effect, ElementRef, inject, model, OnInit, signal, ViewChild } from '@angular/core';
import { WomanService } from '../../services/woman.service';
import { WomanRatesService } from '../../services/woman-rates.service';
import { Woman } from '../models/woman.model';
import { NgOptimizedImage } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, } from '@angular/forms';
import { WomanRatingSummaryDto } from '../models/woman-rate.model';
import { catchError, retry, throwError, timeout } from 'rxjs';
import { Womancarousel, CarouselSlide } from '../womancarousel/womancarousel';

@Component({
  selector: 'app-womanmain',
  imports: [NgOptimizedImage, FormsModule, Womancarousel],
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
  showRate = signal<boolean>(false);

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
  carouselSlides = computed<CarouselSlide[]>(() =>
    this.women().map(woman => ({
      image: woman.avatar ?? 'assets/default-avatar.png',
      alt: woman.name,
      name: woman.name
    }))
  );


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

  onDateChange(dobString: string): void {
    if (!dobString) {
      this.age.set(0);
      return;
    }
    this.age.set(this.calculateAge(dobString));
  }

   private calculateAge(dobString: string): number {
    const today = new Date();
    const birthDate = new Date(dobString);

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // If the current month is before the birth month, 
    // or if it's the birth month but the current day is before the birth day,
    // the user hasn't had their birthday yet this year.
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  onSubmitWoman(dialog: HTMLDialogElement) {

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
       // this.isEdit.set(false);
       // this.isWomanDisplayed.set(false);
        console.error('Registration failed', error);
        this.showAlert("Error creating profile. Please try again.", "error");
        this.name.set('');
        this.avatar.set('');
        this.age.set(0);
        this.status.set('');
        this.dateOfBirth.set('');
        this.country.set('');
        this.race.set('');
        this.email.set('');
        this.isEdit.set(false);
      }
    });
    this.loadWomen();

    // Close the dialog after submission
    dialog.close();
  }

  womanRatesSignal = signal<WomanRatingSummaryDto[]>([]);

  getAllWomanRates() {
    this.isRateLoading.set(false);
    this.womenRateService.getAllAverageRates().pipe(
      retry({ count: 1, delay: 2000 }), // Reduced retries so you don't wait forever while debugging
      timeout(120000),                  // Increased to 120 seconds
      catchError((err) => throwError(() => err))
    ).subscribe({
      next: (response) => {
        console.log("ALL woman rates response ", response);
        this.isRateLoading.set(false);

        this.womanRatesSignal.set(response);
      }, error: (err) => {
        console.error('Error fetching ALL woman rates:', err);
        this.isRateLoading.set(false);

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
      this.isRateLoading.set(false);
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
       // this.showAlert("Error adding rate. Please try again.", "error");
        //this.getAllWomanRates();
        this.isRateLoading.set(false);

      }
    });
    this.selectedRate.set(0);
    this.showAlert("Woman rate is being processing!", "success");
    this.isRateLoading.set(false);
   // this.getAllWomanRates();

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
    this.showRate.set(false);

  }
  editWoman() {
    this.isEdit.set(true);
    this.isNew.set(false);
    this.showRate.set(false);

  }
  canceEditWoman() {
    this.isEdit.set(false);
    this.isNew.set(false);
    this.isWomanDisplayed.set(false);
    this.selectedRowId = null;
    this.showRate.set(false);
    this.isLoading.set(false);

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
    this.isRateLoading.set(false);
  }

  checkifloading() {
    if (this.isLoading())
      return true;
    else return false;
  }
  checkifrateloading() {
    if (this.isRateLoading())
      return true;
    else return false;
  }

  // 2. Query & Pagination State
  searchQuery = signal<string>('');
 // currentPage = signal<number>(1);
 // pageSize = signal<number>(3); // Set low to easily demonstrate pagination transitions

  // 3. Middle Tier: Compute the filtered subset before slicing into pages
  filteredWomen = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const rawList = this.women();

    if (!query) return rawList;

    return rawList.filter(woman =>
      woman.name.toLowerCase().includes(query) ||
      woman.email.toLowerCase().includes(query) ||
      woman.status.toLowerCase().includes(query)
    );
  });

  // 4. Top Tier: Slice the filtered subset for the view
  paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredWomen().slice(start, end);
  });

  // 5. Statistics Derived Signals
  totalFilteredPages = computed(() => {
    return Math.ceil(this.filteredWomen().length / this.pageSize()) || 1;
  });

  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  endIndex = computed(() => {
    const totalOnPage = this.currentPage() * this.pageSize();
    const maxTotal = this.filteredWomen().length;
    return totalOnPage > maxTotal ? maxTotal : totalOnPage;
  });

  // Helper method to reset page when text changes
  onSearchChange(newQuery: string) {
    this.searchQuery.set(newQuery);
    this.currentPage.set(1); // Reset to page 1 to protect layout bounds
  }



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
    this.showRate.set(true);
    this.isLoading.set(false);

  }


}