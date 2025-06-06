using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.IdentityModel.Tokens;
using MixWarz.Application.Features.Auth.Commands.LoginUser;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;
using MixWarz.Infrastructure.Persistence;
using MixWarz.Infrastructure.Persistence.Repositories;
using MixWarz.Infrastructure.Services;
using System.Text;
using MixWarz.Application.Features.Auth.Commands.RegisterUser;
using FluentValidation.AspNetCore;
using Amazon.S3;
using AutoMapper;
using MixWarz.Application.Common.Interfaces;
using MixWarz.Infrastructure.Extensions;
using MixWarz.Infrastructure.Jobs;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container

// Configure Kestrel to allow 2GB requests
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 2L * 1024 * 1024 * 1024; // 2GB
});

// Configure IIS (if hosting on IIS)
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 2L * 1024 * 1024 * 1024; // 2GB
});

// Configure Multipart Form Data limit (for IFormFile)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 2L * 1024 * 1024 * 1024; // 2GB
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
});

// Add DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register IAppDbContext
builder.Services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

// Add Identity
builder.Services.AddIdentity<User, Role>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Add repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICompetitionRepository, CompetitionRepository>();
builder.Services.AddScoped<ISubmissionRepository, SubmissionRepository>();
builder.Services.AddScoped<ISubmissionVoteRepository, SubmissionVoteRepository>();
builder.Services.AddScoped<IRound1AssignmentRepository, Round1AssignmentRepository>();
builder.Services.AddScoped<ISubmissionGroupRepository, SubmissionGroupRepository>();

// Add e-commerce repositories
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IUserActivityRepository, UserActivityRepository>();

// Add services
builder.Services.AddScoped<ITokenService, TokenService>();

// Register Round1AssignmentService for competition voting
builder.Services.AddScoped<IRound1AssignmentService, Round1AssignmentService>();

// Register Round2VotingService for final round voting
builder.Services.AddScoped<IRound2VotingService, Round2VotingService>();

// Register SongCreatorPickRepository for Song Creator picks
builder.Services.AddScoped<ISongCreatorPickRepository, SongCreatorPickRepository>();

// Register QuartzJobConfiguration
builder.Services.AddSingleton<QuartzJobConfiguration>();

// Configure Quartz.NET scheduler jobs for competition automation
if (!builder.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("EnableQuartzScheduler"))
{
    builder.Services.AddQuartzScheduledJobs(builder.Configuration);
}

// Register virus scan service
builder.Services.AddScoped<BasicVirusScanService>();
// Register with both interfaces using the same instance to avoid duplicate implementations
builder.Services.AddScoped<MixWarz.Application.Common.Interfaces.IVirusScanService>(provider =>
    provider.GetRequiredService<BasicVirusScanService>());
builder.Services.AddScoped<MixWarz.Domain.Interfaces.IVirusScanService>(provider =>
    provider.GetRequiredService<BasicVirusScanService>());

// Register blog service - Epic 6
builder.Services.AddScoped<IBlogService, BlogService>();

// Configure AWS services
if (builder.Environment.IsDevelopment())
{
    Console.WriteLine("Using mock file storage service for development");
    builder.Services.AddTransient<IFileStorageService, MockFileStorageService>();
}
else
{
    Console.WriteLine("Using S3 file storage service for production");
    builder.Services.AddAWSService<IAmazonS3>();
    builder.Services.AddScoped<IFileStorageService, S3FileStorageService>();
}

// Add S3 Profile Media Service for user profiles
Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");
if (builder.Environment.IsDevelopment())
{
    Console.WriteLine("Using mock S3 profile media service for development");
    // Use singleton to improve performance in development, safely using IServiceProvider to resolve scoped services
    builder.Services.AddSingleton<IS3ProfileMediaService, MockS3ProfileMediaService>();
}
else
{
    // Use real AWS implementation for production
    Console.WriteLine("Using real S3 profile media service for production");
    builder.Services.AddAWSService<IAmazonS3>();
    builder.Services.AddScoped<IS3ProfileMediaService, S3ProfileMediaService>();
}

// Add MediatR
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(RegisterUserCommand).Assembly);
});

// Add FluentValidation
builder.Services.AddFluentValidationAutoValidation();

// Add CORS configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });

    options.AddPolicy("AllowSpecificOrigins",
        builder =>
        {
            builder.WithOrigins("http://localhost:3000", "https://localhost:3000")
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials();
        });

    // Add a specific policy for activity tracking that doesn't require credentials
    options.AddPolicy("AllowActivityTracking",
        builder =>
        {
            builder.WithOrigins("http://localhost:3000", "https://localhost:3000")
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .SetIsOriginAllowed(origin => true) // Allow any origin for activity tracking
                   .AllowCredentials(); // Allow credentials but don't require them
        });
});

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(
    jwtSettings["Key"] ?? "DefaultKeyForDevelopmentOnlyDoNotUseInProduction12345678901234");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "MixWarz",
        ValidAudience = jwtSettings["Audience"] ?? "MixWarzApp",
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero // Reduce clock skew to improve token expiry precision
    };
});

Action<Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder> AdminRolePolicy = policy => policy.RequireRole("Admin");

// Add Authorization services
builder.Services.AddAuthorization(options =>
{
    // Define policies for specific roles
    options.AddPolicy("RequireAdminRole", AdminRolePolicy);
    options.AddPolicy("RequireUserRole", policy => policy.RequireRole("User"));
    options.AddPolicy("RequireOrganizerRole", policy => policy.RequireRole("Organizer"));
});

// Add AutoMapper - scan all assemblies
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// Configure support for form data binding with files
builder.Services.AddControllers(options =>
{
    // Increase the request size limit for file uploads
    options.MaxModelBindingCollectionSize = int.MaxValue;
})
.AddJsonOptions(options =>
{
    // Configure JSON serialization
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    // Convert enums to strings instead of numbers
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Validate AutoMapper configuration
var mapper = app.Services.GetRequiredService<IMapper>();
mapper.ConfigurationProvider.AssertConfigurationIsValid();

// Apply migrations
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();

        // Only apply migrations in non-memory configuration
        if (context.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory")
        {
            context.Database.Migrate();
            Console.WriteLine("Migrations successfully applied");
        }

        // Seed the database
        await services.SeedDataAsync();
        Console.WriteLine("Data successfully seeded");
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during migration or data seeding.");
    }
}

// Configure middleware (order is important)
// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // In development, use CORS with credentials support
    app.UseCors("AllowSpecificOrigins");
}
else
{
    // In production, use more restrictive CORS
    app.UseCors("AllowAllOrigins");
    app.UseHsts();
}

// Important: UseCors must come before UseAuthentication/Authorization
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// Configure static file serving
app.UseStaticFiles(); // Default static files from wwwroot

// Configure additional static file serving for uploads - this serves files from AppData/uploads at /uploads path
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "AppData", "uploads")),
    RequestPath = "/uploads"
});

app.MapControllers();

app.Run();

