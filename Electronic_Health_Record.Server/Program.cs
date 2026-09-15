using System.Text;

using Electronic_Health_Record.Server.BackgroundJobs;
using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Filters;
using Electronic_Health_Record.Server.Services;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// SERVICES
// ============================================================

builder.Services.AddControllers();


// ============================================================
// DATABASE
// ============================================================

builder.Services.AddDbContext<ElectronicHealthRecordDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));


// ============================================================
// HTTP CONTEXT
// ============================================================

builder.Services.AddHttpContextAccessor();


// ============================================================
// CORS
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactFrontend", policy =>
    {
        policy
            .WithOrigins(
                "https://localhost:53807",
                "http://localhost:53807"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});


// ============================================================
// OPENAPI
// ============================================================

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});


// ============================================================
// APPLICATION SERVICES
// ============================================================

builder.Services.AddScoped<TokenService>();

builder.Services.AddScoped<ICurrentUser, CurrentUser>();


// ============================================================
// JWT CONFIGURATION
// ============================================================

var jwtSection = builder.Configuration.GetSection("Jwt");

// The signing key is a secret and is never committed: it comes from user
// secrets in development and the Jwt__Key environment variable in production.
// Validated here rather than at first use so a misconfigured host fails at
// startup instead of minting forgeable tokens -- anyone holding this key can
// sign a token for any account, including a superadmin.
var jwtKey = jwtSection["Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "Jwt:Key is missing from configuration. Set it with " +
        "'dotnet user-secrets set \"Jwt:Key\" \"<secret>\"' in development, " +
        "or the Jwt__Key environment variable in production."
    );
}

// HMAC-SHA256 keys shorter than the 256-bit hash output weaken the signature,
// and MS identity model rejects them outright.
if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key must be at least 32 bytes. Generate one with: " +
        "[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Max 256 }))"
    );
}

// Guards against the placeholder that used to ship in appsettings.json being
// pasted back in: it is long enough to pass the length check above, so only a
// value check catches it.
if (jwtKey.Contains("REPLACE_WITH", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "Jwt:Key is still the placeholder value. Replace it with a real secret."
    );
}

var jwtIssuer = jwtSection["Issuer"]
    ?? throw new InvalidOperationException(
        "Jwt:Issuer is missing from configuration."
    );

var jwtAudience = jwtSection["Audience"]
    ?? throw new InvalidOperationException(
        "Jwt:Audience is missing from configuration."
    );


// ============================================================
// JWT AUTHENTICATION
// ============================================================

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = true;

        options.SaveToken = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            // ------------------------------------------------
            // SIGNATURE
            // ------------------------------------------------

            ValidateIssuerSigningKey = true,

            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey)
                ),

            // ------------------------------------------------
            // ISSUER
            // ------------------------------------------------

            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            // ------------------------------------------------
            // AUDIENCE
            // ------------------------------------------------

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            // ------------------------------------------------
            // EXPIRATION
            // ------------------------------------------------

            ValidateLifetime = true,

            ClockSkew = TimeSpan.FromMinutes(1),

            // ------------------------------------------------
            // CLAIM MAPPING
            // ------------------------------------------------

            NameClaimType =
                System.Security.Claims.ClaimTypes.Name,

            RoleClaimType =
                System.Security.Claims.ClaimTypes.Role
        };


    });



// ============================================================
// Employee API HttpClient
// ============================================================
// Registers the HttpClient used by the EHR application to
// communicate with the external iHRIS Employee API.
//
// The timeout is increased because the Employee API may return
// a large list of active employees.
// ============================================================

builder.Services.AddHttpClient<IEmployeeService, EmployeeService>(
    client =>
    {
        client.BaseAddress = new Uri(
            builder.Configuration["EmployeeApi:BaseUrl"]!
        );

        client.Timeout = TimeSpan.FromMinutes(2);
    });

// Employee directory (search/create/update) used by the Onboarding page.
// Stand-in until the real HR API accepts writes -- see IEmployeeDirectory.
builder.Services.AddScoped<IEmployeeDirectory, SeededEmployeeDirectory>();


// ============================================================
// Employee Sync Background Service
// ============================================================
// Runs on a timer (every 4 minutes) and pulls employee data
// from the external HR API into the local database. This is
// the ONLY place in the app that calls the external HR API —
// all controller reads (GET /api/Employees) are served from
// the local database only, so the app keeps working even if
// the HR source is slow or temporarily unreachable.
// ============================================================

