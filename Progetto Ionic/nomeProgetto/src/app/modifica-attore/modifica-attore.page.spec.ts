import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModificaAttorePage } from './modifica-attore.page';

describe('ModificaAttorePage', () => {
  let component: ModificaAttorePage;
  let fixture: ComponentFixture<ModificaAttorePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificaAttorePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
