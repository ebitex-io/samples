using System.Text.Json;
using Ebitex.Content.Delivery;

namespace NorthwindCoffee.Mvc.Rendering;

/// <summary>What a view needs to show one delivered media value.</summary>
public abstract record Media
{
    public sealed record Image(string Url, string Alt, int? Width, int? Height) : Media;

    /// <param name="Src">An HLS manifest (<c>.m3u8</c>), not a file.</param>
    public sealed record Video(string Src, string Name, string? Poster, string? Captions) : Media;

    public sealed record Document(string Url, string Name, string? Extension, long? SizeBytes) : Media;
}

/// <summary>
/// Reads an image, a video or a document from a bound component, whichever shape it arrives in
/// (ebitex-io/monorepo#1059): the sample's own <c>image</c> Contract (a Blob <c>file</c> and
/// <c>alt</c>, no dimensions; a Blob Image elsewhere may carry <c>alt-text</c> and top-level
/// <c>width</c>/<c>height</c>), or an asset from the Ebitex Assets library, told apart by
/// <c>contract.externalId</c> and carrying its own dimensions inside <c>file</c>. Anything that is
/// not a video or a document is read as an image, so a page that only held the sample's own image is
/// unchanged.
/// </summary>
public static class MediaReader
{
    private static readonly Dictionary<string, string> ExtensionByType = new(StringComparer.OrdinalIgnoreCase)
    {
        ["application/pdf"] = "PDF",
        ["application/msword"] = "DOC",
        ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"] = "DOCX",
        ["application/vnd.ms-excel"] = "XLS",
        ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] = "XLSX",
        ["application/vnd.ms-powerpoint"] = "PPT",
        ["application/vnd.openxmlformats-officedocument.presentationml.presentation"] = "PPTX",
        ["application/zip"] = "ZIP",
        ["text/plain"] = "TXT",
        ["text/csv"] = "CSV",
    };

    public static Media? Read(ComponentValue? value)
    {
        if (value is not { } component || !component.IsResolved)
        {
            return null;
        }

        JsonElement? content = component.Content;
        var file = content.Field("file");
        if (file.Text("url") is not { } url)
        {
            return null;
        }

        switch (component.Contract?.ExternalId)
        {
            case "ebitex-video":
                return new Media.Video(url, content.Text("name") ?? "", file.Text("posterUrl"), file.Text("captionsUrl"));

            case "ebitex-document":
                return new Media.Document(
                    url,
                    content.Text("name") ?? "Download",
                    Extension(url, file.Text("contentType")),
                    Positive(file.Number("sizeBytes")) is { } size ? (long)size : null);

            case "ebitex-image":
                // An asset keeps its pixel size inside `file`; nothing is read from the top level.
                return new Media.Image(url, content.Text("alt") ?? "", Whole(file.Number("width")), Whole(file.Number("height")));

            default:
                return new Media.Image(
                    url,
                    content.Text("alt") ?? content.Text("alt-text") ?? "",
                    Whole(content.Number("width")),
                    Whole(content.Number("height")));
        }
    }

    /// <summary>The extension a visitor would recognise: the URL path's own, else one known for the content type.</summary>
    public static string? Extension(string url, string? contentType)
    {
        var path = url.Split('?', '#')[0];
        var dot = path.LastIndexOf('.');
        if (dot >= 0 && path.Length - dot - 1 is >= 1 and <= 5 && path[(dot + 1)..].All(char.IsAsciiLetterOrDigit))
        {
            return path[(dot + 1)..].ToUpperInvariant();
        }

        return contentType is not null && ExtensionByType.TryGetValue(contentType.Split(';')[0].Trim(), out var known) ? known : null;
    }

    /// <summary><c>482113</c> becomes <c>471 KB</c>; empty for a missing or non-positive size.</summary>
    public static string FormatFileSize(long? bytes)
    {
        if (bytes is not > 0)
        {
            return "";
        }

        string[] units = ["B", "KB", "MB", "GB"];
        double value = bytes.Value;
        var unit = 0;
        while (value >= 1024 && unit < units.Length - 1)
        {
            value /= 1024;
            unit++;
        }

        var text = unit == 0 || value >= 10 ? Math.Round(value).ToString("0") : value.ToString("0.#");
        return $"{text} {units[unit]}";
    }

    private static double? Positive(double? value) => value is > 0 ? value : null;

    private static int? Whole(double? value) => Positive(value) is { } positive ? (int)positive : null;
}
