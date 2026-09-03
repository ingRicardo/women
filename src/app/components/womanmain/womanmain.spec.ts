import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Womanmain } from './womanmain';

describe('Womanmain', () => {
  let component: Womanmain;
  let fixture: ComponentFixture<Womanmain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Womanmain]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Womanmain);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
