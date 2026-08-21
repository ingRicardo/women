import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Imagecarouselv1 } from '../imagecarouselv1/imagecarouselv1';
import { FormsModule } from '@angular/forms';
import {  WomanList } from '../woman-list/woman-list';
import { WellnessChatbotComponent } from '../wellness-chatbot.component/wellness-chatbot.component';

interface RaceItem {
  id: string;
  name: string;
  image: string;
  description: string;
  rate: number; // Added rating property
}


@Component({
  selector: 'app-publicsection',
  imports: [CommonModule, FormsModule, WomanList, WellnessChatbotComponent, Imagecarouselv1],
  templateUrl: './publicsection.html',
  styleUrl: './publicsection.css',
})
export class Publicsection {
  username: string | null = null;
  password: string | null = null;
  role: string | null = null;
  private user = inject(ActivatedRoute);
  private passwordParam = inject(ActivatedRoute);
  private router = inject(Router);
slides = [
  // Hispanic/Latina woman
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&h=400&q=80',
  
  // Black/African American woman
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&h=400&q=80',
  
  // East Asian woman
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&h=400&q=80',
  
  // South Asian woman
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&h=400&q=80',
  
  // White/Caucasian woman
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&h=400&q=80',
  
  // Middle Eastern/North African woman
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&h=400&q=80'
];
  // Angular 21 Signal containing race variables
 // Race data list
  races = signal<RaceItem[]>([
    {
      id: 'asian',
      rate: Math.floor(Math.random() * 11),
      name: 'Asian',
      image: 'https://images.unsplash.com/photo-1515734674582-29010bb37906?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      description: 'Asian women represent a rich tapestry of cultures, languages, and heritages spanning across East, South, Southeast, and Central Asia.'
    },
    {
      id: 'black',
      rate: Math.floor(Math.random() * 11),
      name: 'Black',
      image: 'https://i0.wp.com/women.lifeway.com/wp-content/uploads/2025/02/black-history-month.jpg?w=600&ssl=1',
      description: 'Black women encompass diverse African, Afro-Caribbean, and African American cultures, celebrated worldwide for resilient leadership and creative legacies.'
    },
    {
      id: 'hispanic',
      rate: Math.floor(Math.random() * 11),
      name: 'Hispanic / Latina',
      image: 'https://st4.depositphotos.com/1003570/19697/i/450/depositphotos_196976748-stock-photo-beautiful-young-hispanic-latino-woman.jpg',
      description: 'Hispanic and Latina women reflect vibrant traditions across Latin America and Spain, characterized by rich artistic expressions and strong family heritage.'
    },
    {
      id: 'white',
      rate: Math.floor(Math.random() * 11),
      name: 'Caucasian / White',
      image: 'https://as1.ftcdn.net/jpg/01/64/54/12/1000_F_164541206_Nv6WYMEuWNj3Wk9T0FBxKVRrAkqNbKXp.jpg',
      description: 'Caucasian women encompass multifaceted cultural traditions originating from various European, North American, and global regions.'
    },
    {
      id: 'indigenous',
      rate: Math.floor(Math.random() * 11),
      name: 'Indigenous',
      image: 'https://www.rejectedprincesses.com/wp-content/uploads/2014/08/SageHonga.jpg',
      description: 'Indigenous women hold vital cultural knowledge, preserving traditional ecological wisdom, sovereignty, and ancestral legacy across native lands globally.'
    }
  ]);

 // Track the currently selected race (null if none selected)
  selectedRace = signal<RaceItem | null>(null);

  selectRace(race: RaceItem) {
    // Toggle selection if clicking the same item twice
    if (this.selectedRace()?.id === race.id) {
      this.selectedRace.set(null);
    } else {
      this.selectedRace.set(race);
    }
  }
  goToAdminSection() {
    console.log('Navigating to admin section with username:', this.username, 'password:', this.password, 'role:', this.role);
    this.router.navigate(['/adminsec'], {
      queryParams: { user: this.username, password: this.password, role: this.role },
    });
  }
  ngOnInit() {
 
    this.username = this.user.snapshot.queryParamMap.get('user');
    this.password = this.passwordParam.snapshot.queryParamMap.get('password');
    this.role = this.user.snapshot.queryParamMap.get('role');
    console.log('Username:', this.username);
    console.log('Password:', this.password);
    console.log('Role:', this.role);
  }

  logout() {
    // Redirect to the login page
    
    this.router.navigate(['']);
    console.log('Logout successful');


  }

  selectedRaceRan = signal<RaceItem | null>(null);

  // Store ratings mapped by race ID: { [id: string]: number }
  ratingsMap = signal<Record<string, number>>({});

  // Temporary rating input state
   tempRating: number = 0;
  // Modal display state signals
  showPopup = signal<boolean>(false);
  submittedData = signal<{ name: string; rating: number } | null>(null);

  // Computed signal to get the current selected item's rating
  currentRating = computed(() => {
    const activeRace = this.selectedRaceRan();
    if (!activeRace) return null;
    return this.ratingsMap()[activeRace.id] ?? 0;
  });

  // Action to pick a random race item
  selectRandomRace(): void {
    const items = this.races();
    if (items.length === 0) return;

    const randomIndex = Math.floor(Math.random() * items.length);
    //this.selectedRace.set(items[randomIndex]);
    const chosen = items[randomIndex];
     this.selectedRaceRan.set(chosen);
    // Pre-fill input with previous submitted rating, or default to 0
    this.tempRating = this.ratingsMap()[chosen.id] ?? 0;
  }

  // Update rating for the active item while clamping values between 0 and 10
 /* onRatingChange(value: number): void {
    const activeRace = this.selectedRaceRan();
    if (!activeRace) return;

    const clampedValue = Math.min(10, Math.max(0, value || 0));

    this.ratingsMap.update(ratings => ({
      ...ratings,
      [activeRace.id]: clampedValue
    }));
  }
*/
  
submitRating(): void {
    const activeRace = this.selectedRaceRan();
    if (!activeRace) return;

    // Clamp input to 0 - 10
    const clampedValue = Math.min(10, Math.max(0, Number(this.tempRating) || 0));

    // Save to signal store
    this.ratingsMap.update(ratings => ({
      ...ratings,
      [activeRace.id]: clampedValue
    }));

    // Trigger confirmation modal
    this.submittedData.set({
      name: activeRace.name,
      rating: clampedValue
    });
    this.showPopup.set(true);
  }

  closePopup(): void {
    this.showPopup.set(false);
  }  

}
