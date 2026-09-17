using NorthwindCoffee.Mvc.Rendering;

namespace NorthwindCoffee.Mvc.Tests;

/// <summary>
/// The markdown pipeline must be exactly the dialect Content validates against: CommonMark, plus GFM
/// pipe tables and strikethrough, and nothing else.
///
/// <para>
/// Half of these tests assert what does <em>not</em> render. That half is the point: the tempting
/// one-liner, <c>UseAdvancedExtensions()</c>, renders all of them — so a test suite that only checked
/// tables and strikethrough would pass against a pipeline that quietly does more than the CMS ever
/// parsed, and the same source would mean one thing where it was written and another here.
/// </para>
/// </summary>
public class MarkdownRendererTests
{
    private static string Render(string markdown) => MarkdownRenderer.ToHtml(markdown).ToString()!;

    [Fact]
    public void Renders_commonmark()
    {
        Assert.Contains("<em>tasting</em>", Render("A *tasting* note."));
        Assert.Contains("<h2>Origins</h2>", Render("## Origins"));
        Assert.Contains("<a href=\"/coffees\">", Render("[Coffees](/coffees)"));
    }

    [Fact]
    public void Renders_gfm_pipe_tables()
    {
        var html = Render("""
            | Roast | Notes |
            |---|---|
            | Light | Floral |
            """);

        Assert.Contains("<table>", html);
        Assert.Contains("<th>Roast</th>", html);
        Assert.Contains("<td>Floral</td>", html);
    }

    [Fact]
    public void Renders_gfm_strikethrough()
    {
        Assert.Contains("<del>sold out</del>", Render("~~sold out~~"));
    }

    [Fact]
    public void Does_not_render_an_autolink_literal()
    {
        // GFM autolinks are not in the dialect. A bare address stays text, exactly as the CMS parsed it.
        var html = Render("Visit www.example.com for more.");

        Assert.DoesNotContain("<a ", html);
        Assert.Contains("www.example.com", html);
    }

    [Fact]
    public void Does_not_render_a_task_list()
    {
        var html = Render("- [ ] grind\n- [x] brew");

        Assert.DoesNotContain("type=\"checkbox\"", html);
        Assert.Contains("[ ] grind", html);
    }

    [Fact]
    public void Does_not_render_a_footnote()
    {
        var html = Render("Coffee[^1]\n\n[^1]: A drink.");

        Assert.DoesNotContain("footnote", html, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("[^1]", html);
    }

    [Fact]
    public void Never_emits_raw_html()
    {
        // Disabled at the parser rather than sanitized afterwards, which is what the CMS does when it
        // validates the same source.
        var html = Render("<script>alert(1)</script> and <b>bold</b>");

        Assert.DoesNotContain("<script>", html);
        Assert.DoesNotContain("<b>", html);
        Assert.Contains("&lt;script&gt;", html);
    }

    [Fact]
    public void Empty_source_renders_nothing()
    {
        Assert.Equal("", Render(""));
        Assert.Equal("", MarkdownRenderer.ToHtml(null).ToString());
    }

    [Fact]
    public void Plain_text_strips_markup()
    {
        var text = MarkdownRenderer.ToPlainText("## Origins\n\nA *washed* Kenyan.");

        Assert.DoesNotContain("*", text);
        Assert.DoesNotContain("#", text);
        Assert.Contains("washed", text);
    }
}
