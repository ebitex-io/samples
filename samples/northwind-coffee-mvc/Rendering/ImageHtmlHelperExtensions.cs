using System.Text.Encodings.Web;
using Ebitex.Content.Delivery;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace NorthwindCoffee.Mvc.Rendering;

/// <summary>
/// Renders a bound media component: the <c>image</c> Contract (a blob and its alt text), or an
/// image, video or document from the Ebitex Assets library. <see cref="MediaReader"/> reads the
/// shapes; this writes the markup.
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

        return Render(image, cssClass, eager);
    }

    /// <summary>The markup behind <see cref="CmsImage"/>, separate from the helper so it can be tested without a view context.</summary>
    public static IHtmlContent Render(ComponentValue? image, string? cssClass = null, bool eager = false)
    {
        var classAttribute = cssClass is { Length: > 0 }
            ? $" class=\"{HtmlEncoder.Default.Encode(cssClass)}\""
            : "";

        // The first image on a page is the one a visitor waits for; everything else can wait for the
        // viewport.
        var loading = eager ? "eager" : "lazy";

        return MediaReader.Read(image) switch
        {
            Media.Image picture => Picture(picture, classAttribute, loading),
            Media.Video video => Video(video, classAttribute),
            Media.Document document => Document(document),
            _ => HtmlString.Empty,
        };
    }

    private static HtmlString Picture(Media.Image image, string classAttribute, string loading)
    {
        // Alt text is authored and mandatory in the model, but a missing one must still produce valid
        // markup: an empty alt marks the image decorative, which is the right answer when nobody said
        // otherwise. Inventing a description from the filename would be worse than saying nothing.
        // Width and height are written only when the value has them, so nothing is invented.
        var alt = HtmlEncoder.Default.Encode(image.Alt);
        var source = HtmlEncoder.Default.Encode(image.Url);
        var size = image is { Width: > 0, Height: > 0 } ? $" width=\"{image.Width}\" height=\"{image.Height}\"" : "";

        return new HtmlString($"<img src=\"{source}\" alt=\"{alt}\"{size} loading=\"{loading}\" decoding=\"async\"{classAttribute} />");
    }

    /// <summary>
    /// An HTML5 player. The delivered URL is an HLS manifest: Safari and iOS play it in a
    /// <c>&lt;video&gt;</c> directly; every other browser gets hls.js, fetched on demand by the
    /// script that follows the element, so a page with no video downloads nothing extra.
    /// </summary>
    private static HtmlString Video(Media.Video video, string classAttribute)
    {
        var label = video.Name is { Length: > 0 } ? $" aria-label=\"{HtmlEncoder.Default.Encode(video.Name)}\"" : "";
        var poster = video.Poster is { } p ? $" poster=\"{HtmlEncoder.Default.Encode(p)}\"" : "";
        var captions = video.Captions is { } c ? $"<track kind=\"captions\" src=\"{HtmlEncoder.Default.Encode(c)}\" default />" : "";
        var manifest = HtmlEncoder.Default.Encode(video.Src);

        return new HtmlString(
            $"<video controls playsinline preload=\"metadata\" data-hls=\"{manifest}\"{poster}{label}{classAttribute}>{captions}</video>" +
            "<script type=\"module\">" +
            "const v=document.currentScript.previousElementSibling;const s=v.dataset.hls;" +
            "if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=s}" +
            "else{const{default:Hls}=await import('https://cdn.jsdelivr.net/npm/hls.js@1/+esm');" +
            "if(Hls.isSupported()){const h=new Hls();h.loadSource(s);h.attachMedia(v)}}" +
            "</script>");
    }

    /// <summary>A download call to action: the name, then extension and size when known.</summary>
    private static HtmlString Document(Media.Document document)
    {
        var details = HtmlEncoder.Default.Encode(
            string.Join(" · ", new[] { document.Extension, MediaReader.FormatFileSize(document.SizeBytes) }.Where(part => !string.IsNullOrEmpty(part))));
        var detailsHtml = details.Length > 0 ? $"<span class=\"block text-sm text-ink-muted\">{details}</span>" : "";

        return new HtmlString(
            $"<a href=\"{HtmlEncoder.Default.Encode(document.Url)}\" download class=\"flex items-center justify-between gap-4 rounded-lg border border-line p-4 hover:text-accent\">" +
            $"<span><span class=\"block font-medium\">{HtmlEncoder.Default.Encode(document.Name)}</span>{detailsHtml}</span>" +
            "<span class=\"text-sm font-medium\">Download</span></a>");
    }
}
