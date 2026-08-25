using Electronic_Health_Record.Server.Models;
using Microsoft.AspNetCore.Mvc;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace Electronic_Health_Record.Server.Controllers
{
    public class PhysiciansController : Controller
    {
        //GET    /api/physicians          → list all physicians(for "assign physician" dropdown)
        //GET    /api/physicians/:id      → get one physician's profile
        //POST   /api/physicians          → register new physician
        //PUT    /api/physicians/:id      → full update
        //PATCH  /api/physicians/:id      → partial update
        //DELETE /api/physicians/:id      → delete/deactivate
    }
}
