namespace Electronic_Health_Record.Server.DTOs.Patient
{
    /// <summary>
    /// Suspends or restores a patient's portal login. A bool rather than a free
    /// status string: the column accepts any text, and letting a caller name the
    /// status invites values nothing else recognises.
    /// </summary>
    public class SetPatientAccountStatusDto
    {
        public bool IsActive { get; set; }
    }
}
