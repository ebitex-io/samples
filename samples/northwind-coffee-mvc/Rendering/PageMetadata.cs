using System.Text.Json;
using Ebitex.Content.Delivery;
using NorthwindCoffee.Mvc.Content;

namespace NorthwindCoffee.Mvc.Rendering;

/// <summary>
/// What a page says about itself: its description, its sharing image, and its JSON-LD.
/// </summary>
/// <param name="Description">For <c>&lt;meta name="description"&gt;</c>.</param>
/// <param name="ImageUrl">An absolute image URL, or <see langword="null"/>.</param>
/// <param name="JsonLd">A serialized JSON-LD object, or <see langword="null"/> when this page type has nothing structured to say.</param>
public sealed record PageMetadata(string? Description, string? ImageUrl, string? JsonLd)
{
    public static readonly PageMetadata None = new(null, null, null);

    private const string SiteName = "Northwind Coffee";

    /// <summary>
    /// Builds the metadata for a resolved page.
    ///
    /// <para>
    /// <strong>This switches on the <em>Contract</em>'s external id, while the renderer dispatch
    /// switches on the <em>Template</em>'s.</strong> That is not an inconsistency — it is the
    /// distinction the two halves of the type system exist to make. What a thing *is* decides what can
    /// truthfully be said about it (a coffee is a Product, wherever it appears); how it is *presented*
    /// decides which partial draws it. Merging the two produces a site that renders correctly and
    /// describes itself wrongly, which nothing on the page would reveal.
    /// </para>
    /// </summary>
    public static PageMetadata For(PathResult.Presentation page, string canonicalUrl)
    {
        var envelope = page.Envelope;
        var content = envelope.Content();

        if (content is null)
        {
            return None;
        }

        var contract = envelope?.Component?.Contract?.ExternalId;
        var image = ImageUrlFrom(content.Component("image"));

        return contract switch
        {
            "coffee" => Build(
                DescriptionFrom(content, "description"),
                image,
                Product(content, page.Title, canonicalUrl, image)),

            "guide" => Build(
                content.Text("summary"),
                image,
                HowTo(content, page.Title, canonicalUrl, image)),

            "origin" => Build(
                DescriptionFrom(content, "summary"),
                image,
                Place(content, page.Title, canonicalUrl, image)),

            "coffee-index" or "guide-index" or "store-list" => Build(
                DescriptionFrom(content, "intro"),
                image,
                Simple("CollectionPage", page.Title, canonicalUrl)),

            // Every other Contract is an ordinary page. A WebPage says little, but it says it truthfully,
            // and inventing a richer type for content that has not declared one would be a guess.
            _ => Build(
                content.Text("description") ?? DescriptionFrom(content, "body"),
                image,
                Simple("WebPage", page.Title, canonicalUrl)),
        };
    }

    private static PageMetadata Build(string? description, string? image, Dictionary<string, object?> jsonLd) =>
        new(description, image, Serialize(jsonLd));

    private static Dictionary<string, object?> Simple(string type, string? name, string url) => new()
    {
        ["@context"] = "https://schema.org",
        ["@type"] = type,
        ["name"] = name,
        ["url"] = url,
    };

    private static Dictionary<string, object?> Product(JsonElement? content, string? name, string url, string? image)
    {
        var product = Simple("Product", name, url);
        product["image"] = image;
        product["brand"] = new Dictionary<string, object?> { ["@type"] = "Brand", ["name"] = SiteName };
        product["description"] = DescriptionFrom(content, "description");

        if (content.Number("price") is { } price)
        {
            product["offers"] = new Dictionary<string, object?>
            {
                ["@type"] = "Offer",
                ["price"] = price,
                ["priceCurrency"] = Format.PriceCurrency,
                ["url"] = url,
            };
        }

        if (content.Number("weight-grams") is { } grams)
        {
            product["weight"] = new Dictionary<string, object?>
            {
                ["@type"] = "QuantitativeValue",
                ["value"] = grams,
                ["unitCode"] = "GRM",
            };
        }

        return Prune(product);
    }

    private static Dictionary<string, object?> HowTo(JsonElement? content, string? name, string url, string? image)
    {
        var howTo = Simple("HowTo", name, url);
        howTo["image"] = image;
        howTo["description"] = content.Text("summary");

        if (content.Number("total-time") is { } minutes)
        {
            howTo["totalTime"] = Format.IsoDuration(minutes);
        }

        if (content.Texts("equipment") is { Count: > 0 } equipment)
        {
            howTo["supply"] = equipment
                .Select(item => new Dictionary<string, object?> { ["@type"] = "HowToSupply", ["name"] = item })
                .ToArray();
        }

        var steps = content.Components("steps");
        if (steps.Count > 0)
        {
            howTo["step"] = steps
                .Select((step, index) =>
                {
                    var fields = step.IsResolved ? step.Content : null;
                    return new Dictionary<string, object?>
                    {
                        ["@type"] = "HowToStep",
                        ["position"] = index + 1,
                        ["name"] = fields.Text("heading"),
                        ["text"] = DescriptionFrom(fields, "body"),
                    };
                })
                .Select(Prune)
                .ToArray();
        }

        return Prune(howTo);
    }

    private static Dictionary<string, object?> Place(JsonElement? content, string? name, string url, string? image)
    {
        var place = Simple("Place", name ?? content.Text("name"), url);
        place["image"] = image;
        place["description"] = DescriptionFrom(content, "summary");

        if (content.Text("country") is { Length: > 0 } country)
        {
            place["address"] = new Dictionary<string, object?>
            {
                ["@type"] = "PostalAddress",
                ["addressCountry"] = country,
            };
        }

        return Prune(place);
    }

    /// <summary>A plain-text description from either a RichText field or a plain one.</summary>
    private static string? DescriptionFrom(JsonElement? content, string name) =>
        content.RichText(name) is { Count: > 0 } fragments
            ? RichTextHtmlHelperExtensions.PlainTextFrom(fragments)
            : content.Text(name);

    private static string? ImageUrlFrom(ComponentValue? image) =>
        image is { IsResolved: true } ? image.Content.Blob("file")?.Url : null;

    private static Dictionary<string, object?> Prune(Dictionary<string, object?> values)
    {
        foreach (var key in values.Where(pair => pair.Value is null).Select(pair => pair.Key).ToArray())
        {
            values.Remove(key);
        }

        return values;
    }

    // System.Text.Json's default encoder escapes '<', '>' and '&', so this can never close the script
    // element it is embedded in.
    private static string Serialize(Dictionary<string, object?> jsonLd) =>
        JsonSerializer.Serialize(Prune(jsonLd));
}