builder.Services.AddHostedService<EmployeeSyncBackgroundService>();


// ============================================================
// AUTHORIZATION
// ============================================================

// Every endpoint requires an authenticated caller unless it opts out with
// [AllowAnonymous]. This is deliberately the default rather than a per-class
// [Authorize]: a controller added without the attribute would otherwise serve
// patient data to anonymous callers, which is exactly how the audit-log,
// assessment-template and medical-conditions endpoints ended up public.
//
// The fallback applies only where no other authorization attribute is present,
// so existing [Authorize(Roles = ...)] rules are unaffected.
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});


// ============================================================
// BUILD APPLICATION
// ============================================================

var app = builder.Build();


// ============================================================
// DATABASE SEEDER
// ============================================================

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    try
    {
        await DbSeeder.SeedAsync(services);
    }
    catch (Exception ex)
    {
        var logger =
            services.GetRequiredService<ILogger<Program>>();

        logger.LogError(
            ex,
            "An error occurred while seeding the database."
        );
    }
}


// ============================================================
// STATIC FILES
// ============================================================

app.UseDefaultFiles();

// The SPA's own assets must stay reachable to an anonymous browser: the
// FallbackPolicy applies to every routed endpoint, and without this opt-out the
// login page itself would 401 before the user has any token to present.
app.MapStaticAssets().AllowAnonymous();


// ============================================================
// OPENAPI + SCALAR
// ============================================================

if (app.Environment.IsDevelopment())
{
    // Development only, and anonymous so the docs UI loads before you have a
    // token to paste into it. Neither endpoint is mapped outside Development,
    // so this does not widen the production surface.
    app.MapOpenApi().AllowAnonymous();

    app.MapScalarApiReference(options =>
    {
        options.AddPreferredSecuritySchemes("Bearer");
    }).AllowAnonymous();
}


// ============================================================
// HTTPS
// ============================================================

app.UseHttpsRedirection();


// ============================================================
// CORS
// ============================================================

app.UseCors("AllowReactFrontend");


// ============================================================
// AUTHENTICATION
// ============================================================

app.UseAuthentication();


// ============================================================
// AUTHORIZATION
// ============================================================

app.UseAuthorization();


// ============================================================
// CONTROLLERS
// ============================================================

app.MapControllers();


// ============================================================
// REACT SPA FALLBACK
// ============================================================

// Anonymous for the same reason as the static assets above: this serves the
// React shell for any non-API route, including /login. Authorization for what
// the SPA then displays is enforced per API call, not here.
app.MapFallbackToFile("/index.html").AllowAnonymous();


// ============================================================
// RUN
// ============================================================

app.Run();


// ============================================================
// OPENAPI BEARER SECURITY SCHEME TRANSFORMER
// ============================================================

internal sealed class BearerSecuritySchemeTransformer(
    IAuthenticationSchemeProvider authenticationSchemeProvider)
    : IOpenApiDocumentTransformer
{
    public async Task TransformAsync(
        OpenApiDocument document,
        OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        var authenticationSchemes =
            await authenticationSchemeProvider
                .GetAllSchemesAsync();

        if (!authenticationSchemes.Any(
            scheme =>
                scheme.Name ==
                JwtBearerDefaults.AuthenticationScheme))
        {
            return;
        }

        document.Components ??=
            new OpenApiComponents();

        document.Components.SecuritySchemes ??=
            new Dictionary<string, IOpenApiSecurityScheme>();

        document.Components.SecuritySchemes["Bearer"] =
            new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,

                Scheme = "bearer",

                BearerFormat = "JWT",

                In = ParameterLocation.Header,

                Description =
                    "Paste the JWT returned from " +
                    "POST /api/auth/login. " +
                    "Do not include the 'Bearer ' prefix."
            };

        var bearerRequirement =
            new OpenApiSecurityRequirement
            {
                [
                    new OpenApiSecuritySchemeReference(
                        "Bearer",
                        document)
                ] = new List<string>()
            };

        foreach (var operation in document.Paths.Values
                     .SelectMany(pathItem =>
                         pathItem.Operations))
        {
            operation.Value.Security ??=
                new List<OpenApiSecurityRequirement>();

            operation.Value.Security.Add(
                bearerRequirement
            );
        }
    }
}