import 'dart:collection';

import '../core/constants.dart';

/// Client-side rate limiter enforcing cooldown and sliding-window caps.
class RateLimiter {
  /// Creates a [RateLimiter] with an injectable [now] clock for testing.
  RateLimiter({
    DateTime Function()? now,
    this.cooldown = AppConstants.aiCooldown,
    this.window = AppConstants.aiRateWindow,
    this.maxRequestsPerWindow = AppConstants.aiMaxRequestsPerWindow,
  }) : _now = now ?? DateTime.now;

  final DateTime Function() _now;

  /// Minimum interval required between consecutive allowed requests.
  final Duration cooldown;

  /// Sliding window duration for [maxRequestsPerWindow].
  final Duration window;

  /// Maximum requests allowed within [window].
  final int maxRequestsPerWindow;

  final Queue<DateTime> _timestamps = Queue<DateTime>();

  /// Attempts to consume one request slot; returns true if permitted.
  bool tryAcquire() {
    final DateTime current = _now();
    _pruneOld(current);
    if (_timestamps.isNotEmpty) {
      final DateTime last = _timestamps.last;
      if (current.difference(last) < cooldown) {
        return false;
      }
    }
    if (_timestamps.length >= maxRequestsPerWindow) {
      return false;
    }
    _timestamps.addLast(current);
    return true;
  }

  /// Returns remaining cooldown duration before the next slot opens.
  Duration remainingWait() {
    final DateTime current = _now();
    _pruneOld(current);
    if (_timestamps.isEmpty) {
      return Duration.zero;
    }
    final Duration sinceLast = current.difference(_timestamps.last);
    if (sinceLast < cooldown) {
      return cooldown - sinceLast;
    }
    if (_timestamps.length >= maxRequestsPerWindow) {
      final Duration sinceOldest = current.difference(_timestamps.first);
      return sinceOldest < window ? window - sinceOldest : Duration.zero;
    }
    return Duration.zero;
  }

  /// Resets all tracked timestamps.
  void reset() => _timestamps.clear();

  void _pruneOld(DateTime current) {
    while (_timestamps.isNotEmpty &&
        current.difference(_timestamps.first) >= window) {
      _timestamps.removeFirst();
    }
  }
}
