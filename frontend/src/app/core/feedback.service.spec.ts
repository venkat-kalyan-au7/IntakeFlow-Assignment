import { LoadingService, ToastService } from './feedback.service';

describe('ToastService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows and automatically dismisses a success message', () => {
    const service = new ToastService();
    service.success('Saved', 'The record was stored.');
    expect(service.messages()).toHaveLength(1);
    expect(service.messages()[0]).toMatchObject({ kind: 'success', title: 'Saved' });
    vi.advanceTimersByTime(4000);
    expect(service.messages()).toHaveLength(0);
  });

  it('keeps only the four most recent messages', () => {
    const service = new ToastService();
    for (let index = 1; index <= 5; index++) service.info(`Message ${index}`);
    expect(service.messages().map((toast) => toast.title)).toEqual([
      'Message 2',
      'Message 3',
      'Message 4',
      'Message 5',
    ]);
  });
});

describe('LoadingService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => vi.useRealTimers());

  it('does not flash for requests completed within the delay', () => {
    const service = new LoadingService();
    service.begin();
    vi.advanceTimersByTime(100);
    service.end();
    vi.runAllTimers();
    expect(service.visible()).toBe(false);
  });

  it('shows for slower requests and observes a minimum visible duration', () => {
    const service = new LoadingService();
    service.begin();
    vi.advanceTimersByTime(180);
    expect(service.visible()).toBe(true);
    service.end();
    vi.advanceTimersByTime(239);
    expect(service.visible()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(service.visible()).toBe(false);
  });
});
