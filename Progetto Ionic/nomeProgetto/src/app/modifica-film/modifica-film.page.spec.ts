import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModificaFilmPage } from './modifica-film.page';

describe('ModificaFilmPage', () => {
  let component: ModificaFilmPage;
  let fixture: ComponentFixture<ModificaFilmPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificaFilmPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
