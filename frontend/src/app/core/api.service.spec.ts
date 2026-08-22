import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends status and pagination parameters when listing submissions', () => {
    service.submissions('REJECTED', 2, 25).subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/v1/submissions');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('status')).toBe('REJECTED');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('25');
    request.flush({
      content: [],
      page: 2,
      size: 25,
      totalElements: 0,
      totalPages: 0,
    });
  });
});
