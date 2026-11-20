import 'package:flutter_test/flutter_test.dart';
import 'package:smog_shield/core/app_error.dart';
import 'package:smog_shield/core/cities.dart';
import 'package:smog_shield/core/config.dart';
import 'package:smog_shield/core/formatters.dart';
import 'package:smog_shield/core/logger.dart';
import 'package:smog_shield/core/result.dart';

void main() {
  group('Result', () {
    test('Success exposes value and folds to onSuccess', () {
      const Result<int> res = Success<int>(42);
      expect(res.isSuccess, isTrue);
      expect(res.isFailure, isFalse);
      expect(res.valueOrNull, 42);
      expect(res.errorOrNull, isNull);
      expect(
        res.fold(onSuccess: (int v) => v * 2, onFailure: (_) => -1),
        84,
      );
      expect(res, const Success<int>(42));
      expect(res.hashCode, const Success<int>(42).hashCode);
    });

    test('Failure exposes AppError and folds to onFailure', () {
      const AppError err = AppError(
        code: AppErrorCode.network,
        userMessage: 'Offline',
        debugDetail: 'socket',
      );
      const Result<int> res = Failure<int>(err);
      expect(res.isFailure, isTrue);
      expect(res.isSuccess, isFalse);
      expect(res.valueOrNull, isNull);
      expect(res.errorOrNull, err);
      expect(
        res.fold(onSuccess: (_) => 'ok', onFailure: (AppError e) => e.userMessage),
        'Offline',
      );
      expect(res, const Failure<int>(err));
      expect(err.toString(), contains('network'));
    });
  });

  group('AppLogger, AppFormatters, AppCities, AppConfig', () {
    test('AppLogger redacts Google keys, query params, and headers', () {
      final List<String> captured = <String>[];
      final AppLogger logger = AppLogger(
        sink: (String tag, String msg) => captured.add('$tag:$msg'),
      );
      final String syntheticPrefix = '${'AI'}${'za'}';
      final String syntheticKey = '${syntheticPrefix}SyABCDEFGHIJKLMNOPQRSTUVWX';
      logger.info(
        'net',
        'x-goog-api-key: $syntheticKey key=secret123 Bearer tok_999',
      );
      expect(captured.single, isNot(contains(syntheticPrefix)));
      expect(captured.single, isNot(contains('secret123')));
      expect(captured.single, isNot(contains('tok_999')));
      expect(captured.single, contains('[REDACTED]'));
    });

    test('AppFormatters formats hours, windows, decimals, percentages', () {
      final DateTime a = DateTime(2026, 11, 20, 6, 5);
      final DateTime b = DateTime(2026, 11, 20, 8, 5);
      expect(AppFormatters.formatHour(a), '06:05');
      expect(AppFormatters.formatWindow(a, b), '06:05 to 08:05');
      expect(AppFormatters.formatOneDecimal(12.34), '12.3');
      expect(AppFormatters.formatOneDecimal(double.nan), '0.0');
      expect(AppFormatters.formatPercent(0.85), '85%');
      expect(AppFormatters.formatTimestamp(a), '2026-11-20 06:05');
    });

    test('AppCities resolves known cities and falls back to Delhi', () {
      expect(AppCities.list.length, greaterThanOrEqualTo(15));
      expect(AppCities.findByName('Gurugram')?.state, 'Haryana');
      expect(AppCities.findByName('UnknownCity'), isNull);
      expect(AppCities.byNameOrDefault('UnknownCity').name, 'Delhi');
    });

    test('AppConfig builds direct Gemini URI or proxy URI cleanly', () {
      const AppConfig direct = AppConfig(
        geminiApiKey: 'test-key',
        geminiModel: 'gemini-4-hydrogen',
        aiProxyUrl: '',
      );
      expect(direct.hasAiEndpoint, isTrue);
      expect(direct.usesProxy, isFalse);
      expect(
        direct.buildGeminiUri().toString(),
        contains('gemini-4-hydrogen:generateContent'),
      );

      const AppConfig proxied = AppConfig(
        geminiApiKey: '',
        geminiModel: '',
        aiProxyUrl: 'https://proxy.example.com/ai',
      );
      expect(proxied.usesProxy, isTrue);
      expect(proxied.buildGeminiUri().toString(), 'https://proxy.example.com/ai');
    });
  });
}
