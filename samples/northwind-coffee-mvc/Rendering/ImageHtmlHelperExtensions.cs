using System.Text.Encodings.Web;
using Ebitex.Content.Delivery;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace NorthwindCoffee.Mvc.Rendering;

/// <summary>
/// Renders a bound image component — the <c>image</c> Contract, whose fields are a blob and its alt
/// text.
///
/// <para>
/// A blob's delivered <c>url</c> is public and needs no key, which is what makes it usable in an
/// <c>&lt;img&gt;</c> at all: the delivery API itself is key-authenticated, so a URL pointing at it
/// would be a broken image for every visitor.
/// </para>
/// </summary>
public static class ImageHtmlHelperExtensions
{
    public static IHtmlContent CmsImage(this IHtmlHelper helper, ComponentValue? image, string? cssClass = null, bool eager = false)
    {
        ArgumentNullException.ThrowIfNull(helper);

        if (image is not { } component || !component.IsResolved)
        {
            return HtmlString.Empty;
        }

        var content = component.Content;
        if (content.Blob("file")?.Url is not { Length: > 0 } url)
        {
            return HtmlString.Empty;
        }

        // Alt text is authored and mandatory in the model, but a missing one must still produce valid
        // markup: an empty alt marks the image decorative, which is the right answer when nobody said
        // otherwise. Inventing a description from the filename would be worse than saying nothing.
        var alt = HtmlEncoder.Default.Encode(content.Text("alt") ?? "");
        var source = HtmlEncoder.Default.Encode(url);

        var classAttribute = cssClass is { Length: > 0 }
            ? $" class=\"{HtmlEncoder.Default.Encode(cssClass)}\""
            : "";

        // The first image on a page is the one a visitor waits for; everything else can wait for the
        // viewport.
        var loading = eager ? "eager" : "lazy";

        return new HtmlString($"<img src=\"{source}\" alt=\"{alt}\" loading=\"{loading}\" decoding=\"async\"{classAttribute} />");
    }
}
