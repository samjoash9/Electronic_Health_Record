using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Models;
using System.Runtime.InteropServices;


namespace Electronic_Health_Record.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PatientsController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;

        public PatientsController(ElectronicHealthRecordDbContext context)
        {
            _context = context;
        }

        // 
    }
}
