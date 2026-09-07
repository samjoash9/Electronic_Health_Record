namespace Electronic_Health_Record.Server.Services
{
    public interface ICurrentUser
    {
        int? AdminID { get; }
        int? PhysicianID { get; }
        int? PatientAccountID { get; }
        int? PatientID { get; }
    }
}