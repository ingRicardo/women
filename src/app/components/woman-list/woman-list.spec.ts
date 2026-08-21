import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WomanList } from './woman-list';

describe('WomanList', () => {
  let component: WomanList;
  let fixture: ComponentFixture<WomanList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WomanList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WomanList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
