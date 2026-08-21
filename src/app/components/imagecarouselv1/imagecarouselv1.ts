import { Component, input, signal } from '@angular/core';


@Component({
  selector: 'app-imagecarouselv1',
  imports: [],
  templateUrl: './imagecarouselv1.html',
  styleUrl: './imagecarouselv1.css',
  standalone: true
})
export class Imagecarouselv1 {
images = input.required<string[]>();
  currentIndex = signal(0);

  next() {
    this.currentIndex.update(i => (i + 1) % this.images().length);
  }

  prev() {
    this.currentIndex.update(i => (i - 1 + this.images().length) % this.images().length);
  }

  goToIndex(index: number) {
    this.currentIndex.set(index);
  }
}
