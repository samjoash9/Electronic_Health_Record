namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// The wellness form lifecycle: Draft -> PendingSignature -> Signed.
    /// Enforced in the database by CK_WellnessForm_Status.
    /// </summary>
    public static class FormStatus
    {
        /// <summary>Admin is still filling it in. The only status that may be deleted.</summary>
        public const string Draft = "Draft";

        /// <summary>Routed to a named physician and waiting on them. Requires AssignedPhysicianID.</summary>
        public const string PendingSignature = "PendingSignature";

        /// <summary>Signed by the assigned physician. Terminal and immutable.</summary>
        public const string Signed = "Signed";

        /// <summary>
        /// The wire value the React client sent before the lifecycle gained a third state.
        /// Accepted on input and normalised to <see cref="PendingSignature"/> so an un-updated
        /// client keeps working; never written to the database.
        /// </summary>
        public const string LegacySubmitted = "Submitted";

        /// <summary>Maps a client-supplied status onto the value stored in the database.</summary>
        public static string Normalize(string? status) =>
            status == LegacySubmitted ? PendingSignature : status ?? Draft;
    }
}
