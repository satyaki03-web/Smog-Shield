import 'dart:collection';

/// Bounded O(1) Least Recently Used (LRU) in-memory cache.
class LruCache<K, V> {
  /// Creates an [LruCache] holding at most [capacity] entries.
  LruCache({required this.capacity}) : assert(capacity > 0);

  /// Maximum number of entries retained before evicting the oldest entry.
  final int capacity;

  final LinkedHashMap<K, V> _store = LinkedHashMap<K, V>();

  /// Current number of cached entries.
  int get length => _store.length;

  /// Retrieves [key] and marks it most recently used, or returns null.
  V? get(K key) {
    if (!_store.containsKey(key)) {
      return null;
    }
    final V value = _store.remove(key) as V;
    _store[key] = value;
    return value;
  }

  /// Stores [value] under [key], evicting the least recently used if full.
  void put(K key, V value) {
    if (_store.containsKey(key)) {
      _store.remove(key);
    } else if (_store.length >= capacity) {
      _store.remove(_store.keys.first);
    }
    _store[key] = value;
  }

  /// Removes [key] from the cache if present.
  void remove(K key) {
    _store.remove(key);
  }

  /// Clears all cached entries.
  void clear() {
    _store.clear();
  }

  /// Computes a deterministic 32-bit FNV-1a hex key for normalized strings.
  static String stableHash(String input) {
    int hash = 0x811c9dc5;
    for (int i = 0; i < input.length; i++) {
      hash ^= input.codeUnitAt(i);
      hash = (hash * 0x01000193) & 0xffffffff;
    }
    return hash.toRadixString(16).padLeft(8, '0');
  }
}
