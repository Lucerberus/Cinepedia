import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttoreDettagliPage } from './attore-dettagli.page';

describe('AttoreDettagliPage', () => {
  let component: AttoreDettagliPage;
  let fixture: ComponentFixture<AttoreDettagliPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AttoreDettagliPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
