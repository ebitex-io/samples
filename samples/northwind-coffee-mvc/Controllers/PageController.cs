using Ebitex.Content.Delivery;
using Microsoft.AspNetCore.Mvc;
using NorthwindCoffee.Mvc.Content;
using NorthwindCoffee.Mvc.Rendering;

namespace NorthwindCoffee.Mvc.Controllers;

/// <summary>
/// Every page of this site. One address in, one <c>ResolvePathAsync</c>, one of four answers out.
/// </summary>
public sealed class PageController : Controller
{
    private readonly ContentSite _site;
    private readonly ContentDeliveryClient? _delivery;

    public PageController(ContentSite site, IServiceProvider services)
    {
        _site = site;

        // Resolved rather than injected, because the client is registered only when a key exists.
        // A constructor dependency would make "not configured yet" a 500 instead of an explanation.
        _delivery = services.GetService<ContentDeliveryClient>();
    }

    [HttpGet]
    public async Task<IActionResult> Index(string? path, CancellationToken cancellationToken)
    {
        if (_delivery is null)
        {
            return View("NotConfigured");
        }

        try
        {
            var result = await _delivery.ResolvePathAsync(
                AddressOf(path),
                new PathOptions
                {
                    Context = RequestContext.From(Request),

                    // Every link this site renders comes out of the document itself. Without this, a
                    // page would have to go looking for the addresses of the things it references.
                    IncludeReferencePaths = true,
                },
                cancellationToken);

            return result switch
            {
                PathResult.Presentation page => Render(page),

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

    private IActionResult Render(PathResult.Presentation page)
    {
        ViewData["Title"] = page.Title;
        ViewData["Locale"] = page.Locale;
        ViewData["Canonical"] = $"{_site.Origin.TrimEnd('/')}{page.Path}";

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
