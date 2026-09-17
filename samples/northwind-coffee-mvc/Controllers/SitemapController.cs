using Ebitex.Content.Delivery;
using Ebitex.Content.Delivery.Sitemap;
using Microsoft.AspNetCore.Mvc;
using NorthwindCoffee.Mvc.Content;

namespace NorthwindCoffee.Mvc.Controllers;

/// <summary>
/// <c>/sitemap.xml</c>, and the shards behind it when the site outgrows one document.
///
/// <para>
/// The package builds the XML; this controller decides only where each document is served. That split
/// matters more than it looks: an index references its shards <em>by URL</em>, so a shard served
/// anywhere but its own <see cref="SitemapDocument.Path"/> produces an index of 404s. The routes in
/// <c>Program.cs</c> match the builder's own defaults for exactly that reason.
/// </para>
/// </summary>
public sealed class SitemapController : Controller
{
    private readonly ContentSite _site;
    private readonly ContentDeliveryClient? _delivery;

    public SitemapController(ContentSite site, IServiceProvider services)
    {
        _site = site;
        _delivery = services.GetService<ContentDeliveryClient>();
    }

    [HttpGet]
    public Task<IActionResult> Index(CancellationToken cancellationToken) =>
        DocumentAsync("/sitemap.xml", cancellationToken);

    [HttpGet]
    public Task<IActionResult> Shard(int index, CancellationToken cancellationToken) =>
        DocumentAsync($"/sitemap-{index}.xml", cancellationToken);

    private async Task<IActionResult> DocumentAsync(string path, CancellationToken cancellationToken)
    {
        if (_delivery is null)
        {
            return NotFound();
        }

        // Built per request, like every other read in this sample. A sitemap is asked for rarely and by
        // crawlers, so the one thing worth optimising for is that a newly published page appears in it
        // immediately rather than whenever a cache decided to expire.
        var data = await _delivery.GetSitemapAsync(cancellationToken: cancellationToken);

        var documents = SitemapBuilder.BuildDocuments(data, new SitemapDocumentsOptions
        {
            Origin = _site.Origin,

            // Supplying LocaleUrl at all is what makes the sitemap carry hreflang. It composes
            // nothing: the site is `pathPrefix` in Content, so every path this response carries is
            // already in the site's own URL space — prefixing again would give /fr/fr/…. What is
            // left is the *decision*, and the interesting half is the refusal.
            //
            // GetSitemapAsync reports a French slot for EVERY page, because a locale slot
            // materializes for every node the moment any node carries a localized slug (a slug
            // resolves override-else-default). Those URLs are real and they work — they serve the
            // French locale, falling back to English copy where nobody has translated it.
            // Advertising them as hreflang="fr" would tell a crawler a French reader finds French
            // there, which for most of this site is false, and a wrong claim earns a worse result
            // than no claim.
            //
            // The CMS cannot answer this and deliberately does not try: a page is routinely
            // translated while keeping its slug, so slug ownership was never a translation signal.
            // Only this app knows, so only this app can say. Keyed on the NODE'S OWN default path
            // rather than the per-locale one — the first argument arrives as /fr/cafes for the
            // French call, and keying on that would drop exactly the pages translated enough to
            // have earned a French address.
            LocaleUrl = (localePath, locale, node) =>
            {
                if (!SiteLocales.Codes.Contains(locale))
                {
                    // A slot this site has no UI for. The CMS's locale tree is free to grow ahead
                    // of this app.
                    return null;
                }

                return locale == SiteLocales.Default || SiteLocales.TranslatedPaths.Contains(node.Path)
                    ? localePath
                    : null;
            },
        });

        var document = documents.FirstOrDefault(candidate => candidate.Path == path);

        return document is null
            ? NotFound()
            : Content(document.Xml, "application/xml");
    }
}
