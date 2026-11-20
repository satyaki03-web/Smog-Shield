import 'app_error.dart';

/// Sealed result type representing either a [Success] value or a [Failure].
sealed class Result<T> {
  /// Const base constructor for subclasses.
  const Result();

  /// Whether this result holds a value.
  bool get isSuccess => this is Success<T>;

  /// Whether this result holds an [AppError].
  bool get isFailure => this is Failure<T>;

  /// Returns the wrapped value if [Success], otherwise null.
  T? get valueOrNull => switch (this) {
        Success<T>(:final T value) => value,
        Failure<T>() => null,
      };

  /// Returns the wrapped [AppError] if [Failure], otherwise null.
  AppError? get errorOrNull => switch (this) {
        Success<T>() => null,
        Failure<T>(:final AppError error) => error,
      };

  /// Exhaustively transforms either branch into [R].
  R fold<R>({
    required R Function(T value) onSuccess,
    required R Function(AppError error) onFailure,
  }) {
    return switch (this) {
      Success<T>(:final T value) => onSuccess(value),
      Failure<T>(:final AppError error) => onFailure(error),
    };
  }
}

/// Successful [Result] carrying [value].
final class Success<T> extends Result<T> {
  /// Creates a successful result with [value].
  const Success(this.value);

  /// The successful payload.
  final T value;

  @override
  bool operator ==(Object other) {
    return identical(this, other) || other is Success<T> && value == other.value;
  }

  @override
  int get hashCode => value.hashCode;
}

/// Failed [Result] carrying a typed [error].
final class Failure<T> extends Result<T> {
  /// Creates a failed result with [error].
  const Failure(this.error);

  /// The typed failure cause.
  final AppError error;

  @override
  bool operator ==(Object other) {
    return identical(this, other) || other is Failure<T> && error == other.error;
  }

  @override
  int get hashCode => error.hashCode;
}
