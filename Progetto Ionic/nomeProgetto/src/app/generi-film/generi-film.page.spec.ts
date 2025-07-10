import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GeneriFilmPage } from './generi-film.page';

describe('GeneriFilmPage', () => {
  let component: GeneriFilmPage;
  let fixture: ComponentFixture<GeneriFilmPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneriFilmPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
