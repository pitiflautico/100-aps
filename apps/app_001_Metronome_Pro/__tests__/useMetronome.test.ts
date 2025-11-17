/**
 * Tests for useMetronome hook
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useMetronome } from '../hooks/useMetronome';

describe('useMetronome', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMetronome());

    expect(result.current.bpm).toBe(120);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentBeat).toBe(0);
    expect(result.current.timeSignature).toBe('4/4');
  });

  it('should increase BPM', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.increaseBpm();
    });

    expect(result.current.bpm).toBe(121);
  });

  it('should decrease BPM', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.decreaseBpm();
    });

    expect(result.current.bpm).toBe(119);
  });

  it('should not go below minimum BPM', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.setBpm(30); // Below min
    });

    expect(result.current.bpm).toBe(40); // Should be clamped to min
  });

  it('should not exceed maximum BPM', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.setBpm(300); // Above max
    });

    expect(result.current.bpm).toBe(240); // Should be clamped to max
  });

  it('should start playing', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.start();
    });

    expect(result.current.isPlaying).toBe(true);
  });

  it('should stop playing', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.start();
      result.current.stop();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentBeat).toBe(0);
  });

  it('should toggle play state', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('should change time signature', () => {
    const { result } = renderHook(() => useMetronome());

    act(() => {
      result.current.setTimeSignature('3/4');
    });

    expect(result.current.timeSignature).toBe('3/4');
  });
});
