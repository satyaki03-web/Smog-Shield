/// Pure Dart formatting utilities for times, ranges, and air metrics.
class AppFormatters {
  const AppFormatters._();

  /// Formats [dateTime] as 24-hour clock `HH:00`.
  static String formatHour(DateTime dateTime) {
    final String hh = dateTime.hour.toString().padLeft(2, '0');
    final String mm = dateTime.minute.toString().padLeft(2, '0');
    return '$hh:$mm';
  }

  /// Formats a time range from [start] to [end] as `HH:mm to HH:mm`.
  static String formatWindow(DateTime start, DateTime end) {
    return '${formatHour(start)} to ${formatHour(end)}';
  }

  /// Formats a floating-point metric with one decimal place.
  static String formatOneDecimal(double value) {
    if (!value.isFinite) {
      return '0.0';
    }
    return value.toStringAsFixed(1);
  }

  /// Formats a percentage from a 0.0 to 1.0 [fraction].
  static String formatPercent(double fraction) {
    final double clamped = fraction.isFinite ? fraction.clamp(0.0, 1.0) : 0.0;
    return '${(clamped * 100).round()}%';
  }

  /// Formats a date and time cleanly as `YYYY-MM-DD HH:mm`.
  static String formatTimestamp(DateTime dt) {
    final String y = dt.year.toString().padLeft(4, '0');
    final String m = dt.month.toString().padLeft(2, '0');
    final String d = dt.day.toString().padLeft(2, '0');
    return '$y-$m-$d ${formatHour(dt)}';
  }
}
