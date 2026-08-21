import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Imagecarouselv1 } from './imagecarouselv1';

describe('Imagecarouselv1', () => {
  let component: Imagecarouselv1;
  let fixture: ComponentFixture<Imagecarouselv1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Imagecarouselv1]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Imagecarouselv1);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
