import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RimuoviFilmPage } from './rimuovi-film.page';

describe('RimuoviFilmPage', () => {
  let component: RimuoviFilmPage;
  let fixture: ComponentFixture<RimuoviFilmPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RimuoviFilmPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
