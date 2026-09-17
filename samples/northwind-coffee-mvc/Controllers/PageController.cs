using Ebitex.Content.Delivery;
using Microsoft.AspNetCore.Mvc;
using NorthwindCoffee.Mvc.Content;
using NorthwindCoffee.Mvc.Preview;
using NorthwindCoffee.Mvc.Rendering;

namespace NorthwindCoffee.Mvc.Controllers;

/// <summary>
/// Every page of this site. One address in, one <c>ResolvePathAsync</c>, one of four answers out.
/// </summary>
public sealed class PageController : Controller
{
    private readonly ContentSite _site;
    private readonly ContentDeliveryClient? _delivery;
    private readonly SiteChromeReader? _chrome;
    private readonly CatalogueReader? _catalogue;

    public PageController(ContentSite site, IServiceProvider services)
    {
        _site = site;

        // Resolved rather than injected, because the client is registered only when a key exists.
        // A constructor dependency would make "not configured yet" a 500 instead of an explanation.
        _delivery = services.GetService<ContentDeliveryClient>();
        _chrome = services.GetService<SiteChromeReader>();
        _catalogue = services.GetService<CatalogueReader>();
    }

    [HttpGet]
    public async Task<IActionResult> Index(string? path, CancellationToken cancellationToken)
    {
        if (_delivery is null)
        {
            return View("NotConfigured");
        }

        var address = AddressOf(path);

        try
        {
            PathResult result;

            try
            {
                result = await ResolveAsync(address, PreviewSessionMiddleware.SessionFor(HttpContext), cancellationToken);
            }
            catch (ContentDeliveryException ended) when (ended.IsPreviewSessionEnded)
            {
                // The editor closed the preview layer. Forget the session and render the published
                // page — a visitor who still holds the cookie never asked for an error.
                PreviewSessionMiddleware.Clear(HttpContext);
                result = await ResolveAsync(address, null, cancellationToken);
            }

            return result switch
            {
                PathResult.Presentation page => await RenderAsync(page, cancellationToken),

                // 308, not 302: the CMS vacated this path, and the target is already in this site's
                // own URL space — composed by the server, never by this app.
                PathResult.Redirect { TargetPath: { Length: > 0 } target } => RedirectPermanentPreserveMethod(target),

                PathResult.NotFound => PageNotFound(),

                // A redirect with no target, or a kind this client version does not know. Both mean
                // the server said something this build cannot honestly render.
                _ => StatusCode(StatusCodes.Status500InternalServerError),
            };
        }
        catch (ContentDeliveryException exception)
        {
            // The API's own request id is the reference support can find. Carry it to the view rather
            // than swallowing it into a log line nobody reading the page can see.
            ViewData["ContentRequestId"] = exception.RequestId;
            Response.StatusCode = StatusCodes.Status500InternalServerError;
            return View("Error");
        }
    }

    /// <summary>The exception handler's own path, mapped before the catch-all so it is not resolved
    /// as content.</summary>
    [HttpGet]
    public IActionResult Error() => View("Error");

    private Task<PathResult> ResolveAsync(string address, string? previewSession, CancellationToken cancellationToken) =>
        _delivery!.ResolvePathAsync(
            address,
            new PathOptions
            {
                Context = RequestContext.From(Request),

                // Every link this site renders comes out of the document itself. Without this, a page
                // would have to go looking for the addresses of the things it references.
                IncludeReferencePaths = true,

                // Present only inside Composer's frame. The client sends it on this endpoint and no
                // other, exactly as the API would accept it.
                PreviewSession = previewSession,
            },
            cancellationToken);

    private async Task<IActionResult> RenderAsync(PathResult.Presentation page, CancellationToken cancellationToken)
    {
        // The title is the one the CMS froze at publish, not one this app composed from a field it
        // guessed at: Contract.TitleFieldPath decided it, and it is the same title every other surface
        // of the platform reports for this page.
        ViewData["Title"] = page.Title;
        ViewData["Locale"] = page.Locale;

        var canonical = $"{_site.Origin.TrimEnd('/')}{page.Path}";
        ViewData["Canonical"] = canonical;

        var metadata = PageMetadata.For(page, canonical);
        ViewData["Description"] = metadata.Description;
        ViewData["Image"] = metadata.ImageUrl;
        ViewData["JsonLd"] = metadata.JsonLd;

        // The chrome is read in the locale the page itself came back in — never in one this app
        // inferred from the address, which it does not parse.
        ViewData["Chrome"] = _chrome is null
            ? SiteChrome.Empty
            : await _chrome.ReadAsync(page.Locale, cancellationToken);

        // The catalogue is a second query, made only for the Template that shows one: the page says a
        // catalogue goes here, and the stream says what is in it. Its filters live in the query string,
        // so this page is its own endpoint — there is no BFF route and nothing in the browser to ask.
        if (_catalogue is not null && page.Envelope?.Template?.ExternalId == "coffee-index")
        {
            var filters = CatalogueReader.FiltersFrom(Request.Query);

            ViewData["CatalogueFilters"] = filters;
            ViewData["Catalogue"] = await _catalogue.ReadAsync(filters, page.Locale, cancellationToken);
        }

        return View("Index", page);
    }

    private IActionResult PageNotFound()
    {
        Response.StatusCode = StatusCodes.Status404NotFound;
        return View("NotFound");
    }

    /// <summary>
    /// The address exactly as this site received it, leading slash and locale prefix included. This
    /// app parses, strips and composes no locale: the server reads the prefix and tells us which
    /// locale it answered in.
    /// </summary>
    private static string AddressOf(string? path) =>
        string.IsNullOrWhiteSpace(path) ? "/" : "/" + path.TrimStart('/');
}
