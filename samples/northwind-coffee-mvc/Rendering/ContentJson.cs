using System.Text.Json;
using Ebitex.Content.Delivery;

namespace NorthwindCoffee.Mvc.Rendering;

/// <summary>
/// Readers for a component's own fields.
///
/// <para>
/// Every Contract's shape belongs to whoever authored it, so the package delivers those fields as raw
/// <see cref="JsonElement"/> and this sample reads them by name. These helpers exist so that a missing
/// or null field is an ordinary absence at every one of the thirteen partials rather than an exception
/// at one of them — content is authored, and a partial must not fall over because an optional field
/// was left empty.
/// </para>
/// </summary>
public static class ContentJson
{
    /// <summary>The component's own delivered fields, or <see langword="null"/> when this binding was
    /// never resolved.</summary>
    public static JsonElement? Content(this PresentationEnvelope? envelope) =>
        envelope?.Component is { } component && component.IsResolved ? component.Content : null;

    public static JsonElement? Field(this JsonElement? content, string name) =>
        content is { ValueKind: JsonValueKind.Object } element
            && element.TryGetProperty(name, out var value)
            && value.ValueKind is not (JsonValueKind.Null or JsonValueKind.Undefined)
                ? value
                : null;

    public static string? Text(this JsonElement? content, string name) =>
        content.Field(name) is { ValueKind: JsonValueKind.String } value && value.GetString() is { Length: > 0 } text
            ? text
            : null;

    public static double? Number(this JsonElement? content, string name) =>
        content.Field(name) is { ValueKind: JsonValueKind.Number } value ? value.GetDouble() : null;

    public static IReadOnlyList<string> Texts(this JsonElement? content, string name) =>
        content.Field(name) is { ValueKind: JsonValueKind.Array } array
            ? [.. array.EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.String)
                .Select(item => item.GetString()!)
                .Where(text => text.Length > 0)]
            : [];

    public static PresentationEnvelope? Presentation(this JsonElement? content, string name) =>
        content.Field(name) is { ValueKind: JsonValueKind.Object } value ? value.AsPresentation() : null;

    /// <summary>
    /// An enumerable Presentation field. An <c>isEnumerable</c> field is an array and a single one is
    /// an object; both are read the same way here, so a Contract that gains or loses that modifier does
    /// not break the partial that renders it.
    /// </summary>
    public static IReadOnlyList<PresentationEnvelope> Presentations(this JsonElement? content, string name) =>
        content.Field(name) switch
        {
            { ValueKind: JsonValueKind.Array } array =>
                [.. array.EnumerateArray().Where(item => item.ValueKind == JsonValueKind.Object).Select(item => item.AsPresentation())],
            { ValueKind: JsonValueKind.Object } single => [single.AsPresentation()],
            _ => [],
        };

    public static ComponentValue? Component(this JsonElement? content, string name) =>
        content.Field(name) is { ValueKind: JsonValueKind.Object } value ? value.AsComponent() : null;

    public static IReadOnlyList<ComponentValue> Components(this JsonElement? content, string name) =>
        content.Field(name) switch
        {
            { ValueKind: JsonValueKind.Array } array =>
                [.. array.EnumerateArray().Where(item => item.ValueKind == JsonValueKind.Object).Select(item => item.AsComponent())],
            { ValueKind: JsonValueKind.Object } single => [single.AsComponent()],
            _ => [],
        };

    public static LinkValue? Link(this JsonElement? content, string name) =>
        content.Field(name) is { ValueKind: JsonValueKind.Object } value ? value.AsLink() : null;

    public static BlobValue? Blob(this JsonElement? content, string name) =>
        content.Field(name) is { ValueKind: JsonValueKind.Object } value ? value.AsBlob() : null;

    public static CategoryDescriptor? Category(this JsonElement? content, string name) =>
        content.Field(name) is { ValueKind: JsonValueKind.Object } value ? value.AsCategory() : null;

    public static IReadOnlyList<RichTextFragment> RichText(this JsonElement? content, string name) =>
        content.Field(name) is { ValueKind: JsonValueKind.Array } value ? value.AsRichText() : [];

    /// <summary>
    /// The first address a referenced component carries, for the site being rendered. A reference with
    /// no published address gets <see langword="null"/>, and the caller renders text rather than a link
    /// — a card must link somewhere or not pretend to.
    /// </summary>
    public static string? PathFor(this ComponentValue? component) =>
        component?.Paths is { Count: > 0 } paths ? paths[0].Path : null;
}
