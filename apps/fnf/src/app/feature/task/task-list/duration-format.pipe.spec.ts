import {DurationFormatPipe} from './duration-format.pipe';

describe('DurationFormatPipe', () => {
  let pipe: DurationFormatPipe;

  beforeEach(() => {
    pipe = new DurationFormatPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null input', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined input', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return empty string for negative input', () => {
    expect(pipe.transform(-1000)).toBe('');
  });

  it('should format zero milliseconds as 00:00', () => {
    expect(pipe.transform(0)).toBe('00:00');
  });

  it('should format seconds only (less than 1 minute)', () => {
    expect(pipe.transform(5000)).toBe('00:05'); // 5 seconds
    expect(pipe.transform(30000)).toBe('00:30'); // 30 seconds
    expect(pipe.transform(59000)).toBe('00:59'); // 59 seconds
  });

  it('should format minutes and seconds (less than 1 hour)', () => {
    expect(pipe.transform(60000)).toBe('01:00'); // 1 minute
    expect(pipe.transform(90000)).toBe('01:30'); // 1 minute 30 seconds
    expect(pipe.transform(3599000)).toBe('59:59'); // 59 minutes 59 seconds
  });

  it('should format hours, minutes and seconds (1 hour or more)', () => {
    expect(pipe.transform(3600000)).toBe('01:00:00'); // 1 hour
    expect(pipe.transform(3661000)).toBe('01:01:01'); // 1 hour 1 minute 1 second
    expect(pipe.transform(7323000)).toBe('02:02:03'); // 2 hours 2 minutes 3 seconds
    expect(pipe.transform(36000000)).toBe('10:00:00'); // 10 hours
  });

  it('should handle large durations', () => {
    expect(pipe.transform(86400000)).toBe('24:00:00'); // 24 hours
    expect(pipe.transform(90061000)).toBe('25:01:01'); // 25 hours 1 minute 1 second
  });

  it('should handle milliseconds precision by flooring to seconds', () => {
    expect(pipe.transform(1999)).toBe('00:01'); // 1.999 seconds -> 1 second
    expect(pipe.transform(59999)).toBe('00:59'); // 59.999 seconds -> 59 seconds
  });
});