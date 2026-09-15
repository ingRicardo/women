import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CarouselSlide {
  image: string;
  alt: string;
  name: string;
}

@Component({
  selector: 'app-womancarousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './womancarousel.html',
  styleUrl: './womancarousel.css',
})
export class Womancarousel {
 @Input({ required: true }) slides: CarouselSlide[] = [];
  
  // Track state cleanly using Angular Signals
  currentIndex = signal(0);

  // Compute transform style for smooth sliding
  transformStyle = computed(() => `translateX(-${this.currentIndex() * 100}%)`);

  nextSlide(): void {
    const nextIndex = this.currentIndex() === this.slides.length - 1 ? 0 : this.currentIndex() + 1;
    this.currentIndex.set(nextIndex);
  }

  prevSlide(): void {
    const prevIndex = this.currentIndex() === 0 ? this.slides.length - 1 : this.currentIndex() - 1;
    this.currentIndex.set(prevIndex);
  }

  goToSlide(index: number): void {
    this.currentIndex.set(index);
  }

}
