using NorthwindCoffee.Mvc.Content;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

var site = ContentSite.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(site);

// The client is registered only when there is a key to give it. ContentDeliveryOptions validates at
// construction, so registering a keyless client would turn "not configured yet" — a state this
// sample renders an explanation for — into a startup crash.
if (site.IsConfigured)
{
    builder.Services.AddEbitexContentDelivery(options =>
    {
        options.ApiKey = site.DeliveryKey;
        options.SiteId = site.SiteId;
        options.BaseUrl = site.ApiBaseUrl;
    });

    builder.Services.AddScoped<SiteChromeReader>();
    builder.Services.AddScoped<CatalogueReader>();
}

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

// Deliberately no UseHttpsRedirection. The sample runs over http://localhost, which browsers treat
// as a secure context — so the preview cookie's Secure attribute is honoured there — and Composer
// frames it at exactly that origin. Redirecting would break the framed URL for no gain locally.

// A page Composer cannot frame cannot be previewed.
app.Use(async (context, next) =>
{
    context.Response.Headers["Content-Security-Policy"] = $"frame-ancestors {site.FrameAncestors}";
    await next();
});

app.UseStaticFiles();

// Before routing, so the one-time token is spent and redirected away before any page read happens.
// On a request carrying neither a token nor the cookie it does nothing at all.
app.UseMiddleware<NorthwindCoffee.Mvc.Preview.PreviewSessionMiddleware>();

app.UseRouting();

// Order matters: the page route is a catch-all, so everything with a fixed address is mapped first.
app.MapControllerRoute("sitemap-shard", "sitemap-{index:int}.xml", new { controller = "Sitemap", action = "Shard" });
app.MapControllerRoute("sitemap", "sitemap.xml", new { controller = "Sitemap", action = "Index" });
app.MapControllerRoute("buyer-type", "buyer-type", new { controller = "BuyerType", action = "Set" });
app.MapControllerRoute("error", "error", new { controller = "Page", action = "Error" });
app.MapControllerRoute("page", "{**path}", new { controller = "Page", action = "Index" });

app.Run();
