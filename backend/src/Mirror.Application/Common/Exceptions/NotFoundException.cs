namespace Mirror.Application.Common.Exceptions;

/// <summary>Thrown when a requested resource does not exist; mapped to HTTP 404.</summary>
public sealed class NotFoundException(string message) : Exception(message);
