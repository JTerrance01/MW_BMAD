using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Enums;

namespace MixWarz.Infrastructure.Persistence.Seed
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var services = scope.ServiceProvider;
            var context = services.GetRequiredService<AppDbContext>();
            var userManager = services.GetRequiredService<UserManager<User>>();
            var roleManager = services.GetRequiredService<RoleManager<Role>>();

            // Ensure database is created and migrations are applied
            context.Database.Migrate();

            //// Seed roles if they don't exist
            //await SeedRolesAsync(roleManager);

            //// Seed users if none exist
            //if (!context.Users.Any())
            //{
            //    await SeedUsersAsync(userManager);
            //    await SeedAdminsAsync(userManager);
            //}

            //await SeedUsersAsync(userManager);
            //await SeedAdminsAsync(userManager);

            // Seed roles if they don't exist
            await SeedRolesAsync(roleManager);

            // Seed users if none exist
            if (!context.Users.Any())
            {
                await SeedUsersAsync(userManager);
                await SeedAdminsAsync(userManager);
            }

            // Seed blog data if none exist
            if (!context.BlogCategories.Any())
            {
                await SeedBlogCategoriesAsync(context);
            }

            if (!context.BlogTags.Any())
            {
                await SeedBlogTagsAsync(context);
            }

            if (!context.BlogArticles.Any())
            {
                await SeedBlogArticlesAsync(context, userManager);
            }

            // Seed JudgingCriteria if none exist
            if (!context.JudgingCriterias.Any())
            {
                await SeedJudgingCriteriaAsync(context);
            }

            // Ensure all blog articles (except the draft) have BlogArticleStatus.Published
            var articles = await context.BlogArticles.ToListAsync();
            foreach (var article in articles)
            {
                // Check if this is our draft article or a published one
                bool isDraft = article.Title.Contains("DRAFT");

                // Set the appropriate status
                article.Status = isDraft ? BlogArticleStatus.Draft : BlogArticleStatus.Published;

                // Update the database
                context.BlogArticles.Update(article);
            }
            await context.SaveChangesAsync();

            // Seed competitions if none exist
            if (!context.Competitions.Any())
            {
                await SeedCompetitionsAsync(context, userManager);
            }
        }

        private static async Task SeedRolesAsync(RoleManager<Role> roleManager)
        {
            string[] roleNames = { "Admin", "User", "Organizer" };

            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    var role = new Role
                    {
                        Name = roleName,
                        NormalizedName = roleName.ToUpper(),
                        Description = $"{roleName} role"
                    };

                    await roleManager.CreateAsync(role);
                }
            }
        }

        private static async Task SeedUsersAsync(UserManager<User> userManager)
        {
            // Create 25 regular users with realistic music production usernames
            var users = new List<(User User, string Password)>
            {
                (new User { UserName = "beatmaker42", Email = "beatmaker42@example.com", FirstName = "Robert", LastName = "Johnson", RegistrationDate = DateTime.UtcNow.AddMonths(-10), EmailConfirmed = true, Bio = "Beat maker from LA, specializing in trap beats and lo-fi hip hop." }, "Password123!"), // Password: Password123!
                (new User { UserName = "synth_queen", Email = "synth_queen@example.com", FirstName = "Sarah", LastName = "Miller", RegistrationDate = DateTime.UtcNow.AddMonths(-9), EmailConfirmed = true, Bio = "Synthesizer enthusiast creating ambient and electronic music since 2010." }, "Password123!"), // Password: Password123!
                (new User { UserName = "mix_master_mike", Email = "mixmaster@example.com", FirstName = "Michael", LastName = "Davis", RegistrationDate = DateTime.UtcNow.AddMonths(-8), EmailConfirmed = true, Bio = "Professional mixing engineer with 10+ years experience in the industry." }, "Password123!"), // Password: Password123!
                (new User { UserName = "edm_producer", Email = "edm_producer@example.com", FirstName = "David", LastName = "Wilson", RegistrationDate = DateTime.UtcNow.AddMonths(-8), EmailConfirmed = true, Bio = "EDM producer and DJ specializing in future bass and house music." }, "Password123!"), // Password: Password123!
                (new User { UserName = "vinyl_junkie", Email = "vinyl_junkie@example.com", FirstName = "Jessica", LastName = "Brown", RegistrationDate = DateTime.UtcNow.AddMonths(-7), EmailConfirmed = true, Bio = "Collector of rare vinyl and sample-based hip hop producer." }, "Password123!"), // Password: Password123!
                (new User { UserName = "bass_addict", Email = "bass_addict@example.com", FirstName = "Thomas", LastName = "Lee", RegistrationDate = DateTime.UtcNow.AddMonths(-7), EmailConfirmed = true, Bio = "Bass music producer focusing on dubstep and drum & bass." }, "Password123!"), // Password: Password123!
                (new User { UserName = "loop_queen", Email = "loop_queen@example.com", FirstName = "Amanda", LastName = "Garcia", RegistrationDate = DateTime.UtcNow.AddMonths(-6), EmailConfirmed = true, Bio = "Specializing in creating unique loops and textures for film and games." }, "Password123!"), // Password: Password123!
                (new User { UserName = "master_composer", Email = "master_composer@example.com", FirstName = "Richard", LastName = "Taylor", RegistrationDate = DateTime.UtcNow.AddMonths(-6), EmailConfirmed = true, Bio = "Classically trained composer exploring electronic and orchestral fusion." }, "Password123!"), // Password: Password123!
                (new User { UserName = "sound_sculptor", Email = "sound_sculptor@example.com", FirstName = "Patricia", LastName = "Martinez", RegistrationDate = DateTime.UtcNow.AddMonths(-5), EmailConfirmed = true, Bio = "Sound designer focused on creating unique sonic landscapes." }, "Password123!"), // Password: Password123!
                (new User { UserName = "drum_machine", Email = "drum_machine@example.com", FirstName = "Derek", LastName = "Anderson", RegistrationDate = DateTime.UtcNow.AddMonths(-5), EmailConfirmed = true, Bio = "Rhythm specialist with expertise in programming electronic drums." }, "Password123!"), // Password: Password123!
                (new User { UserName = "melody_maker", Email = "melody_maker@example.com", FirstName = "Emma", LastName = "Thompson", RegistrationDate = DateTime.UtcNow.AddMonths(-4), EmailConfirmed = true, Bio = "Creating catchy melodies for pop and R&B productions." }, "Password123!"), // Password: Password123!
                (new User { UserName = "wave_rider", Email = "wave_rider@example.com", FirstName = "Jason", LastName = "Wright", RegistrationDate = DateTime.UtcNow.AddMonths(-4), EmailConfirmed = true, Bio = "Synthwave and retrowave producer inspired by 80s film soundtracks." }, "Password123!"), // Password: Password123!
                (new User { UserName = "fx_master", Email = "fx_master@example.com", FirstName = "Nicole", LastName = "Clark", RegistrationDate = DateTime.UtcNow.AddMonths(-3), EmailConfirmed = true, Bio = "Specializing in creative audio effects processing and sound design." }, "Password123!"), // Password: Password123!
                (new User { UserName = "vocal_producer", Email = "vocal_producer@example.com", FirstName = "Andrew", LastName = "Nelson", RegistrationDate = DateTime.UtcNow.AddMonths(-3), EmailConfirmed = true, Bio = "Vocal producer with expertise in recording, tuning, and processing vocals." }, "Password123!"), // Password: Password123!
                (new User { UserName = "sample_hunter", Email = "sample_hunter@example.com", FirstName = "Laura", LastName = "Mitchell", RegistrationDate = DateTime.UtcNow.AddMonths(-2), EmailConfirmed = true, Bio = "Passionate about field recording and finding unique sounds." }, "Password123!"), // Password: Password123!
                (new User { UserName = "dj_scratch", Email = "dj_scratch@example.com", FirstName = "Kevin", LastName = "Rodriguez", RegistrationDate = DateTime.UtcNow.AddMonths(-2), EmailConfirmed = true, Bio = "Hip hop DJ and turntablist with 15 years of experience." }, "Password123!"), // Password: Password123!
                (new User { UserName = "tech_producer", Email = "tech_producer@example.com", FirstName = "Olivia", LastName = "Harris", RegistrationDate = DateTime.UtcNow.AddMonths(-1), EmailConfirmed = true, Bio = "Techno producer specializing in minimalist and driving compositions." }, "Password123!"), // Password: Password123!
                (new User { UserName = "bass_guitarist", Email = "bass_guitarist@example.com", FirstName = "Brian", LastName = "Walker", RegistrationDate = DateTime.UtcNow.AddMonths(-1), EmailConfirmed = true, Bio = "Bass player and producer blending live instruments with electronic elements." }, "Password123!"), // Password: Password123!
                (new User { UserName = "synth_collector", Email = "synth_collector@example.com", FirstName = "Amy", LastName = "Collins", RegistrationDate = DateTime.UtcNow.AddDays(-25), EmailConfirmed = true, Bio = "Vintage synth enthusiast creating warm analog sounds." }, "Password123!"), // Password: Password123!
                (new User { UserName = "remix_king", Email = "remix_king@example.com", FirstName = "George", LastName = "Bennett", RegistrationDate = DateTime.UtcNow.AddDays(-20), EmailConfirmed = true, Bio = "Remixer transforming popular tracks into dance floor favorites." }, "Password123!"), // Password: Password123!
                (new User { UserName = "mix_engineer", Email = "mix_engineer@example.com", FirstName = "Sophia", LastName = "Adams", RegistrationDate = DateTime.UtcNow.AddDays(-15), EmailConfirmed = true, Bio = "Professional mix engineer working with independent artists." }, "Password123!"), // Password: Password123!
                (new User { UserName = "mastering_pro", Email = "mastering_pro@example.com", FirstName = "Daniel", LastName = "Lopez", RegistrationDate = DateTime.UtcNow.AddDays(-10), EmailConfirmed = true, Bio = "Mastering engineer with a state-of-the-art analog/digital hybrid setup." }, "Password123!"), // Password: Password123!
                (new User { UserName = "sound_designer", Email = "sound_designer@example.com", FirstName = "Rachel", LastName = "Evans", RegistrationDate = DateTime.UtcNow.AddDays(-7), EmailConfirmed = true, Bio = "Sound designer creating audio for films, games, and interactive media." }, "Password123!"), // Password: Password123!
                (new User { UserName = "studio_producer", Email = "studio_producer@example.com", FirstName = "Matthew", LastName = "Cooper", RegistrationDate = DateTime.UtcNow.AddDays(-5), EmailConfirmed = true, Bio = "Music producer with over 100 commercial releases to my name." }, "Password123!"), // Password: Password123!
                (new User { UserName = "electronic_composer", Email = "electronic_composer@example.com", FirstName = "Jennifer", LastName = "Scott", RegistrationDate = DateTime.UtcNow.AddDays(-3), EmailConfirmed = true, Bio = "Composer blending orchestral elements with electronic textures." }, "Password123!"), // Password: Password123!
            };

            foreach (var (user, password) in users)
            {
                if (await userManager.FindByNameAsync(user.UserName) == null)
                {
                    await userManager.CreateAsync(user, password);
                    await userManager.AddToRoleAsync(user, "User");
                }
            }
        }

        private static async Task SeedAdminsAsync(UserManager<User> userManager)
        {
            // Create 3 admin users
            var admins = new List<(User User, string Password)>
            {
                (new User { UserName = "admin", Email = "admin@mixwarz.com", FirstName = "Admin", LastName = "User", RegistrationDate = DateTime.UtcNow.AddYears(-1), EmailConfirmed = true, Bio = "Main system administrator" }, "Admin123!"), // Password: Admin123!
                (new User { UserName = "john_admin", Email = "john@mixwarz.com", FirstName = "John", LastName = "Smith", RegistrationDate = DateTime.UtcNow.AddMonths(-11), EmailConfirmed = true, Bio = "Content and community manager" }, "Admin123!"), // Password: Admin123!
                (new User { UserName = "lisa_admin", Email = "lisa@mixwarz.com", FirstName = "Lisa", LastName = "Wong", RegistrationDate = DateTime.UtcNow.AddMonths(-9), EmailConfirmed = true, Bio = "Product and competition coordinator" }, "Admin123!"), // Password: Admin123!
            };

            foreach (var (admin, password) in admins)
            {
                if (await userManager.FindByNameAsync(admin.UserName) == null)
                {
                    await userManager.CreateAsync(admin, password);
                    await userManager.AddToRoleAsync(admin, "Admin");
                    // Also add to User role for testing purposes
                    await userManager.AddToRoleAsync(admin, "User");
                }
            }
        }

        private static async Task SeedProductsAsync(AppDbContext context)
        {
            // Create products in various categories
            var products = new List<Product>
            {
                // Sample Packs (Category 1)
                new Product { Name = "Urban Drums Pro", Description = "Professional drum samples for urban music production featuring 808s, trap drums, and classic hip-hop percussion.", Price = 29.99m, ProductType = ProductType.SamplePack, DownloadFileS3Key = "sample-packs/urban-drums-pro.zip", CategoryId = 1, ImagePath = "/uploads/products/urban-drums.jpg" },
                new Product { Name = "Ambient Textures", Description = "Atmospheric sound textures ideal for ambient music, film scoring, and game audio. Includes drones, pads, and evolving soundscapes.", Price = 24.99m, ProductType = ProductType.SamplePack, DownloadFileS3Key = "sample-packs/ambient-textures.zip", CategoryId = 1, ImagePath = "/uploads/products/ambient-textures.jpg" },
                new Product { Name = "EDM Essentials", Description = "Everything you need for modern EDM production including leads, basses, drums, FX, and vocal hooks.", Price = 39.99m, ProductType = ProductType.SamplePack, DownloadFileS3Key = "sample-packs/edm-essentials.zip", CategoryId = 1, ImagePath = "/uploads/products/edm-essentials.jpg" },
                new Product { Name = "Organic Percussion", Description = "Hand-recorded percussion instruments from around the world, perfect for adding organic elements to electronic productions.", Price = 19.99m, ProductType = ProductType.SamplePack, DownloadFileS3Key = "sample-packs/organic-percussion.zip", CategoryId = 1, ImagePath = "/uploads/products/organic-percussion.jpg" },
                new Product { Name = "Future Bass Toolkit", Description = "Comprehensive collection of sounds for future bass production, featuring wonky chords, vocal chops, and heavy basses.", Price = 34.99m, ProductType = ProductType.SamplePack, DownloadFileS3Key = "sample-packs/future-bass-toolkit.zip", CategoryId = 1, ImagePath = "/uploads/products/future-bass.jpg" },
                
                // Synth Presets (Category 2)
                new Product { Name = "Serum Ultra Pack", Description = "500+ professional presets for Xfer Serum covering all electronic genres from ambient to dubstep.", Price = 49.99m, ProductType = ProductType.PresetBank, DownloadFileS3Key = "presets/serum-ultra-pack.zip", CategoryId = 2, ImagePath = "/uploads/products/serum-presets.jpg" },
                new Product { Name = "Massive X Soundbank", Description = "Extensive preset collection for Native Instruments Massive X featuring cutting-edge sound design.", Price = 39.99m, ProductType = ProductType.PresetBank, DownloadFileS3Key = "presets/massive-x-soundbank.zip", CategoryId = 2, ImagePath = "/uploads/products/massive-x.jpg" },
                new Product { Name = "Analog Synth Collection", Description = "Meticulously sampled classic analog synthesizers, recreated as presets for popular soft synths.", Price = 29.99m, ProductType = ProductType.PresetBank, DownloadFileS3Key = "presets/analog-synth-collection.zip", CategoryId = 2, ImagePath = "/uploads/products/analog-synths.jpg" },
                new Product { Name = "FM Explorer", Description = "Deep dive into FM synthesis with this comprehensive preset pack for FM-capable synthesizers.", Price = 19.99m, ProductType = ProductType.PresetBank, DownloadFileS3Key = "presets/fm-explorer.zip", CategoryId = 2, ImagePath = "/uploads/products/fm-explorer.jpg" },
                
                // DAW Templates (Category 3)
                new Product { Name = "Progressive House Template", Description = "Complete Ableton Live template for producing professional progressive house tracks in the style of top producers.", Price = 39.99m, ProductType = ProductType.ProjectTemplate, DownloadFileS3Key = "templates/progressive-house-template.zip", CategoryId = 3, ImagePath = "/uploads/products/prog-house.jpg" },
                new Product { Name = "Hip Hop Blueprint", Description = "FL Studio template revealing the exact arrangement, mixing, and production techniques used in modern hip hop hits.", Price = 34.99m, ProductType = ProductType.ProjectTemplate, DownloadFileS3Key = "templates/hip-hop-blueprint.zip", CategoryId = 3, ImagePath = "/uploads/products/hip-hop-template.jpg" },
                new Product { Name = "Techno Production Suite", Description = "Comprehensive Logic Pro template for techno production with advanced routing, effects chains, and sample organization.", Price = 44.99m, ProductType = ProductType.ProjectTemplate, DownloadFileS3Key = "templates/techno-production-suite.zip", CategoryId = 3, ImagePath = "/uploads/products/techno-template.jpg" },
                
                // Tutorials (Category 4)
                new Product { Name = "Mixing Masterclass", Description = "10-hour video course covering professional mixing techniques for all genres, from recording to final polish.", Price = 79.99m, ProductType = ProductType.Tutorial, DownloadFileS3Key = "tutorials/mixing-masterclass.zip", CategoryId = 4, ImagePath = "/uploads/products/mixing-masterclass.jpg" },
                new Product { Name = "Sound Design Fundamentals", Description = "Learn the art of creating unique sounds from scratch in this comprehensive video series.", Price = 59.99m, ProductType = ProductType.Tutorial, DownloadFileS3Key = "tutorials/sound-design-fundamentals.zip", CategoryId = 4, ImagePath = "/uploads/products/sound-design.jpg" },
                new Product { Name = "Music Theory for Producers", Description = "Practical music theory specifically for electronic music producers, focusing on chord progressions, melodies, and arrangements.", Price = 49.99m, ProductType = ProductType.Tutorial, DownloadFileS3Key = "tutorials/music-theory-for-producers.zip", CategoryId = 4, ImagePath = "/uploads/products/music-theory.jpg" },
                new Product { Name = "Professional Mastering Workflow", Description = "Step-by-step mastering tutorial revealing the exact techniques used by Grammy-winning mastering engineers.", Price = 69.99m, ProductType = ProductType.Tutorial, DownloadFileS3Key = "tutorials/pro-mastering-workflow.zip", CategoryId = 4, ImagePath = "/uploads/products/mastering.jpg" },
                
                // Virtual Instruments (Category 5)
                new Product { Name = "Analog Piano Suite", Description = "Deeply sampled vintage electric pianos and keyboards with intuitive controls and effects.", Price = 99.99m, ProductType = ProductType.VirtualInstrument, DownloadFileS3Key = "instruments/analog-piano-suite.zip", CategoryId = 5, ImagePath = "/uploads/products/piano-suite.jpg" },
                new Product { Name = "Hybrid Orchestral Engine", Description = "Next-generation orchestral instrument combining traditional samples with synthesis for film composers.", Price = 149.99m, ProductType = ProductType.VirtualInstrument, DownloadFileS3Key = "instruments/hybrid-orchestral-engine.zip", CategoryId = 5, ImagePath = "/uploads/products/orchestral.jpg" },
                
                // Plugins (Category 6)
                new Product { Name = "Quantum Compressor", Description = "State-of-the-art compressor plugin with advanced side-chaining, multi-band processing, and analog modeling.", Price = 89.99m, ProductType = ProductType.Plugin, DownloadFileS3Key = "plugins/quantum-compressor.zip", CategoryId = 6, ImagePath = "/uploads/products/compressor.jpg" },
                new Product { Name = "Spectral Suite", Description = "Collection of spectral processing tools for creative sound design and mixing solutions.", Price = 79.99m, ProductType = ProductType.Plugin, DownloadFileS3Key = "plugins/spectral-suite.zip", CategoryId = 6, ImagePath = "/uploads/products/spectral.jpg" },
                new Product { Name = "Virtual Console Collection", Description = "Meticulously modeled classic mixing consoles bringing analog warmth to your DAW.", Price = 129.99m, ProductType = ProductType.Plugin, DownloadFileS3Key = "plugins/virtual-console.zip", CategoryId = 6, ImagePath = "/uploads/products/console.jpg" },
                new Product { Name = "Modular FX Rack", Description = "Customizable effects processor with modular routing and dozens of high-quality effects modules.", Price = 99.99m, ProductType = ProductType.Plugin, DownloadFileS3Key = "plugins/modular-fx-rack.zip", CategoryId = 6, ImagePath = "/uploads/products/fx-rack.jpg" },
            };

            await context.Products.AddRangeAsync(products);
            await context.SaveChangesAsync();
        }

        private static async Task SeedCompetitionsAsync(AppDbContext context, UserManager<User> userManager)
        {
            // Get admin users to be competition organizers
            var admin1 = await userManager.FindByNameAsync("admin");
            var admin2 = await userManager.FindByNameAsync("john_admin");
            var admin3 = await userManager.FindByNameAsync("lisa_admin");

            if (admin1 == null || admin2 == null || admin3 == null) return;

            // Create competitions
            var competitions = new List<Competition>
            {
                new Competition
                {
                    Title = "Summer Bass Music Challenge",
                    Description = "Create your best bass-heavy track for a chance to win studio gear and promotion.",
                    RulesText = "Tracks must be between 3-5 minutes. Any bass music genre accepted (dubstep, drum & bass, trap, etc.). Original content only.",
                    StartDate = DateTime.UtcNow.AddDays(-30),
                    EndDate = DateTime.UtcNow.AddDays(30),
                    PrizeDetails = "1st Place: $500 + Studio Monitor Package, 2nd Place: $250 + Headphones, 3rd Place: $100 + Plugin Bundle",
                    Status = CompetitionStatus.OpenForSubmissions,
                    OrganizerUserId = admin1.Id,
                    CreationDate = DateTime.UtcNow.AddDays(-40)
                },
                new Competition
                {
                    Title = "Remix Competition: Classical Fusion",
                    Description = "Reimagine a classical masterpiece as a modern electronic track.",
                    RulesText = "Use the provided stems from Bach's Brandenburg Concerto. Remixes must maintain some recognizable elements of the original while bringing your own style.",
                    StartDate = DateTime.UtcNow.AddDays(-60),
                    EndDate = DateTime.UtcNow.AddDays(-10),
                    PrizeDetails = "1st Place: Distribution deal + $1000, 2nd Place: Studio time + $500, 3rd Place: Software bundle + $250",
                    Status = CompetitionStatus.InJudging,
                    OrganizerUserId = admin2.Id,
                    CreationDate = DateTime.UtcNow.AddDays(-70)
                },
                new Competition
                {
                    Title = "Film Scoring Challenge",
                    Description = "Create an original score for a short film clip provided by an indie filmmaker.",
                    RulesText = "Score must sync perfectly with the provided video clip. Any style acceptable but must enhance the emotional impact of the scene.",
                    StartDate = DateTime.UtcNow.AddDays(10),
                    EndDate = DateTime.UtcNow.AddDays(40),
                    PrizeDetails = "Winner will be hired to score the full film with a $3000 budget. Runners up will receive orchestral sample libraries.",
                    Status = CompetitionStatus.Upcoming,
                    OrganizerUserId = admin3.Id,
                    CreationDate = DateTime.UtcNow.AddDays(-5)
                },
                new Competition
                {
                    Title = "Lo-Fi Hip Hop Production",
                    Description = "Create the perfect relaxing lo-fi hip hop track for studying and chilling.",
                    RulesText = "Tracks should be 2-4 minutes long. Must include sampled elements with proper clearance as well as original composition.",
                    StartDate = DateTime.UtcNow.AddDays(-90),
                    EndDate = DateTime.UtcNow.AddDays(-30),
                    PrizeDetails = "Winning tracks will be featured on major lo-fi playlists and receive hardware sampler equipment.",
                    Status = CompetitionStatus.Closed,
                    OrganizerUserId = admin1.Id,
                    CreationDate = DateTime.UtcNow.AddDays(-100)
                },
            };

            await context.Competitions.AddRangeAsync(competitions);
            await context.SaveChangesAsync();
        }

        private static async Task SeedOrdersAsync(AppDbContext context)
        {
            // Get some users and products for orders
            var users = await context.Users.Take(10).ToListAsync();
            var products = await context.Products.ToListAsync();

            if (!users.Any() || !products.Any()) return;

            // Create a few orders with order items
            foreach (var user in users)
            {
                // Each user gets 1-3 orders
                var orderCount = new Random().Next(1, 4);

                for (int i = 0; i < orderCount; i++)
                {
                    // Create a new order
                    var order = new Order
                    {
                        UserId = user.Id,
                        OrderDate = DateTime.UtcNow.AddDays(-new Random().Next(1, 180)),
                        Status = OrderStatus.Paid,
                        BillingAddress = $"{new Random().Next(100, 999)} Main St, Anytown, AN {new Random().Next(10000, 99999)}"
                    };

                    await context.Orders.AddAsync(order);
                    await context.SaveChangesAsync();

                    // Add 1-5 items to the order
                    var itemCount = new Random().Next(1, 6);
                    decimal totalAmount = 0;

                    // Get a random selection of products for this order
                    var orderProducts = products
                        .OrderBy(x => Guid.NewGuid())
                        .Take(itemCount)
                        .ToList();

                    foreach (var product in orderProducts)
                    {
                        var quantity = new Random().Next(1, 3); // 1 or 2 quantities
                        var orderItem = new OrderItem
                        {
                            OrderId = order.OrderId,
                            ProductId = product.ProductId,
                            Quantity = quantity,
                            PriceAtPurchase = product.Price
                        };

                        totalAmount += product.Price * quantity;

                        await context.OrderItems.AddAsync(orderItem);

                        // Create user product access for this purchase
                        var userAccess = new UserProductAccess
                        {
                            UserId = user.Id,
                            ProductId = product.ProductId,
                            OrderId = order.OrderId,
                            AccessGrantedDate = DateTime.UtcNow,
                        };

                        await context.UserProductAccesses.AddAsync(userAccess);
                    }

                    // Update order total
                    order.TotalAmount = totalAmount;
                    order.Status = OrderStatus.Fulfilled;

                    context.Orders.Update(order);
                    await context.SaveChangesAsync();
                }
            }
        }

        private static async Task SeedBlogCategoriesAsync(AppDbContext context)
        {
            var categories = new List<BlogCategory>
            {
                new BlogCategory { Name = "Mixing Techniques", Slug = "mixing-techniques" },
                new BlogCategory { Name = "Music Production", Slug = "music-production" },
                new BlogCategory { Name = "Sound Design", Slug = "sound-design" },
                new BlogCategory { Name = "Industry News", Slug = "industry-news" },
                new BlogCategory { Name = "Interviews", Slug = "interviews" },
                new BlogCategory { Name = "Gear Reviews", Slug = "gear-reviews" },
                new BlogCategory { Name = "Tutorials", Slug = "tutorials" },
            };

            await context.BlogCategories.AddRangeAsync(categories);
            await context.SaveChangesAsync();
        }

        private static async Task SeedBlogTagsAsync(AppDbContext context)
        {
            var tags = new List<BlogTag>
            {
                new BlogTag { Name = "EQ", Slug = "eq" },
                new BlogTag { Name = "Compression", Slug = "compression" },
                new BlogTag { Name = "Reverb", Slug = "reverb" },
                new BlogTag { Name = "Mastering", Slug = "mastering" },
                new BlogTag { Name = "Recording", Slug = "recording" },
                new BlogTag { Name = "VST Plugins", Slug = "vst-plugins" },
                new BlogTag { Name = "DAW", Slug = "daw" },
                new BlogTag { Name = "Ableton", Slug = "ableton" },
                new BlogTag { Name = "FL Studio", Slug = "fl-studio" },
                new BlogTag { Name = "Logic Pro", Slug = "logic-pro" },
                new BlogTag { Name = "Bass", Slug = "bass" },
                new BlogTag { Name = "Drums", Slug = "drums" },
                new BlogTag { Name = "Vocals", Slug = "vocals" },
                new BlogTag { Name = "Arrangement", Slug = "arrangement" },
                new BlogTag { Name = "Synthesis", Slug = "synthesis" },
                new BlogTag { Name = "Mixing", Slug = "mixing" },
            };

            await context.BlogTags.AddRangeAsync(tags);
            await context.SaveChangesAsync();
        }

        private static async Task SeedBlogArticlesAsync(AppDbContext context, UserManager<User> userManager)
        {
            // Get some users to be article authors (admins make good authors)
            var admin1 = await userManager.FindByNameAsync("admin");
            var admin2 = await userManager.FindByNameAsync("john_admin");
            var admin3 = await userManager.FindByNameAsync("lisa_admin");

            // Also get some regular users to be authors
            var author1 = await userManager.FindByNameAsync("mix_master_mike");
            var author2 = await userManager.FindByNameAsync("sound_sculptor");

            if (admin1 == null || admin2 == null || admin3 == null || author1 == null || author2 == null) return;

            // Get categories and tags
            var categories = await context.BlogCategories.ToListAsync();
            var tags = await context.BlogTags.ToListAsync();

            if (!categories.Any() || !tags.Any()) return;

            // Sample content (shortened for brevity)
            string sampleContent = @"
## Introduction

This is a sample article with markdown content. It includes various formatting elements.

### Key Points

- Point 1: Important information about this topic
- Point 2: Additional details worth noting
- Point 3: Final consideration for readers

## Main Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam at justo nec nisi fringilla finibus. 
Phasellus eget felis vel nisl aliquam suscipit. Vivamus malesuada, eros vitae commodo ultrices, 
mauris elit tincidunt lectus, at lacinia turpis elit id libero.

### Subheading

In the world of audio processing, understanding signal flow is crucial. Always start with the 
source material and work your way through the chain methodically.

```
// Example code snippet
function processAudio(input) {
  const gain = 0.5;
  return input * gain;
}
```

## Conclusion

Remember these techniques next time you're working on a project. Practice makes perfect!

![Example Image](https://example.com/image.jpg)

> Remember: The most important thing is to trust your ears!
";

            string mixingContent = @"
## The Art of EQ: Carving Space in Your Mix

One of the most powerful tools in a mixing engineer's arsenal is equalization. 
When used properly, EQ allows you to create space for each element in your mix, 
resulting in clarity and definition.

### Subtractive EQ: Your First Step

Always start with subtractive EQ before reaching for boosts. Removing problematic 
frequencies will clean up your mix and create room for other elements.

Key frequency ranges to consider:
- **20-60 Hz**: Sub bass region
- **60-200 Hz**: Bass fundamentals
- **200-500 Hz**: Muddiness/boxiness
- **500-2kHz**: Midrange presence
- **2-8kHz**: Presence and definition
- **8-20kHz**: Air and sparkle

### Finding Problem Frequencies

1. Use a narrow boost of 6-10dB
2. Sweep through the frequency spectrum
3. Listen for resonances and harsh areas
4. Once identified, cut instead of boost
5. Use narrow Q for surgical cuts, wider Q for tonal shaping

## Complementary EQ Techniques

When mixing related instruments, use complementary EQ to help them sit together.
For example, if you boost at 3kHz on vocals, consider cutting the same frequency
on competing instruments like guitars.

Remember that the goal isn't to make each track sound amazing in solo, but rather
to create a cohesive mix where all elements work together.

> The best EQ decisions are made in context of the full mix!
";

            string compressionContent = @"
## Dynamic Control: Mastering Compression

Compression is often misunderstood, but when used correctly, it's the secret 
weapon that gives professional mixes their power and consistency.

### Understanding the Parameters

- **Threshold**: Determines when compression begins
- **Ratio**: Controls how much compression is applied
- **Attack**: How quickly compression engages
- **Release**: How quickly compression disengages
- **Knee**: Transitions between uncompressed and compressed states
- **Makeup Gain**: Brings the level back up after compression

### Common Compression Mistakes

1. **Too much reduction**: Aim for 3-6dB of gain reduction for subtle control
2. **Too fast attack times**: Can kill transients and impact
3. **Improper release settings**: Creates pumping or doesn't recover in time
4. **Over-compression**: Squashing the life out of your mix

## Practical Applications

### Drums
Use faster attack times (1-10ms) to control peaks, but not so fast that you lose the initial impact.
Try release times that follow the rhythm of your song.

### Vocals
Gentler ratios (2:1 or 3:1) with medium attack times help maintain natural vocal dynamics
while providing consistency.

### Bass
Longer attack times (10-30ms) preserve the initial punch, while fast-medium release times
maintain consistent energy.

> Remember: Compression should be felt, not heard. If it's obvious, you're probably using too much!
";

            // Create a list of articles with different content
            var articles = new List<BlogArticle>
            {
                new BlogArticle
                {
                    Title = "5 Essential EQ Techniques Every Producer Should Know",
                    Slug = "5-essential-eq-techniques",
                    Content = @"
## The Art of EQ: Carving Space in Your Mix

One of the most powerful tools in a mixing engineer's arsenal is equalization. 
When used properly, EQ allows you to create space for each element in your mix, 
resulting in clarity and definition.

### Subtractive EQ: Your First Step

Always start with subtractive EQ before reaching for boosts. Removing problematic 
frequencies will clean up your mix and create room for other elements.

Key frequency ranges to consider:
- **20-60 Hz**: Sub bass region
- **60-200 Hz**: Bass fundamentals
- **200-500 Hz**: Muddiness/boxiness
- **500-2kHz**: Midrange presence
- **2-8kHz**: Presence and definition
- **8-20kHz**: Air and sparkle

### Finding Problem Frequencies

1. Use a narrow boost of 6-10dB
2. Sweep through the frequency spectrum
3. Listen for resonances and harsh areas
4. Once identified, cut instead of boost
5. Use narrow Q for surgical cuts, wider Q for tonal shaping

## Complementary EQ Techniques

When mixing related instruments, use complementary EQ to help them sit together.
For example, if you boost at 3kHz on vocals, consider cutting the same frequency
on competing instruments like guitars.

Remember that the goal isn't to make each track sound amazing in solo, but rather
to create a cohesive mix where all elements work together.

> The best EQ decisions are made in context of the full mix!
",
                    AuthorId = admin1.Id,
                    AuthorName = $"{admin1.FirstName} {admin1.LastName}",
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    UpdatedAt = DateTime.UtcNow.AddDays(-30),
                    Status = BlogArticleStatus.Published,
                    PublishedAt = DateTime.UtcNow.AddDays(-30),
                    FeaturedImageUrl = "/uploads/blog/eq-techniques.jpg"
                },
                new BlogArticle
                {
                    Title = "The Ultimate Guide to Compression",
                    Slug = "ultimate-guide-compression",
                    Content = @"
## Dynamic Control: Mastering Compression

Compression is often misunderstood, but when used correctly, it's the secret 
weapon that gives professional mixes their power and consistency.

### Understanding the Parameters

- **Threshold**: Determines when compression begins
- **Ratio**: Controls how much compression is applied
- **Attack**: How quickly compression engages
- **Release**: How quickly compression disengages
- **Knee**: Transitions between uncompressed and compressed states
- **Makeup Gain**: Brings the level back up after compression

### Common Compression Mistakes

1. **Too much reduction**: Aim for 3-6dB of gain reduction for subtle control
2. **Too fast attack times**: Can kill transients and impact
3. **Improper release settings**: Creates pumping or doesn't recover in time
4. **Over-compression**: Squashing the life out of your mix

## Practical Applications

### Drums
Use faster attack times (1-10ms) to control peaks, but not so fast that you lose the initial impact.
Try release times that follow the rhythm of your song.

### Vocals
Gentler ratios (2:1 or 3:1) with medium attack times help maintain natural vocal dynamics
while providing consistency.

### Bass
Longer attack times (10-30ms) preserve the initial punch, while fast-medium release times
maintain consistent energy.

> Remember: Compression should be felt, not heard. If it's obvious, you're probably using too much!
",
                    AuthorId = admin2.Id,
                    AuthorName = $"{admin2.FirstName} {admin2.LastName}",
                    CreatedAt = DateTime.UtcNow.AddDays(-25),
                    UpdatedAt = DateTime.UtcNow.AddDays(-25),
                    Status = BlogArticleStatus.Published,
                    PublishedAt = DateTime.UtcNow.AddDays(-25),
                    FeaturedImageUrl = "/uploads/blog/compression-guide.jpg"
                },
                new BlogArticle
                {
                    Title = "How to Create Professional Vocal Chains",
                    Slug = "professional-vocal-chains",
                    Content = "Creating Professional Vocal Chains",
                    AuthorId = author1.Id,
                    AuthorName = $"{author1.FirstName} {author1.LastName}",
                    CreatedAt = DateTime.UtcNow.AddDays(-20),
                    UpdatedAt = DateTime.UtcNow.AddDays(-20),
                    Status = BlogArticleStatus.Published,
                    PublishedAt = DateTime.UtcNow.AddDays(-20),
                    FeaturedImageUrl = "/uploads/blog/vocal-chains.jpg"
                },
                new BlogArticle
                {
                    Title = "Synthesizer Basics: Understanding Oscillators, Filters and Envelopes",
                    Slug = "synth-basics-oscillators-filters-envelopes",
                    Content = sampleContent.Replace("Introduction", "Synthesizer Basics"),
                    AuthorId = author2.Id,
                    AuthorName = $"{author2.FirstName} {author2.LastName}",
                    CreatedAt = DateTime.UtcNow.AddDays(-15),
                    UpdatedAt = DateTime.UtcNow.AddDays(-15),
                    Status = BlogArticleStatus.Published,
                    PublishedAt = DateTime.UtcNow.AddDays(-15),
                    FeaturedImageUrl = "/uploads/blog/synth-basics.jpg"
                },
                new BlogArticle
                {
                    Title = "Mastering at Home: 10 Tips for Better Results",
                    Slug = "mastering-at-home-tips",
                    Content = sampleContent.Replace("Introduction", "Mastering at Home"),
                    AuthorId = admin3.Id,
                    AuthorName = $"{admin3.FirstName} {admin3.LastName}",
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    UpdatedAt = DateTime.UtcNow.AddDays(-10),
                    Status = BlogArticleStatus.Published,
                    PublishedAt = DateTime.UtcNow.AddDays(-10),
                    FeaturedImageUrl = "/uploads/blog/home-mastering.jpg"
                },
                new BlogArticle
                {
                    Title = "The Art of Sample Selection: Building Your Sound Library",
                    Slug = "art-of-sample-selection",
                    Content = "Building Your Sound Library",
                    AuthorId = admin1.Id,
                    AuthorName = $"{admin1.FirstName} {admin1.LastName}",
                    CreatedAt = DateTime.UtcNow.AddDays(-5),
                    UpdatedAt = DateTime.UtcNow.AddDays(-5),
                    Status = BlogArticleStatus.Published,
                    PublishedAt = DateTime.UtcNow.AddDays(-5),
                    FeaturedImageUrl = "/uploads/blog/sample-selection.jpg"
                },
                new BlogArticle
                {
                    Title = "Mixing in Headphones: Pros, Cons and Best Practices",
                    Slug = "mixing-in-headphones",
                    Content = "Mixing in Headphones",
                    AuthorId = admin2.Id,
                    AuthorName = $"{admin2.FirstName} {admin2.LastName}",
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    UpdatedAt = DateTime.UtcNow.AddDays(-2),
                    Status = BlogArticleStatus.Published,
                    PublishedAt = DateTime.UtcNow.AddDays(-2),
                    FeaturedImageUrl = "/uploads/blog/headphone-mixing.jpg"
                },
                new BlogArticle
                {
                    Title = "Creating Space with Reverb and Delay",
                    Slug = "creating-space-reverb-delay",
                    Content = "Creating Space with Effects",
                    AuthorId = author1.Id,
                    AuthorName = $"{author1.FirstName} {author1.LastName}",
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    UpdatedAt = DateTime.UtcNow.AddDays(-1),
                    Status = BlogArticleStatus.Published,
                    PublishedAt = DateTime.UtcNow.AddDays(-1),
                    FeaturedImageUrl = "/uploads/blog/reverb-delay.jpg"
                },
                // Draft article
                new BlogArticle
                {
                    Title = "Upcoming DAW Features We're Excited About (DRAFT)",
                    Slug = "upcoming-daw-features-draft",
                    Content = "Upcoming DAW Features",
                    AuthorId = admin3.Id,
                    AuthorName = $"{admin3.FirstName} {admin3.LastName}",
                    CreatedAt = DateTime.UtcNow.AddDays(-9),
                    UpdatedAt = DateTime.UtcNow.AddDays(-9),
                    Status = BlogArticleStatus.Draft,
                    PublishedAt = null,
                    FeaturedImageUrl = "/uploads/blog/future-daws.jpg"
                }
            };

            await context.BlogArticles.AddRangeAsync(articles);
            await context.SaveChangesAsync();

            // Now create article-category and article-tag relationships
            var articleCategories = new List<ArticleCategory>();
            var articleTags = new List<ArticleTag>();

            // Article 1: EQ Techniques
            var article1 = articles[0];
            articleCategories.Add(new ArticleCategory { BlogArticleId = article1.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "mixing-techniques").BlogCategoryId });
            articleCategories.Add(new ArticleCategory { BlogArticleId = article1.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "tutorials").BlogCategoryId });

            articleTags.Add(new ArticleTag { BlogArticleId = article1.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "eq").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article1.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "mixing").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article1.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "mastering").BlogTagId });

            // Article 2: Compression Guide
            var article2 = articles[1];
            articleCategories.Add(new ArticleCategory { BlogArticleId = article2.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "mixing-techniques").BlogCategoryId });
            articleCategories.Add(new ArticleCategory { BlogArticleId = article2.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "tutorials").BlogCategoryId });

            articleTags.Add(new ArticleTag { BlogArticleId = article2.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "compression").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article2.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "mixing").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article2.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "drums").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article2.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "vocals").BlogTagId });

            // Article 3: Vocal Chains
            var article3 = articles[2];
            articleCategories.Add(new ArticleCategory { BlogArticleId = article3.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "mixing-techniques").BlogCategoryId });
            articleCategories.Add(new ArticleCategory { BlogArticleId = article3.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "tutorials").BlogCategoryId });

            articleTags.Add(new ArticleTag { BlogArticleId = article3.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "vocals").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article3.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "compression").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article3.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "eq").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article3.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "recording").BlogTagId });

            // Article 4: Synth Basics
            var article4 = articles[3];
            articleCategories.Add(new ArticleCategory { BlogArticleId = article4.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "sound-design").BlogCategoryId });
            articleCategories.Add(new ArticleCategory { BlogArticleId = article4.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "tutorials").BlogCategoryId });

            articleTags.Add(new ArticleTag { BlogArticleId = article4.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "synthesis").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article4.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "vst-plugins").BlogTagId });

            // Article 5: Mastering at Home
            var article5 = articles[4];
            articleCategories.Add(new ArticleCategory { BlogArticleId = article5.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "mixing-techniques").BlogCategoryId });
            articleCategories.Add(new ArticleCategory { BlogArticleId = article5.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "tutorials").BlogCategoryId });

            articleTags.Add(new ArticleTag { BlogArticleId = article5.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "mastering").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article5.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "eq").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article5.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "compression").BlogTagId });

            // Article 6: Sample Selection
            var article6 = articles[5];
            articleCategories.Add(new ArticleCategory { BlogArticleId = article6.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "music-production").BlogCategoryId });

            articleTags.Add(new ArticleTag { BlogArticleId = article6.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "recording").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article6.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "drums").BlogTagId });

            // Article 7: Mixing in Headphones
            var article7 = articles[6];
            articleCategories.Add(new ArticleCategory { BlogArticleId = article7.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "mixing-techniques").BlogCategoryId });
            articleCategories.Add(new ArticleCategory { BlogArticleId = article7.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "gear-reviews").BlogCategoryId });

            articleTags.Add(new ArticleTag { BlogArticleId = article7.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "mixing").BlogTagId });

            // Article 8: Reverb and Delay
            var article8 = articles[7];
            articleCategories.Add(new ArticleCategory { BlogArticleId = article8.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "mixing-techniques").BlogCategoryId });
            articleCategories.Add(new ArticleCategory { BlogArticleId = article8.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "tutorials").BlogCategoryId });

            articleTags.Add(new ArticleTag { BlogArticleId = article8.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "reverb").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article8.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "mixing").BlogTagId });

            // Article 9: DAW Features (Draft)
            var article9 = articles[8];
            articleCategories.Add(new ArticleCategory { BlogArticleId = article9.BlogArticleId, BlogCategoryId = categories.First(c => c.Slug == "industry-news").BlogCategoryId });

            articleTags.Add(new ArticleTag { BlogArticleId = article9.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "daw").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article9.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "ableton").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article9.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "fl-studio").BlogTagId });
            articleTags.Add(new ArticleTag { BlogArticleId = article9.BlogArticleId, BlogTagId = tags.First(t => t.Slug == "logic-pro").BlogTagId });

            // Add all relationships
            await context.ArticleCategories.AddRangeAsync(articleCategories);
            await context.ArticleTags.AddRangeAsync(articleTags);
            await context.SaveChangesAsync();
        }

        private static async Task SeedJudgingCriteriaAsync(AppDbContext context)
        {
            // Get competition 21 (or any competition if 21 doesn't exist)
            var competition = await context.Competitions.FirstOrDefaultAsync(c => c.CompetitionId == 21);
            if (competition == null)
            {
                // If competition 21 doesn't exist, use the first available competition
                competition = await context.Competitions.FirstOrDefaultAsync();
                if (competition == null)
                {
                    // No competitions exist, skip seeding criteria
                    return;
                }
            }

            var judgingCriteria = new List<JudgingCriteria>
            {
                new JudgingCriteria
                {
                    Id = 1,
                    CompetitionId = competition.CompetitionId,
                    Name = "Technical Clarity",
                    Description = "Overall mix clarity, frequency balance, technical execution",
                    ScoringType = ScoringType.Slider,
                    MinScore = 1,
                    MaxScore = 10,
                    Weight = 0.3m,
                    DisplayOrder = 1,
                    IsCommentRequired = false
                },
                new JudgingCriteria
                {
                    Id = 2,
                    CompetitionId = competition.CompetitionId,
                    Name = "Creative Balance",
                    Description = "Creative use of effects, spatial placement, artistic vision",
                    ScoringType = ScoringType.Slider,
                    MinScore = 1,
                    MaxScore = 10,
                    Weight = 0.25m,
                    DisplayOrder = 2,
                    IsCommentRequired = false
                },
                new JudgingCriteria
                {
                    Id = 3,
                    CompetitionId = competition.CompetitionId,
                    Name = "Dynamic Range",
                    Description = "Use of dynamics, compression, overall punch",
                    ScoringType = ScoringType.Stars,
                    MinScore = 1,
                    MaxScore = 5,
                    Weight = 0.2m,
                    DisplayOrder = 3,
                    IsCommentRequired = false
                },
                new JudgingCriteria
                {
                    Id = 4,
                    CompetitionId = competition.CompetitionId,
                    Name = "Stereo Imaging",
                    Description = "Width, depth, stereo field utilization",
                    ScoringType = ScoringType.RadioButtons,
                    MinScore = 1,
                    MaxScore = 4,
                    Weight = 0.25m,
                    DisplayOrder = 4,
                    IsCommentRequired = false,
                    ScoringOptions = "[\"Poor\",\"Fair\",\"Good\",\"Excellent\"]"
                }
            };

            foreach (var criteria in judgingCriteria)
            {
                context.JudgingCriterias.Add(criteria);
            }

            await context.SaveChangesAsync();
        }
    }
}