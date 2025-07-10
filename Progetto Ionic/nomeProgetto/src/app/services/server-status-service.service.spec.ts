import { TestBed } from '@angular/core/testing';

import { ServerStatusServiceService } from './server-status-service.service';

describe('ServerStatusServiceService', () => {
  let service: ServerStatusServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServerStatusServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
