using System.Text.Json;
using Ebitex.Content.Delivery;
using NorthwindCoffee.Mvc.Rendering;

namespace NorthwindCoffee.Mvc.Tests;

/// <summary>
/// What a page says about itself.
///
/// <para>
/// The test that matters most here is <see cref="The_contract_decides_not_the_template"/>: metadata
/// switches on the Contract's external id while renderer dispatch switches on the Template's, and
/// nothing on a rendered page would reveal the two being confused — the site would look right and
/// describe itself wrongly.
/// </para>
/// </summary>
public class PageMetadataTests
{
    private static PathResult.Presentation Page(string contractExternalId, string templateExternalId, string contentJson, string? title = "A page") =>
        new()
        {
            NodeId = Guid.NewGuid(),
            Path = "/a-page",
            Title = title,
            Envelope = new PresentationEnvelope
            {
                Template = new TemplateDescriptor { ExternalId = templateExternalId },
                Component = new ComponentValue
                {
                    Provider = "core",
                    Key = Guid.NewGuid().ToString(),
                    Contract = new ContractDescriptor { ExternalId = contractExternalId },
                    Content = JsonDocument.Parse(contentJson).RootElement,
                },
            },
        };

    [Fact]
    public void A_coffee_is_a_product_with_an_offer()
    {
        var metadata = PageMetadata.For(
            Page("coffee", "coffee", """{ "name": "Ethiopia Guji", "price": 12.5, "weight-grams": 250 }"""),
            "https://northwind.example/coffees/ethiopia-guji");

        Assert.NotNull(metadata.JsonLd);
        Assert.Contains("\"@type\":\"Product\"", metadata.JsonLd);
        Assert.Contains("\"priceCurrency\":\"GBP\"", metadata.JsonLd);
        Assert.Contains("\"price\":12.5", metadata.JsonLd);
        Assert.Contains("\"unitCode\":\"GRM\"", metadata.JsonLd);
    }

    [Fact]
    public void A_guide_is_a_howto_with_an_iso_duration()
    {
        var metadata = PageMetadata.For(
            Page("guide", "guide", """{ "summary": "Twenty-five minutes.", "total-time": 25, "equipment": ["Grinder"] }"""),
            "https://northwind.example/guides/aeropress");

        Assert.Contains("\"@type\":\"HowTo\"", metadata.JsonLd);
        Assert.Contains("\"totalTime\":\"PT25M\"", metadata.JsonLd);
        Assert.Contains("HowToSupply", metadata.JsonLd);
        Assert.Equal("Twenty-five minutes.", metadata.Description);
    }

    [Fact]
    public void An_ordinary_page_is_a_webpage()
    {
        var metadata = PageMetadata.For(
            Page("page", "page", """{ "title": "About", "description": "Who we are." }"""),
            "https://northwind.example/about");

        Assert.Contains("\"@type\":\"WebPage\"", metadata.JsonLd);
        Assert.Equal("Who we are.", metadata.Description);
    }

    [Fact]
    public void The_contract_decides_not_the_template()
    {
        // Same Contract, a different Template: a coffee presented as a hero is still a Product. If this
        // ever switched on the Template, every coffee shown through another Template would silently
        // describe itself as an ordinary page.
        var metadata = PageMetadata.For(
            Page("coffee", "hero", """{ "name": "Ethiopia Guji", "price": 12.5 }"""),
            "https://northwind.example/coffees/ethiopia-guji");

        Assert.Contains("\"@type\":\"Product\"", metadata.JsonLd);
    }

    [Fact]
    public void An_unresolved_binding_says_nothing_rather_than_guessing()
    {
        var page = new PathResult.Presentation
        {
            Path = "/a-page",
            Title = "A page",
            Envelope = new PresentationEnvelope
            {
                Template = new TemplateDescriptor { ExternalId = "page" },
                Component = new ComponentValue { Provider = "core", Key = "k", Unresolvable = true },
            },
        };

        var metadata = PageMetadata.For(page, "https://northwind.example/a-page");

        Assert.Null(metadata.JsonLd);
        Assert.Null(metadata.Description);
        Assert.Null(metadata.ImageUrl);
    }

    [Fact]
    public void Absent_fields_are_omitted_rather_than_emitted_as_null()
    {
        // A JSON-LD object full of nulls is worse than a small one: a consumer cannot tell "unknown"
        // from "deliberately empty".
        var metadata = PageMetadata.For(
            Page("coffee", "coffee", """{ "name": "Ethiopia Guji" }"""),
            "https://northwind.example/coffees/ethiopia-guji");

        Assert.DoesNotContain("null", metadata.JsonLd);
        Assert.DoesNotContain("offers", metadata.JsonLd);
    }
}
