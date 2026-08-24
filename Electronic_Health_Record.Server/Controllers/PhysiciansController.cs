using Microsoft.AspNetCore.Mvc;

namespace Electronic_Health_Record.Server.Controllers
{
    public class PhysiciansController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
