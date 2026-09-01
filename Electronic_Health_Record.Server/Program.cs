using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Scalar.AspNetCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Register your Database Context for Entity Framework Core
builder.Services.AddDbContext<ElectronicHealthRecordDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add CORS Policy to allow your React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactFrontend",
        policy =>
        {
            policy.WithOrigins("https://localhost:53807", "http://localhost:53807")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
//
// Registers a "Bearer" security scheme in the generated OpenAPI document via the
// DI-activated BearerSecuritySchemeTransformer defined below. This is what makes
// Scalar's UI show an "Authorize" / token field, so a JWT from /api/auth/login can
// be pasted in once and reused to call [Authorize] endpoints (like /me, logout,
// physician/change-password) directly from the docs page instead of curl/Postman.
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});

// Register application services
builder.Services.AddScoped<TokenService>();

// ============================================================
// --- JWT authentication & authorization setup ---
// ============================================================

// Pull the "Jwt" section from appsettings.json.
// Expected shape:
// "Jwt": {
//   "Key": "a-long-random-secret-at-least-32-characters",
//   "Issuer": "ElectronicHealthRecord",
//   "Audience": "ElectronicHealthRecordUsers"
// }
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"]
    ?? throw new InvalidOperationException("Jwt:Key is missing from configuration.");
var jwtIssuer = jwtSection["Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer is missing from configuration.");
var jwtAudience = jwtSection["Audience"]
    ?? throw new InvalidOperationException("Jwt:Audience is missing from configuration.");

// THIS was the missing piece: register JWT Bearer as the authentication
// scheme AND set it as the default. Without passing
// JwtBearerDefaults.AuthenticationScheme here, ASP.NET has no
// DefaultChallengeScheme, so any [Authorize] failure throws
// "No authenticationScheme was specified..." instead of returning 401.
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // In production, keep this true (HTTPS-only tokens).
        // Set to false only if you're testing over plain HTTP locally.
        options.RequireHttpsMetadata = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1), // small leeway for expiry checks

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// Register authorization services.
// NOTE: No FallbackPolicy here. A FallbackPolicy that requires an
// authenticated user on EVERY endpoint is usually what causes /login
// and /register to 401 even though they're meant to be public.
// [AllowAnonymous] on those actions overrides a FallbackPolicy anyway,
// but it's simpler/safer to just not set one unless you specifically
// want "secure by default" behavior across the whole app.
builder.Services.AddAuthorization();

// --- end JWT authentication & authorization setup ---
// ============================================================

var app = builder.Build();

// Optional Database Seeder scope
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        await DbSeeder.SeedAsync(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

app.UseDefaultFiles();
app.MapStaticAssets();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Middleware order matters: HTTPS redirect -> CORS -> AuthN -> AuthZ -> Controllers
app.UseHttpsRedirection();

app.UseCors("AllowReactFrontend");

// UseAuthentication MUST come before UseAuthorization.
// Authentication figures out WHO the caller is (validates the JWT,
// builds the ClaimsPrincipal). Authorization then decides WHAT
// that identity is allowed to do ([Authorize] checks, policies, etc).
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("/index.html");

app.Run();

// =========================================================
// OPENAPI BEARER SECURITY SCHEME TRANSFORMER
// =========================================================
//
// DI-activated document transformer (Microsoft.AspNetCore.OpenApi / .NET 10 pattern).
// Microsoft.OpenApi 2.x moved these types out of Microsoft.OpenApi.Models into
// Microsoft.OpenApi directly, and replaced the old "set a .Reference property"
// pattern with a dedicated OpenApiSecuritySchemeReference type -- the earlier
// version of this file used the pre-2.x API shape, which no longer compiles
// against Microsoft.AspNetCore.OpenApi 10.0.11.
internal sealed class BearerSecuritySchemeTransformer(
    IAuthenticationSchemeProvider authenticationSchemeProvider) : IOpenApiDocumentTransformer
{
    public async Task TransformAsync(
        OpenApiDocument document,
        OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        var authenticationSchemes = await authenticationSchemeProvider.GetAllSchemesAsync();

        // Only add the scheme/requirement if JWT Bearer auth is actually registered
        if (!authenticationSchemes.Any(scheme => scheme.Name == JwtBearerDefaults.AuthenticationScheme))
        {
            return;
        }

        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();

        document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Paste the JWT returned from POST /api/auth/login (no 'Bearer ' prefix needed here)."
        };

        var bearerRequirement = new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
        };

        foreach (var operation in document.Paths.Values.SelectMany(pathItem => pathItem.Operations))
        {
            operation.Value.Security ??= new List<OpenApiSecurityRequirement>();
            operation.Value.Security.Add(bearerRequirement);
        }
    }
}