using System.Text;

using Electronic_Health_Record.Server.BackgroundJobs;
using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Filters;
using Electronic_Health_Record.Server.Services;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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

var jwtKey = jwtSection["Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key is missing from configuration."
    );

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

builder.Services.AddAuthorization();


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

app.MapStaticAssets();


// ============================================================
// OPENAPI + SCALAR
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.MapScalarApiReference(options =>
    {
        options.AddPreferredSecuritySchemes("Bearer");
    });
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

app.MapFallbackToFile("/index.html");


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