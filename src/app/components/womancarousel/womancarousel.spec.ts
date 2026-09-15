import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Womancarousel } from './womancarousel';

describe('Womancarousel', () => {
  let component: Womancarousel;
  let fixture: ComponentFixture<Womancarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Womancarousel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Womancarousel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
