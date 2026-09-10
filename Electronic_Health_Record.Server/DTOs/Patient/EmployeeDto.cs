using System.Text.Json.Serialization;

namespace Electronic_Health_Record.Server.DTOs.Patient
{
	// ============================================================
	// Employee DTO
	// ============================================================
	// Represents the employee data received from the external
	// iHRIS / Employee API.
	// ============================================================

	public class EmployeeDto
	{
		[JsonPropertyName("eid")]
		public int Eid { get; set; }

		[JsonPropertyName("surname")]
		public string? Surname { get; set; }

		[JsonPropertyName("firstname")]
		public string? Firstname { get; set; }

		[JsonPropertyName("middlename")]
		public string? Middlename { get; set; }

		[JsonPropertyName("birthDate")]
		public DateTime? BirthDate { get; set; }

		[JsonPropertyName("age")]
		public int? Age { get; set; }

		[JsonPropertyName("sex")]
		public string? Sex { get; set; }

		[JsonPropertyName("civilStatus")]
		public string? CivilStatus { get; set; }

		[JsonPropertyName("address")]
		public string? Address { get; set; }

		[JsonPropertyName("office")]
		public string? Office { get; set; }

		[JsonPropertyName("position")]
		public string? Position { get; set; }

		[JsonPropertyName("contactNumber")]
		public string? ContactNumber { get; set; }
	}
}