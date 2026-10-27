using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Metadata;

namespace Electronic_Health_Record.Server.Tests.Infrastructure;

/// <summary>
/// Gives every inserted or updated row a fresh rowversion, as SQL Server does.
/// In-memory already checks a concurrency token's original value against the
/// stored one on update -- what it lacks is a new value afterwards, without
/// which a stale token could never be told from a current one.
/// </summary>
public sealed class RowVersionEmulator : SaveChangesInterceptor
{
    private static long _version;

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        Stamp(eventData.Context);
        return result;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        Stamp(eventData.Context);
        return ValueTask.FromResult(result);
    }

    private static void Stamp(DbContext? context)
    {
        if (context is null) return;

        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified)) continue;

            foreach (var property in entry.Metadata.GetProperties().Where(IsRowVersion))
            {
                // Only the current value moves: the original is the token the
                // caller sent, and in-memory compares that with the stored row.
                entry.Property(property.Name).CurrentValue = Next();
            }
        }
    }

    private static bool IsRowVersion(IProperty property) =>
        property.ClrType == typeof(byte[])
        && property.IsConcurrencyToken
        && property.ValueGenerated == ValueGenerated.OnAddOrUpdate;

    private static byte[] Next()
    {
        var bytes = BitConverter.GetBytes(Interlocked.Increment(ref _version));
        if (BitConverter.IsLittleEndian) Array.Reverse(bytes);
        return bytes;
    }
}
