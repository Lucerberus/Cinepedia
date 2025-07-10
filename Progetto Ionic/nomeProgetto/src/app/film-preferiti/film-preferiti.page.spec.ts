import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilmPreferitiPage } from './film-preferiti.page';

describe('FilmPreferitiPage', () => {
  let component: FilmPreferitiPage;
  let fixture: ComponentFixture<FilmPreferitiPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FilmPreferitiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
