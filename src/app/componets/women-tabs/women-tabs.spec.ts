import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WomenTabs } from './women-tabs';

describe('WomenTabs', () => {
  let component: WomenTabs;
  let fixture: ComponentFixture<WomenTabs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WomenTabs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WomenTabs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
