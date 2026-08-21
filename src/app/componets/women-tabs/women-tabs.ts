 import { Component, computed, input, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
@Component({
  selector: 'app-women-tabs',
  imports: [NgOptimizedImage],
  templateUrl: './women-tabs.html',
  styleUrl: './women-tabs.css',
  standalone: true
})
export class WomenTabs {
  women = input.required<any[]>();
// Track active tab using an Angular Signal
  activeTabIndex = signal(0);
  indiandnative= 'https://www.rejectedprincesses.com/wp-content/uploads/2014/08/SageHonga.jpg'
  blackandafricanamerican= 'https://i0.wp.com/women.lifeway.com/wp-content/uploads/2025/02/black-history-month.jpg?w=600&ssl=1'
  asian= 'https://images.unsplash.com/photo-1515734674582-29010bb37906?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  caucasianwhite= 'https://as1.ftcdn.net/jpg/01/64/54/12/1000_F_164541206_Nv6WYMEuWNj3Wk9T0FBxKVRrAkqNbKXp.jpg'
  hispanicandlatino= 'https://st4.depositphotos.com/1003570/19697/i/450/depositphotos_196976748-stock-photo-beautiful-young-hispanic-latino-woman.jpg'
  tabs = [
    { label: 'Black and African American' },
    { label: 'Asian' },
    { label: 'Caucasian / White' },
    { label: 'Indigenous and Native' },
    { label: 'Hispanic and Latino' }
  ];

  // Create a computed signal filtered by race
  blackWomen = computed(() => 
    this.women().filter(woman => woman.race === 'Black' || woman.race === 'African American')
  );
  asianWomen = computed(() => 
    this.women().filter(woman => woman.race === 'Asian' )
  );
  caucasianWomen = computed(() => 
    this.women().filter(woman => woman.race === 'White' || woman.race === 'Caucasian' || woman.race === 'Caucasian / White')
  );
  indigenousWomen = computed(() => 
    this.women().filter(woman => woman.race === 'Indigenous' || woman.race === 'Native' || woman.race === 'Native American'|| woman.race === 'Alaskan Native' || woman.race === 'American Indian' || woman.race === 'American Indian or Alaska Native') 
  );
  hispanicWomen = computed(() => 
    this.women().filter(woman => woman.race === 'Hispanic' || woman.race === 'Latino' || woman.race === 'Hispanic or Latino')
  );  
}
