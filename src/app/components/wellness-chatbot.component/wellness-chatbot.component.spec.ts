import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WellnessChatbotComponent } from './wellness-chatbot.component';

describe('WellnessChatbotComponent', () => {
  let component: WellnessChatbotComponent;
  let fixture: ComponentFixture<WellnessChatbotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WellnessChatbotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WellnessChatbotComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
