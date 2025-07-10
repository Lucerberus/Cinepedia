import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilmDettagliPage } from './film-dettagli.page';

describe('FilmDettagliPage', () => {
  let component: FilmDettagliPage;
  let fixture: ComponentFixture<FilmDettagliPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FilmDettagliPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
