import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfermaEmailPage } from './conferma-email.page';

describe('ConfermaEmailPage', () => {
  let component: ConfermaEmailPage;
  let fixture: ComponentFixture<ConfermaEmailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfermaEmailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
