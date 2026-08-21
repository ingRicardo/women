import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Adminsection } from './adminsection';

describe('Adminsection', () => {
  let component: Adminsection;
  let fixture: ComponentFixture<Adminsection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Adminsection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Adminsection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
