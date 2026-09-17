using Ebitex.Content.Delivery;

namespace NorthwindCoffee.Mvc.Content;

/// <summary>
/// The site's header and footer: two Components with no Experience node of their own, addressed by
/// external id rather than by path.
/// </summary>
/// <param name="Header">The header's content, or <see langword="null"/> when it could not be read.</param>
/// <param name="Footer">The footer's content, or <see langword="null"/> when it could not be read.</param>
public sealed record SiteChrome(ComponentValue? Header, ComponentValue? Footer)
{
    public static readonly SiteChrome Empty = new(null, null);
}

/// <summary>
/// Reads the chrome for a page, once per request.
///
/// <para>
/// <strong>Deliberately not cached</strong>, which is where this sample parts company with its
/// Next.js twin. That one memoizes the chrome for the life of the process, and an unbounded memo
/// means a publish never arrives — the hazard spec 666 spent a whole step on. Here every request
/// reads the Delivery API, whose own response cache is purged on publish, so an edit reaches the site
/// on the next request with no revalidation hook to explain or forget.
/// </para>
///
/// <para>
/// Each half degrades on its own: a header that fails to load must not take the footer, or the page,
/// down with it.
/// </para>
/// </summary>
public sealed class SiteChromeReader(ContentDeliveryClient delivery, ILogger<SiteChromeReader> logger)
{
    public const string HeaderExternalId = "site-header";
    public const string FooterExternalId = "site-footer";

    public async Task<SiteChrome> ReadAsync(string? locale, CancellationToken cancellationToken)
    {
        var header = ReadOneAsync(HeaderExternalId, locale, cancellationToken);
        var footer = ReadOneAsync(FooterExternalId, locale, cancellationToken);

        await Task.WhenAll(header, footer);

        return new SiteChrome(header.Result, footer.Result);
    }

    private async Task<ComponentValue?> ReadOneAsync(string externalId, string? locale, CancellationToken cancellationToken)
    {
        try
        {
            return await delivery.GetComponentAsync(
                externalId,
                new ComponentOptions { Locale = locale, IncludeReferencePaths = true },
                cancellationToken);
        }
        catch (ContentDeliveryException exception)
        {
            // A missing or unpublished chrome component is a normal state in a half-seeded
            // organization, and the page below it is still worth rendering.
            logger.LogWarning(
                exception,
                "Could not read '{ExternalId}' ({ErrorCode}); rendering the page without it.",
                externalId,
                exception.ErrorCode);

            return null;
        }
    }
}
