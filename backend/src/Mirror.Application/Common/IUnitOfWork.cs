namespace Mirror.Application.Common;

/// <summary>Commits the changes tracked across the repositories in one transaction.</summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
