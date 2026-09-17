namespace NorthwindCoffee.Mvc.Content;

/// <summary>
/// Everything this sample needs from configuration, read once at startup.
///
/// <para>
/// One type answers "is this sample configured?", so every surface agrees on it. Without a delivery
/// key the site still starts and renders an explanation — which is what lets CI build it with no
/// credentials, and what a reader sees before they have imported the content and minted a key.
/// </para>
/// </summary>
public sealed class ContentSite
{
    /// <summary>A <em>server-side</em> delivery key. A browser-safe key is refused with
    /// <c>403 origin_denied</c>, because a server sends no <c>Origin</c>.</summary>
    public string? DeliveryKey { get; init; }

    /// <summary>The site's root node id, sent as <c>site=</c>. The API cannot infer it: the request's
    /// <c>Host</c> header names the API, never this site.</summary>
    public Guid? SiteId { get; init; }

    /// <summary>The API's <em>origin</em>. The client appends <c>/content/delivery/v1</c> itself.</summary>
    public Uri ApiBaseUrl { get; init; } = new("https://api.ebitex.io");

    /// <summary>Composer's origins, for <c>Content-Security-Policy: frame-ancestors</c>. A page
    /// Composer cannot frame cannot be previewed.</summary>
    public string FrameAncestors { get; init; } = "https://content.ebitex.io";

    /// <summary>This deployment's own origin, used for absolute URLs in the sitemap. Never derived
    /// from a request: which forwarded-host header to trust is a deployment fact, not a library's
    /// guess (see <c>docs/content-sdk-dotnet.md</c>).</summary>
    public string Origin { get; init; } = "http://localhost:5181";

    /// <summary>Where the Forms embed on the contact page points.</summary>
    public string FormsBaseUrl { get; init; } = "https://forms.ebitex.io";

    /// <summary>The organization slug in that embed's URL.</summary>
    public string FormsOrgSlug { get; init; } = "";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(DeliveryKey) && SiteId is not null;

    public static ContentSite FromConfiguration(IConfiguration configuration)
    {
        var section = configuration.GetSection("Content");

        return new ContentSite
        {
            DeliveryKey = Trimmed(section["DeliveryKey"]),
            SiteId = Guid.TryParse(section["SiteId"], out var siteId) ? siteId : null,
            ApiBaseUrl = Uri.TryCreate(Trimmed(section["ApiBaseUrl"]), UriKind.Absolute, out var baseUrl)
                ? baseUrl
                : new Uri("https://api.ebitex.io"),
            FrameAncestors = Trimmed(section["FrameAncestors"]) ?? "https://content.ebitex.io",
            Origin = Trimmed(section["Origin"]) ?? "http://localhost:5181",
            FormsBaseUrl = Trimmed(section["FormsBaseUrl"]) ?? "https://forms.ebitex.io",
            FormsOrgSlug = Trimmed(section["FormsOrgSlug"]) ?? "",
        };
    }

    // A placeholder left in appsettings.json is whitespace or an obvious stand-in, and treating it as
    // a real value would produce a 401 instead of the explanation the reader needs.
    private static string? Trimmed(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('<') ? null : trimmed;
    }
}
