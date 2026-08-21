import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Womenregister } from './womenregister';

describe('Womenregister', () => {
  let component: Womenregister;
  let fixture: ComponentFixture<Womenregister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Womenregister]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Womenregister);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
