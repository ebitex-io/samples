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

            // The site carries the locale in its own addresses, so every alternate URL is already the
            // one the server serves. Returning the path unchanged is what turns hreflang on without
            // this app composing a single address itself.
            LocaleUrl = (localePath, _, _) => localePath,
        });

        var document = documents.FirstOrDefault(candidate => candidate.Path == path);

        return document is null
            ? NotFound()
            : Content(document.Xml, "application/xml");
    }
}
