using Markdig;
using Markdig.Extensions.EmphasisExtras;
using Microsoft.AspNetCore.Html;

namespace NorthwindCoffee.Mvc.Rendering;

/// <summary>
/// Markdown, restricted to exactly the dialect Content validates against.
///
/// <para>
/// <strong>CommonMark plus GFM pipe tables and strikethrough, and nothing else</strong>, with raw HTML
/// disabled at the parser rather than sanitized afterwards. This is the pipeline
/// <c>docs/content-sdk-dotnet.md</c> documents, verbatim.
/// </para>
///
/// <para>
/// <c>UseAdvancedExtensions()</c> is the tempting one-liner and is wrong: it would render autolinks,
/// task lists and footnotes that an author was never warned about and that the CMS never parsed as
/// those features — so the same source would mean one thing where it was written and another here.
/// </para>
/// </summary>
public static class MarkdownRenderer
{
    // A MarkdownPipeline is immutable and safe to share, so it is built once for the process.
    private static readonly MarkdownPipeline Pipeline = new MarkdownPipelineBuilder()
        .UsePipeTables()
        .UseEmphasisExtras(EmphasisExtraOptions.Strikethrough)
        .DisableHtml()
        .Build();

    public static IHtmlContent ToHtml(string? markdown) =>
        string.IsNullOrWhiteSpace(markdown)
            ? HtmlString.Empty
            : new HtmlString(Markdown.ToHtml(markdown, Pipeline));

    /// <summary>
    /// The same source as plain text, for a meta description. Rendered through the same pipeline, so
    /// a construct this dialect does not recognise stays literal here too.
    /// </summary>
    public static string ToPlainText(string? markdown) =>
        string.IsNullOrWhiteSpace(markdown) ? "" : Markdown.ToPlainText(markdown, Pipeline).Trim();
}
