using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Billing;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Billing
{
    // The admin-owned price catalog behind Station 3's lab/medication pickers
    // and Station 6's billing totals. Read is open to any authenticated
    // station; only SuperAdmin may create, edit, or retire an entry -- pricing
    // is a budget decision, not a station-floor one.
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChargeItemsController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;
        private readonly ICurrentUser _currentUser;
        private readonly ILogger<ChargeItemsController> _logger;

        public ChargeItemsController(
            ElectronicHealthRecordDbContext context,
            ICurrentUser currentUser,
            ILogger<ChargeItemsController> logger)
        {
            _context = context;
            _currentUser = currentUser;
            _logger = logger;
        }

        // GET /api/chargeitems?type=Lab|Medication&active=true
        [HttpGet("")]
        public async Task<IActionResult> GetChargeItems(
            [FromQuery] string? type,
            [FromQuery] bool? active)
        {
            if (type != null && !ChargeItemType.IsValid(type))
                return BadRequest(new { message = "type must be Lab or Medication." });

            try
            {
                var query = _context.ChargeItems.AsQueryable();

                if (type != null)
                    query = query.Where(c => c.ItemType == type);

                if (active.HasValue)
                    query = query.Where(c => c.IsActive == active.Value);

                var items = await query
                    .OrderBy(c => c.ItemType)
                    .ThenBy(c => c.DisplayOrder)
                    .ThenBy(c => c.Name)
                    .Select(c => new ChargeItemResponseDto
                    {
                        ChargeItemID = c.ChargeItemID,
                        ItemType = c.ItemType,
                        Name = c.Name,
                        Category = c.Category,
                        UnitPrice = c.UnitPrice,
                        IsActive = c.IsActive,
                        DisplayOrder = c.DisplayOrder,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt,
                    })
                    .ToListAsync();

                return Ok(new { data = items });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve charge items.");
                return StatusCode(500, "An error occurred while retrieving charge items.");
            }
        }

        // POST /api/chargeitems
        [Authorize(Roles = AdminRoles.SuperAdmin)]
        [HttpPost("")]
        public async Task<IActionResult> CreateChargeItem([FromBody] CreateChargeItemDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!ChargeItemType.IsValid(dto.ItemType))
                return BadRequest(new { message = "ItemType must be Lab or Medication." });

            var nameTaken = await _context.ChargeItems
                .AnyAsync(c => c.ItemType == dto.ItemType && c.Name == dto.Name);
            if (nameTaken)
                return Conflict(new { message = $"A {dto.ItemType} named '{dto.Name}' already exists." });

            try
            {
                var now = DateTime.UtcNow;
                var item = new ChargeItem
                {
                    ItemType = dto.ItemType,
                    Name = dto.Name,
                    Category = dto.Category,
                    UnitPrice = dto.UnitPrice,
                    DisplayOrder = dto.DisplayOrder,
                    IsActive = true,
                    CreatedAt = now,
                    UpdatedAt = now,
                    UpdatedByAdminID = _currentUser.AdminID,
                };

                _context.ChargeItems.Add(item);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetChargeItems), null, ToResponseDto(item));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create charge item.");
                return StatusCode(500, "An error occurred while creating the charge item.");
            }
        }

        // PUT /api/chargeitems/{id}
        // Every field is sent -- no partial-patch semantics, matching
        // UpdateWellnessFormDto elsewhere in this API. Editing an item never
        // touches WellnessFormCharge rows already snapshotted from it (decision
        // 6a): past bills are immune to a later price change.
        [Authorize(Roles = AdminRoles.SuperAdmin)]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateChargeItem(int id, [FromBody] UpdateChargeItemDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var item = await _context.ChargeItems.FindAsync(id);
            if (item == null)
                return NotFound(new { message = $"Charge item with ID {id} was not found." });

            var nameTaken = await _context.ChargeItems
                .AnyAsync(c => c.ChargeItemID != id && c.ItemType == item.ItemType && c.Name == dto.Name);
            if (nameTaken)
                return Conflict(new { message = $"A {item.ItemType} named '{dto.Name}' already exists." });

            try
            {
                item.Name = dto.Name;
                item.Category = dto.Category;
                item.UnitPrice = dto.UnitPrice;
                item.IsActive = dto.IsActive;
                item.DisplayOrder = dto.DisplayOrder;
                item.UpdatedAt = DateTime.UtcNow;
                item.UpdatedByAdminID = _currentUser.AdminID;

                await _context.SaveChangesAsync();

                return Ok(ToResponseDto(item));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update charge item {ChargeItemID}.", id);
                return StatusCode(500, "An error occurred while updating the charge item.");
            }
        }

        // DELETE /api/chargeitems/{id}
        // Never a hard delete: WellnessFormCharge rows may reference this item,
        // and even one that has none today must keep resolving old aliases
        // during a re-run of the migration backfill. Soft-delete only.
        [Authorize(Roles = AdminRoles.SuperAdmin)]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> RetireChargeItem(int id)
        {
            var item = await _context.ChargeItems.FindAsync(id);
            if (item == null)
                return NotFound(new { message = $"Charge item with ID {id} was not found." });

            if (!item.IsActive)
                return Ok(ToResponseDto(item));

            try
            {
                item.IsActive = false;
                item.UpdatedAt = DateTime.UtcNow;
                item.UpdatedByAdminID = _currentUser.AdminID;

                await _context.SaveChangesAsync();

                return Ok(ToResponseDto(item));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retire charge item {ChargeItemID}.", id);
                return StatusCode(500, "An error occurred while retiring the charge item.");
            }
        }

        private static ChargeItemResponseDto ToResponseDto(ChargeItem item) => new()
        {
            ChargeItemID = item.ChargeItemID,
            ItemType = item.ItemType,
            Name = item.Name,
            Category = item.Category,
            UnitPrice = item.UnitPrice,
            IsActive = item.IsActive,
            DisplayOrder = item.DisplayOrder,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt,
        };
    }
}
