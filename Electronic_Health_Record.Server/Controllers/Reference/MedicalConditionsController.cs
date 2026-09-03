using Microsoft.AspNetCore.Mvc;


namespace Electronic_Health_Record.Server.Controllers.Reference
{
    public class MedicalConditionsController : Controller
    {
        // GET    /api/medical-conditions              → list all conditions(for dropdowns / checkboxes)
        // GET    /api/medical-conditions? type = family  → filter by ConditionType if you use that column to distinguish family - history conditions from general ones
        // GET    /api/medical-conditions/:id          → get one(rarely needed, but cheap to add)
        // POST   /api/medical-conditions              → add new condition to the reference list(admin - only)
        // PUT    /api/medical-conditions/:id          → edit a condition name/type(admin-only)
        // DELETE /api/medical-conditions/:id          → remove from reference list(admin-only, and only if unused — see note below)
    }
}
