import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/services/lru_cache.dart';
import 'package:smog_shield/services/rate_limiter.dart';

void main() {
  group('LruCache', () {
    test('evicts least recently used entry and refreshes recency on get', () {
      final LruCache<String, int> cache = LruCache<String, int>(capacity: 2);
      cache.put('a', 1);
      cache.put('b', 2);
      expect(cache.get('a'), 1);
      cache.put('c', 3);

      expect(cache.get('b'), isNull);
      expect(cache.get('a'), 1);
      expect(cache.get('c'), 3);
      expect(cache.length, 2);

      cache.remove('a');
      expect(cache.length, 1);
      cache.clear();
      expect(cache.length, 0);
    });

    test('stableHash produces deterministic hex keys', () {
      final String h1 = LruCache.stableHash('Delhi|312|poor');
      final String h2 = LruCache.stableHash('Delhi|312|poor');
      final String h3 = LruCache.stableHash('Delhi|112|moderate');
      expect(h1, h2);
      expect(h1, isNot(h3));
      expect(h1.length, 8);
    });
  });

  group('RateLimiter', () {
    test('enforces cooldown and sliding-window caps using injected clock', () {
      DateTime clock = DateTime(2026, 11, 20, 10);
      final RateLimiter limiter = RateLimiter(
        now: () => clock,
        cooldown: const Duration(seconds: 5),
        window: const Duration(minutes: 1),
        maxRequestsPerWindow: 2,
      );

      expect(limiter.tryAcquire(), isTrue);
      expect(limiter.tryAcquire(), isFalse);
      expect(limiter.remainingWait(), const Duration(seconds: 5));

      clock = clock.add(const Duration(seconds: 5));
      expect(limiter.tryAcquire(), isTrue);

      clock = clock.add(const Duration(seconds: 10));
      expect(limiter.tryAcquire(), isFalse);
      expect(limiter.remainingWait(), const Duration(seconds: 45));

      clock = clock.add(const Duration(seconds: 50));
      expect(limiter.tryAcquire(), isTrue);
      limiter.reset();
      expect(limiter.remainingWait(), Duration.zero);
    });
  });
}
