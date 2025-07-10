import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RimuoviAttorePage } from './rimuovi-attore.page';

describe('RimuoviAttorePage', () => {
  let component: RimuoviAttorePage;
  let fixture: ComponentFixture<RimuoviAttorePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RimuoviAttorePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
