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
//
// This registers the Bearer JWT security scheme in the
// generated OpenAPI document.
//
// Scalar reads this security scheme and provides the
// "Authorize" button where you can paste your JWT.
//
// ============================================================

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});


// ============================================================
// APPLICATION SERVICES
// ============================================================

builder.Services.AddScoped<TokenService>();


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
        // Keep true when using HTTPS.
        // For local HTTP testing only, this can be false.
        options.RequireHttpsMetadata = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
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
            // TOKEN LIFETIME
            // ------------------------------------------------

            ValidateLifetime = true,

            // Allows a small amount of clock difference
            // between client and server.
            ClockSkew = TimeSpan.FromMinutes(1),


            // ------------------------------------------------
            // SIGNING KEY
            // ------------------------------------------------

            ValidateIssuerSigningKey = true,

            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey)
                )
        };
    });


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
    // -----------------------------------------------
    // OpenAPI JSON
    // -----------------------------------------------

    app.MapOpenApi();


    // -----------------------------------------------
    // Scalar API Reference
    // -----------------------------------------------
    //
    // "Bearer" MUST match the security scheme name
    // created inside BearerSecuritySchemeTransformer.
    //
    // This makes Bearer the preferred authentication
    // scheme in Scalar.
    //
    // You can then:
    //
    // 1. Click Authorize
    // 2. Paste your JWT
    // 3. Authorize
    // 4. Test /me
    //
    // Scalar automatically sends:
    //
    // Authorization: Bearer <your-token>
    //
    // -----------------------------------------------

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
//
// Authentication MUST execute before Authorization.
//
// Authentication:
//     JWT -> validates token -> creates ClaimsPrincipal
//
// ============================================================

app.UseAuthentication();


// ============================================================
// AUTHORIZATION
// ============================================================
//
// Authorization checks:
//
//     [Authorize]
//     [Authorize(Roles = "...")]
//     Policies
//
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
//
// This transformer adds:
//
//     Bearer
//
// to the OpenAPI security schemes.
//
// Scalar detects this and displays the authentication
// interface.
//
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
        // ----------------------------------------------------
        // Get all registered authentication schemes
        // ----------------------------------------------------

        var authenticationSchemes =
            await authenticationSchemeProvider.GetAllSchemesAsync();


        // ----------------------------------------------------
        // Make sure JWT Bearer is registered
        // ----------------------------------------------------

        if (!authenticationSchemes.Any(
            scheme =>
                scheme.Name ==
                JwtBearerDefaults.AuthenticationScheme))
        {
            return;
        }


        // ----------------------------------------------------
        // Initialize OpenAPI Components
        // ----------------------------------------------------

        document.Components ??=
            new OpenApiComponents();


        document.Components.SecuritySchemes ??=
            new Dictionary<string, IOpenApiSecurityScheme>();


        // ----------------------------------------------------
        // Register Bearer JWT Security Scheme
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // Create Bearer Security Requirement
        // ----------------------------------------------------

        var bearerRequirement =
            new OpenApiSecurityRequirement
            {
                [
                    new OpenApiSecuritySchemeReference(
                        "Bearer",
                        document)
                ] = new List<string>()
            };


        // ----------------------------------------------------
        // Apply Bearer Authentication to Operations
        // ----------------------------------------------------
        //
        // This tells OpenAPI that the endpoints support
        // Bearer authentication.
        //
        // Scalar uses this information to automatically
        // attach the Authorization header when executing
        // secured endpoints.
        //
        // ----------------------------------------------------

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