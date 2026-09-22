using System.Text.Json;
using System.Text.Json.Nodes;
using Ebitex.Content.Delivery;

namespace NorthwindCoffee.Mvc.Preview;

/// <summary>
/// The boundary registry this page emits for <c>preview.js</c>, built while the page renders.
///
/// <para>
/// A React site registers each boundary as it mounts, holding the live annotation in memory. This
/// site has no runtime to hold anything, so it writes the same facts into the page: one
/// <c>data-ebitex-source</c> attribute per Presentation, and one JSON document at the end of the body
/// mapping each of those ids to the annotation the API returned for it. The script reads the
/// document, binds it to the elements, and draws exactly the pins Composer's own overlay would.
/// </para>
///
/// <para>
/// Nothing here runs on an ordinary visit: <see cref="IsPreviewing"/> is false without an annotation,
/// every method returns nothing, and the rendered HTML is byte-identical to a build with no preview
/// support at all.
/// </para>
/// </summary>
public sealed class PreviewAnnotations
{
    private readonly JsonObject _registry = [];
    private int _next;

    /// <summary>True once the page read came back annotated — that is, only inside Composer's frame.</summary>
    public bool IsPreviewing { get; private set; }

    /// <summary>Marks this request as a preview. Called by the controller when the draft read is annotated.</summary>
    public void Activate() => IsPreviewing = true;

    /// <summary>
    /// Registers one Presentation and returns the id to put in its <c>data-ebitex-source</c>, or
    /// <see langword="null"/> when this is not a preview — the caller then emits no wrapper at all.
    /// </summary>
    public string? Register(PresentationEnvelope envelope)
    {
        if (!IsPreviewing || envelope.Preview is not { } preview)
        {
            return null;
        }

        var id = $"b{++_next}";
        var entry = new JsonObject
        {
            // Handed over exactly as the API sent it: the registry's `source` IS the `preview` object,
            // which is what keeps this renderer out of the business of understanding the annotation.
            ["source"] = JsonNode.Parse(preview.GetRawText()),
        };

        // The naming facts the pin tags use — what React reads off the envelope it is rendering.
        if (envelope.Template is { } template)
        {
            var descriptor = new JsonObject { ["id"] = template.Id.ToString() };
            if (template.ExternalId is { Length: > 0 } externalId)
            {
                descriptor["externalId"] = externalId;
            }

            var envelopeFacts = new JsonObject { ["template"] = descriptor };
            if (envelope.Component?.Contract?.ExternalId is { Length: > 0 } contractExternalId)
            {
                envelopeFacts["component"] = new JsonObject
                {
                    ["contract"] = new JsonObject { ["externalId"] = contractExternalId },
                };
            }

            entry["envelope"] = envelopeFacts;
        }

        _registry[id] = entry;
        return id;
    }

    /// <summary>
    /// The registry document's JSON, with <c>&lt;</c> escaped so it cannot close its own script
    /// element early. Empty when this is not a preview.
    /// </summary>
    public string ToJson() =>
        IsPreviewing
            ? _registry.ToJsonString(new JsonSerializerOptions { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping })
                .Replace("<", "\\u003c", StringComparison.Ordinal)
            : "{}";
}
