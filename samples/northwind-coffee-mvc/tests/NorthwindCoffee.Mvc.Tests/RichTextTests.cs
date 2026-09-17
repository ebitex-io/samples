using Ebitex.Content.Delivery;
using NorthwindCoffee.Mvc.Rendering;

namespace NorthwindCoffee.Mvc.Tests;

/// <summary>
/// The plain-text reader behind every meta description. Rendering the fragments themselves needs a
/// view context, so that is covered by driving real pages; this is the pure half.
/// </summary>
public class RichTextTests
{
    [Fact]
    public void Takes_the_first_markdown_fragment()
    {
        var fragments = new List<RichTextFragment>
        {
            new RichTextFragment.Markdown("A *washed* Kenyan, grown at altitude."),
            new RichTextFragment.Markdown("A second paragraph nobody asked for."),
        };

        var text = RichTextHtmlHelperExtensions.PlainTextFrom(fragments);

        Assert.Equal("A washed Kenyan, grown at altitude.", text);
    }

    [Fact]
    public void Skips_a_leading_embed_to_find_the_prose()
    {
        // A page that opens with an image still has a description: the first *markdown* fragment is
        // what is wanted, not the first fragment.
        var fragments = new List<RichTextFragment>
        {
            new RichTextFragment.Presentation(new PresentationEnvelope { Template = new TemplateDescriptor { ExternalId = "figure" } }),
            new RichTextFragment.Markdown("Roasted on the north coast."),
        };

        Assert.Equal("Roasted on the north coast.", RichTextHtmlHelperExtensions.PlainTextFrom(fragments));
    }

    [Fact]
    public void Truncates_on_a_word_boundary()
    {
        var fragments = new List<RichTextFragment> { new RichTextFragment.Markdown(new string('a', 40) + " " + new string('b', 40)) };

        var text = RichTextHtmlHelperExtensions.PlainTextFrom(fragments, maxLength: 50);

        Assert.NotNull(text);
        Assert.EndsWith("…", text);
        Assert.DoesNotContain("b", text);
    }

    [Fact]
    public void No_markdown_anywhere_is_no_description()
    {
        var fragments = new List<RichTextFragment>
        {
            new RichTextFragment.Presentation(new PresentationEnvelope()),
        };

        Assert.Null(RichTextHtmlHelperExtensions.PlainTextFrom(fragments));
    }

    [Fact]
    public void An_empty_value_is_no_description()
    {
        Assert.Null(RichTextHtmlHelperExtensions.PlainTextFrom([]));
        Assert.Null(RichTextHtmlHelperExtensions.PlainTextFrom([new RichTextFragment.Markdown("   ")]));
    }
}
