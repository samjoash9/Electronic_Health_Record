using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class ExpandWellnessAssessmentSections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AssessmentCategory",
                keyColumn: "CategoryID",
                keyValue: 1,
                columns: new[] { "DisplayOrder", "Name" },
                values: new object[] { (byte)3, "Mental" });

            migrationBuilder.UpdateData(
                table: "AssessmentCategory",
                keyColumn: "CategoryID",
                keyValue: 2,
                columns: new[] { "DisplayOrder", "Name" },
                values: new object[] { (byte)5, "Physical" });

            migrationBuilder.UpdateData(
                table: "AssessmentCategory",
                keyColumn: "CategoryID",
                keyValue: 3,
                columns: new[] { "DisplayOrder", "Name" },
                values: new object[] { (byte)1, "Spiritual" });

            migrationBuilder.UpdateData(
                table: "AssessmentCategory",
                keyColumn: "CategoryID",
                keyValue: 4,
                columns: new[] { "DisplayOrder", "Name" },
                values: new object[] { (byte)7, "Social" });

            migrationBuilder.InsertData(
                table: "AssessmentCategory",
                columns: new[] { "CategoryID", "DisplayOrder", "Name" },
                values: new object[,]
                {
                    { 5, (byte)2, "Psychological" },
                    { 6, (byte)4, "Emotional" },
                    { 7, (byte)6, "Financial" }
                });

            migrationBuilder.InsertData(
                table: "AssessmentQuestion",
                columns: new[] { "QuestionID", "CategoryID", "DisplayOrder", "IsActive", "QuestionText" },
                values: new object[,]
                {
                    { 17, 3, (byte)4, true, "Do you find comfort in your faith or personal beliefs?" },
                    { 18, 3, (byte)5, true, "Do you feel connected to something greater than yourself?" },
                    { 19, 4, (byte)4, true, "How often do you feel isolated or left out?" },
                    { 20, 4, (byte)5, true, "How often do you take part in social or community activities?" }
                });

            migrationBuilder.InsertData(
                table: "AssessmentOption",
                columns: new[] { "OptionID", "DisplayOrder", "OptionText", "QuestionID", "Score" },
                values: new object[,]
                {
                    { 65, (byte)1, "Always", 17, (byte)4 },
                    { 66, (byte)2, "Often", 17, (byte)3 },
                    { 67, (byte)3, "Rarely", 17, (byte)2 },
                    { 68, (byte)4, "Never", 17, (byte)1 },
                    { 69, (byte)1, "Strongly Agree", 18, (byte)4 },
                    { 70, (byte)2, "Agree", 18, (byte)3 },
                    { 71, (byte)3, "Disagree", 18, (byte)2 },
                    { 72, (byte)4, "Strongly Disagree", 18, (byte)1 },
                    { 73, (byte)1, "Never", 19, (byte)4 },
                    { 74, (byte)2, "Rarely", 19, (byte)3 },
                    { 75, (byte)3, "Sometimes", 19, (byte)2 },
                    { 76, (byte)4, "Often", 19, (byte)1 },
                    { 77, (byte)1, "Often", 20, (byte)4 },
                    { 78, (byte)2, "Sometimes", 20, (byte)3 },
                    { 79, (byte)3, "Rarely", 20, (byte)2 },
                    { 80, (byte)4, "Never", 20, (byte)1 }
                });

            migrationBuilder.InsertData(
                table: "AssessmentQuestion",
                columns: new[] { "QuestionID", "CategoryID", "DisplayOrder", "IsActive", "QuestionText" },
                values: new object[,]
                {
                    { 21, 5, (byte)1, true, "How would you rate your overall sense of self-worth?" },
                    { 22, 5, (byte)2, true, "How well do you bounce back after a setback?" },
                    { 23, 5, (byte)3, true, "How confident are you in making everyday decisions?" },
                    { 24, 5, (byte)4, true, "Do you feel in control of your thoughts and reactions?" },
                    { 25, 5, (byte)5, true, "How would you describe your outlook on the future?" },
                    { 26, 6, (byte)1, true, "How comfortable are you expressing your feelings to others?" },
                    { 27, 6, (byte)2, true, "How often do you experience sudden mood swings?" },
                    { 28, 6, (byte)3, true, "Do you have someone you can turn to when you feel emotionally overwhelmed?" },
                    { 29, 6, (byte)4, true, "How often do you feel overwhelmed by your emotions?" },
                    { 30, 6, (byte)5, true, "How often do you feel joy or contentment in daily life?" },
                    { 31, 7, (byte)1, true, "How often do you feel stressed about money?" },
                    { 32, 7, (byte)2, true, "How well can you meet your monthly expenses?" },
                    { 33, 7, (byte)3, true, "Do you have savings set aside for emergencies?" },
                    { 34, 7, (byte)4, true, "How often do you worry about outstanding debts?" },
                    { 35, 7, (byte)5, true, "How confident are you in your financial future?" }
                });

            migrationBuilder.InsertData(
                table: "AssessmentOption",
                columns: new[] { "OptionID", "DisplayOrder", "OptionText", "QuestionID", "Score" },
                values: new object[,]
                {
                    { 81, (byte)1, "Very Good", 21, (byte)4 },
                    { 82, (byte)2, "Good", 21, (byte)3 },
                    { 83, (byte)3, "Fair", 21, (byte)2 },
                    { 84, (byte)4, "Poor", 21, (byte)1 },
                    { 85, (byte)1, "Very Well", 22, (byte)4 },
                    { 86, (byte)2, "Well", 22, (byte)3 },
                    { 87, (byte)3, "Poorly", 22, (byte)2 },
                    { 88, (byte)4, "Very Poorly", 22, (byte)1 },
                    { 89, (byte)1, "Very Confident", 23, (byte)4 },
                    { 90, (byte)2, "Confident", 23, (byte)3 },
                    { 91, (byte)3, "Unsure", 23, (byte)2 },
                    { 92, (byte)4, "Very Unsure", 23, (byte)1 },
                    { 93, (byte)1, "Always", 24, (byte)4 },
                    { 94, (byte)2, "Often", 24, (byte)3 },
                    { 95, (byte)3, "Rarely", 24, (byte)2 },
                    { 96, (byte)4, "Never", 24, (byte)1 },
                    { 97, (byte)1, "Very Positive", 25, (byte)4 },
                    { 98, (byte)2, "Positive", 25, (byte)3 },
                    { 99, (byte)3, "Negative", 25, (byte)2 },
                    { 100, (byte)4, "Very Negative", 25, (byte)1 },
                    { 101, (byte)1, "Very Comfortable", 26, (byte)4 },
                    { 102, (byte)2, "Comfortable", 26, (byte)3 },
                    { 103, (byte)3, "Uncomfortable", 26, (byte)2 },
                    { 104, (byte)4, "Very Uncomfortable", 26, (byte)1 },
                    { 105, (byte)1, "Never", 27, (byte)4 },
                    { 106, (byte)2, "Rarely", 27, (byte)3 },
                    { 107, (byte)3, "Sometimes", 27, (byte)2 },
                    { 108, (byte)4, "Often", 27, (byte)1 },
                    { 109, (byte)1, "Always", 28, (byte)4 },
                    { 110, (byte)2, "Most of the time", 28, (byte)3 },
                    { 111, (byte)3, "Rarely", 28, (byte)2 },
                    { 112, (byte)4, "Never", 28, (byte)1 },
                    { 113, (byte)1, "Never", 29, (byte)4 },
                    { 114, (byte)2, "Rarely", 29, (byte)3 },
                    { 115, (byte)3, "Sometimes", 29, (byte)2 },
                    { 116, (byte)4, "Often", 29, (byte)1 },
                    { 117, (byte)1, "Often", 30, (byte)4 },
                    { 118, (byte)2, "Sometimes", 30, (byte)3 },
                    { 119, (byte)3, "Rarely", 30, (byte)2 },
                    { 120, (byte)4, "Never", 30, (byte)1 },
                    { 121, (byte)1, "Never", 31, (byte)4 },
                    { 122, (byte)2, "Rarely", 31, (byte)3 },
                    { 123, (byte)3, "Sometimes", 31, (byte)2 },
                    { 124, (byte)4, "Often", 31, (byte)1 },
                    { 125, (byte)1, "Very Well", 32, (byte)4 },
                    { 126, (byte)2, "Well", 32, (byte)3 },
                    { 127, (byte)3, "Poorly", 32, (byte)2 },
                    { 128, (byte)4, "Very Poorly", 32, (byte)1 },
                    { 129, (byte)1, "Always", 33, (byte)4 },
                    { 130, (byte)2, "Often", 33, (byte)3 },
                    { 131, (byte)3, "Rarely", 33, (byte)2 },
                    { 132, (byte)4, "Never", 33, (byte)1 },
                    { 133, (byte)1, "Never", 34, (byte)4 },
                    { 134, (byte)2, "Rarely", 34, (byte)3 },
                    { 135, (byte)3, "Sometimes", 34, (byte)2 },
                    { 136, (byte)4, "Often", 34, (byte)1 },
                    { 137, (byte)1, "Very Confident", 35, (byte)4 },
                    { 138, (byte)2, "Confident", 35, (byte)3 },
                    { 139, (byte)3, "Unsure", 35, (byte)2 },
                    { 140, (byte)4, "Very Unsure", 35, (byte)1 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 65);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 66);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 67);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 68);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 69);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 70);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 71);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 72);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 73);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 74);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 75);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 76);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 77);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 78);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 79);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 80);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 81);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 82);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 83);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 84);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 85);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 86);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 87);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 88);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 89);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 90);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 91);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 92);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 93);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 94);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 95);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 96);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 97);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 98);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 99);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 100);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 101);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 102);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 103);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 104);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 105);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 106);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 107);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 108);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 109);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 110);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 111);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 112);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 113);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 114);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 115);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 116);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 117);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 118);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 119);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 120);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 121);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 122);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 123);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 124);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 125);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 126);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 127);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 128);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 129);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 130);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 131);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 132);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 133);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 134);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 135);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 136);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 137);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 138);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 139);

            migrationBuilder.DeleteData(
                table: "AssessmentOption",
                keyColumn: "OptionID",
                keyValue: 140);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "AssessmentQuestion",
                keyColumn: "QuestionID",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "AssessmentCategory",
                keyColumn: "CategoryID",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "AssessmentCategory",
                keyColumn: "CategoryID",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "AssessmentCategory",
                keyColumn: "CategoryID",
                keyValue: 7);

            migrationBuilder.UpdateData(
                table: "AssessmentCategory",
                keyColumn: "CategoryID",
                keyValue: 1,
                columns: new[] { "DisplayOrder", "Name" },
                values: new object[] { (byte)1, "Mental Health" });

            migrationBuilder.UpdateData(
                table: "AssessmentCategory",
                keyColumn: "CategoryID",
                keyValue: 2,
                columns: new[] { "DisplayOrder", "Name" },
                values: new object[] { (byte)2, "Physical Health" });

            migrationBuilder.UpdateData(
                table: "AssessmentCategory",
                keyColumn: "CategoryID",
                keyValue: 3,
                columns: new[] { "DisplayOrder", "Name" },
                values: new object[] { (byte)3, "Spiritual Health" });

            migrationBuilder.UpdateData(
                table: "AssessmentCategory",
                keyColumn: "CategoryID",
                keyValue: 4,
                columns: new[] { "DisplayOrder", "Name" },
                values: new object[] { (byte)4, "Social Health" });
        }
    }
}
