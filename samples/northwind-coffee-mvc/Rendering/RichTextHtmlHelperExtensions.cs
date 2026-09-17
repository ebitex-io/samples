using System.Text.Json;
using Ebitex.Content.Delivery;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace NorthwindCoffee.Mvc.Rendering;

/// <summary>
/// Renders a delivered RichText value: an ordered array of fragments, dispatched by kind.
///
/// <para>
/// An embed inside the prose arrives here as its own <c>presentation</c> fragment, already split out
/// of the surrounding markdown by the server — so this renderer never parses a token, and an embedded
/// figure goes through the same partial dispatch every other Presentation does.
/// </para>
/// </summary>
public static class RichTextHtmlHelperExtensions
{
    public static Task<IHtmlContent> RichTextAsync(this IHtmlHelper helper, JsonElement? value) =>
        helper.RichTextAsync(value is { ValueKind: JsonValueKind.Array } array ? array.AsRichText() : []);

    public static async Task<IHtmlContent> RichTextAsync(this IHtmlHelper helper, IReadOnlyList<RichTextFragment> fragments)
    {
        ArgumentNullException.ThrowIfNull(helper);

        var builder = new HtmlContentBuilder();

        foreach (var fragment in fragments)
        {
            switch (fragment)
            {
                case RichTextFragment.Markdown markdown:
                    builder.AppendHtml(MarkdownRenderer.ToHtml(markdown.Text));
                    break;

                case RichTextFragment.Presentation embed:
                    builder.AppendHtml(await helper.PresentationAsync(embed.Envelope));
                    break;

                case RichTextFragment.Reference reference:
                    // A deprecated embed kind that is still delivered. It hands a renderer a bare
                    // binding with no Template saying how to show it — which is the reason it was
                    // deprecated — so the honest answer is a link when it has an address, and nothing
                    // when it does not.
                    if (reference.Value.PathFor() is { Length: > 0 } path)
                    {
                        var label = reference.Value.Title ?? path;
                        builder.AppendHtml($"""<p><a class="text-accent underline" href="{path}">""")
                               .Append(label)
                               .AppendHtml("</a></p>");
                    }
                    break;

                default:
                    // Personalized cannot occur: this client always sends a context bag, so the server
                    // has already chosen. Unknown is a fragment kind newer than this build. Neither is
                    // worth breaking a page over.
                    break;
            }
        }

        return builder;
    }

    /// <summary>
    /// The first markdown fragment as plain text, for a meta description. Never a rendered fragment
    /// and never HTML — a description is text, and the first paragraph is the part worth quoting.
    /// </summary>
    public static string? PlainTextFrom(IReadOnlyList<RichTextFragment> fragments, int maxLength = 160)
    {
        var first = fragments.OfType<RichTextFragment.Markdown>().FirstOrDefault();
        if (first is null)
        {
            return null;
        }

        var text = MarkdownRenderer.ToPlainText(first.Text).ReplaceLineEndings(" ").Trim();
        while (text.Contains("  ", StringComparison.Ordinal))
        {
            text = text.Replace("  ", " ", StringComparison.Ordinal);
        }

        if (text.Length <= maxLength)
        {
            return text.Length == 0 ? null : text;
        }

        // Truncate on a word, so a description never ends mid-syllable.
        var cut = text.LastIndexOf(' ', Math.Min(maxLength, text.Length - 1));
        return (cut > 0 ? text[..cut] : text[..maxLength]).TrimEnd('.', ',', ';', ':', ' ') + "…";
    }
}
