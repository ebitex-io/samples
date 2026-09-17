using System.Text.Encodings.Web;
using System.Text.RegularExpressions;
using Ebitex.Content.Delivery;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewEngines;

namespace NorthwindCoffee.Mvc.Rendering;

/// <summary>
/// Renders a Presentation envelope by finding the partial named for its Template's external id —
/// the same convention the JavaScript SDK's <c>presentations/&lt;externalId&gt;.tsx</c> renderers use,
/// reapplied to Razor.
///
/// <para>
/// This is the <em>only</em> way a partial renders another Presentation, so nested Presentations and
/// RichText embeds all arrive here. That is what makes the fallback rules below hold everywhere at
/// once rather than at each call site.
/// </para>
/// </summary>
public static partial class PresentationHtmlHelperExtensions
{
    public static async Task<IHtmlContent> PresentationAsync(this IHtmlHelper helper, PresentationEnvelope? envelope)
    {
        ArgumentNullException.ThrowIfNull(helper);

        if (envelope?.Template?.ExternalId is not { Length: > 0 } externalId)
        {
            return Notice(helper, "a Presentation arrived with no Template");
        }

        // An external id reaches this method from delivered content, and it is about to become part of
        // a file path. Slug-shaped or nothing: a Template can never be renamed into a path traversal.
        if (!SlugShaped().IsMatch(externalId))
        {
            return Notice(helper, $"Template external id '{externalId}' is not slug-shaped, so no partial was looked up");
        }

        if (envelope.Component is not { } component)
        {
            return Notice(helper, $"the '{externalId}' Presentation has no component binding");
        }

        // Not an error: a binding beyond the resolve depth, or genuinely unresolvable, is a normal
        // delivered shape. It must never throw, and must never render half a card.
        if (!component.IsResolved)
        {
            var why = component.Unresolvable ? "is unresolvable" : "was not expanded at this resolve depth";
            return Notice(helper, $"the '{externalId}' Presentation's content {why}");
        }

        var viewPath = $"~/Views/Presentations/{externalId}.cshtml";
        var engine = helper.ViewContext.HttpContext.RequestServices.GetRequiredService<ICompositeViewEngine>();

        if (!engine.GetView(executingFilePath: null, viewPath, isMainPage: false).Success)
        {
            return Notice(helper, $"no partial for Template '{externalId}' — add Views/Presentations/{externalId}.cshtml");
        }

        return await helper.PartialAsync(viewPath, envelope);
    }

    /// <summary>
    /// Renders every item of a list of Presentation envelopes, in order.
    /// </summary>
    public static async Task<IHtmlContent> PresentationsAsync(this IHtmlHelper helper, IEnumerable<PresentationEnvelope?>? envelopes)
    {
        var builder = new HtmlContentBuilder();

        foreach (var envelope in envelopes ?? [])
        {
            builder.AppendHtml(await helper.PresentationAsync(envelope));
        }

        return builder;
    }

    /// <summary>
    /// A developer-facing notice in Development, and nothing at all otherwise — the SSR sample's
    /// <c>fallback={() =&gt; null}</c> posture. A visitor never sees scaffolding, and a developer never
    /// has to wonder why a section vanished.
    /// </summary>
    private static IHtmlContent Notice(IHtmlHelper helper, string message)
    {
        var environment = helper.ViewContext.HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();

        if (!environment.IsDevelopment())
        {
            return HtmlString.Empty;
        }

        var encoded = HtmlEncoder.Default.Encode(message);
        return new HtmlString(
            $"""<p class="my-4 rounded border border-dashed border-line bg-sunken p-3 text-sm text-ink-muted">Presentation not rendered: {encoded}</p>""");
    }

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex SlugShaped();
}
