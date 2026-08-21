import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Publicsection } from './publicsection';

describe('Publicsection', () => {
  let component: Publicsection;
  let fixture: ComponentFixture<Publicsection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Publicsection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Publicsection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
