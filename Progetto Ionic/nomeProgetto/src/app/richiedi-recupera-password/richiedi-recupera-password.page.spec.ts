import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RichiediRecuperaPasswordPage } from './richiedi-recupera-password.page';

describe('RichiediRecuperaPasswordPage', () => {
  let component: RichiediRecuperaPasswordPage;
  let fixture: ComponentFixture<RichiediRecuperaPasswordPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RichiediRecuperaPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
