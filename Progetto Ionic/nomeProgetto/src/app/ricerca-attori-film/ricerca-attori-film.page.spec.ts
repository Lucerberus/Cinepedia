import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RicercaAttoriFilmPage } from './ricerca-attori-film.page';

describe('RicercaAttoriFilmPage', () => {
  let component: RicercaAttoriFilmPage;
  let fixture: ComponentFixture<RicercaAttoriFilmPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RicercaAttoriFilmPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
