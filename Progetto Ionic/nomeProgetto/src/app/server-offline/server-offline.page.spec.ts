import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServerOfflinePage } from './server-offline.page';

describe('ServerOfflinePage', () => {
  let component: ServerOfflinePage;
  let fixture: ComponentFixture<ServerOfflinePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerOfflinePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
