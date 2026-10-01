namespace Electronic_Health_Record.Server.DTOs.Admin
{
    /// <summary>
    /// Deactivates or restores a staff account's login. A bool rather than a free
    /// status string: the column accepts any text, and letting a caller name the
    /// status invites values nothing else recognises.
    /// </summary>
    public class SetAdminStatusDto
    {
        public bool IsActive { get; set; }
    }
}
