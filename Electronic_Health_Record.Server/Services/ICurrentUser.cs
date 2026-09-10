namespace Electronic_Health_Record.Server.Services
{
    // Identity of the caller, as it will be once auth exists. Until then every
    // implementation is a stand-in — see StubCurrentUser — so station endpoints
    // can be written against the final shape and wired to real auth later without
    // touching a controller.
    public interface ICurrentUser
    {
        int? AdminID { get; }
        int? PhysicianID { get; }
        int? PatientAccountID { get; }
        int? PatientID { get; }
    }
}
