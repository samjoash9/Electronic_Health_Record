using System.ComponentModel.DataAnnotations;
namespace Electronic_Health_Record.Server.Models
{
    // Local stand-in for the external HR API. Station 1 searches this table today;
    // swap IEmployeeDirectory's implementation for a real HR client later without
    // touching the controller.
    public class Employee
    {
        public int EmployeeID { get; set; }
        public string ExternalEmployeeId { get; set; } = string.Empty;
        [MaxLength(150)]
        public string Surname { get; set; } = string.Empty;
        [MaxLength(150)]
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public DateTime Birthdate { get; set; }
        public int Age { get; set; }
        [MaxLength(150)]
        public string Sex { get; set; } = string.Empty;
        [MaxLength(150)]
        public string CivilStatus { get; set; } = string.Empty;
        public string? Address { get; set; }
        [MaxLength(200)]
        public string? AgencyOffice { get; set; }


        [MaxLength(400)]
        public string Position { get; set; }
        [MaxLength(150)]
        public string? ContactNo { get; set; }

        // true for a row an admin typed in on the Onboarding page rather than one
        // mirrored from HR. Lets a future real HR sync leave locally added people
        // alone instead of overwriting them as unrecognised.
        public bool IsLocallyAdded { get; set; }
    }
}
