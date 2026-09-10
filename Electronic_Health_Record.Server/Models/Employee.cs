namespace Electronic_Health_Record.Server.Models
{
    // Local stand-in for the external HR API. Station 1 searches this table today;
    // swap IEmployeeDirectory's implementation for a real HR client later without
    // touching the controller.
    public class Employee
    {
        public int EmployeeID { get; set; }
        public string ExternalEmployeeId { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public DateTime Birthdate { get; set; }
        public int Age { get; set; }
        public string Sex { get; set; } = string.Empty;
        public string CivilStatus { get; set; } = string.Empty;
        public string? Address { get; set; }
        
        public string? AgencyOffice { get; set; }

        public string Position { get; set; }
        public string? ContactNo { get; set; }
    }
}
