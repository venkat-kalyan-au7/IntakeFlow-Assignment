import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToastService } from './feedback.service';
import { authInterceptor } from './http.interceptor';

describe('authInterceptor feedback', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let toasts: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
  });

  afterEach(() => http.verify());

  it('turns a problem response into a clear error toast', () => {
    client.get('/api/v1/example').subscribe({ error: () => undefined });
    http
      .expectOne('/api/v1/example')
      .flush(
        { title: 'Validation failed', detail: 'Choose a valid option.' },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(toasts.messages()[0]).toMatchObject({
      kind: 'error',
      title: 'Validation failed',
      message: 'Choose a valid option.',
    });
  });
});
