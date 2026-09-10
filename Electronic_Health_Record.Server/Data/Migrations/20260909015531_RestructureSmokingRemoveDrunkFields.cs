using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class RestructureSmokingRemoveDrunkFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Dropped rather than renamed: HasBeenDrunk/DrunkFrequency are a
            // different question (alcohol) from the new Smokes/EcigFrequency
            // columns (smoking) — carrying old values forward under the new
            // names would misrepresent existing rows' data.
            migrationBuilder.DropColumn(
                name: "SmokingSticksPerDay",
                table: "SocialHistory");

            migrationBuilder.DropColumn(
                name: "HasBeenDrunk",
                table: "SocialHistory");

            migrationBuilder.DropColumn(
                name: "DrunkFrequency",
                table: "SocialHistory");

            migrationBuilder.AddColumn<bool>(
                name: "Smokes",
                table: "SocialHistory",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SmokesCigarette",
                table: "SocialHistory",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CigaretteSticksPerDay",
                table: "SocialHistory",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CigaretteFrequency",
                table: "SocialHistory",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CigaretteYearStarted",
                table: "SocialHistory",
                type: "nvarchar(4)",
                maxLength: 4,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CigarettePuffsPerDay",
                table: "SocialHistory",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SmokesEcig",
                table: "SocialHistory",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "EcigPodsPerMonth",
                table: "SocialHistory",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EcigFrequency",
                table: "SocialHistory",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EcigYearStarted",
                table: "SocialHistory",
                type: "nvarchar(4)",
                maxLength: 4,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EcigPuffsPerDay",
                table: "SocialHistory",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Smokes",
                table: "SocialHistory");

            migrationBuilder.DropColumn(
                name: "SmokesCigarette",
                table: "SocialHistory");

            migrationBuilder.DropColumn(
                name: "CigaretteSticksPerDay",
                table: "SocialHistory");

            migrationBuilder.DropColumn(
                name: "CigaretteFrequency",
                table: "SocialHistory");

            migrationBuilder.DropColumn(
                name: "CigaretteYearStarted",
                table: "SocialHistory");

            migrationBuilder.DropColumn(
                name: "CigarettePuffsPerDay",
                table: "SocialHistory");

            migrationBuilder.DropColumn(
                name: "SmokesEcig",
                table: "SocialHistory");

            migrationBuilder.DropColumn(
                name: "EcigPodsPerMonth",
                table: "SocialHistory");

            migrationBuilder.DropColumn(
                name: "EcigFrequency",
                table: "SocialHistory");

            migrationBuilder.DropColumn(
                name: "EcigYearStarted",
                table: "SocialHistory");

            migrationBuilder.DropColumn(
                name: "EcigPuffsPerDay",
                table: "SocialHistory");

            migrationBuilder.AddColumn<short>(
                name: "SmokingSticksPerDay",
                table: "SocialHistory",
                type: "smallint",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasBeenDrunk",
                table: "SocialHistory",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DrunkFrequency",
                table: "SocialHistory",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }
    }
}
