import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CaricaFilmPage } from './carica-film.page';

describe('CaricaFilmPage', () => {
  let component: CaricaFilmPage;
  let fixture: ComponentFixture<CaricaFilmPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CaricaFilmPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
