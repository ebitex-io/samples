using System.Text.Json;
using Ebitex.Content.Delivery;
using NorthwindCoffee.Mvc.Rendering;

namespace NorthwindCoffee.Mvc.Tests;

/// <summary>
/// An image field can hold the sample's own Blob image or an asset from the Ebitex Assets library;
/// ebitex-io/monorepo#1059. Both shapes, and the cases that must not render.
/// </summary>
public class MediaTests
{
    private static ComponentValue Component(string externalId, string contentJson) =>
        JsonDocument.Parse($$"""{"provider":"core","key":"00000000-0000-0000-0000-000000000001","contract":{"id":"00000000-0000-0000-0000-000000000002","externalId":"{{externalId}}","version":1},"content":{{contentJson}}}""")
            .RootElement.AsComponent();

    private static string Html(ComponentValue value) =>
        ImageHtmlHelperExtensions.Render(value).ToString() ?? "";

    [Fact]
    public void Reads_the_sample_image_contract()
    {
        var image = Assert.IsType<Media.Image>(MediaReader.Read(Component("image", """{"file":{"url":"/b.jpg"},"alt":"A bag"}""")));

        Assert.Equal("A bag", image.Alt);
        Assert.Null(image.Width);
    }

    [Fact]
    public void Reads_a_blob_image_with_alt_text_and_top_level_dimensions()
    {
        var image = Assert.IsType<Media.Image>(MediaReader.Read(Component("site-image", """{"file":{"url":"/b.jpg"},"alt-text":"Blob alt","width":640,"height":360}""")));

        Assert.Equal(("Blob alt", 640, 360), (image.Alt, image.Width, image.Height));
    }

    [Fact]
    public void Reads_an_assets_image_with_dimensions_from_file()
    {
        var html = Html(Component("ebitex-image", """{"kind":"image","alt":"Asset alt","file":{"url":"https://a/x.jpg","width":1600,"height":900}}"""));

        Assert.Contains("alt=\"Asset alt\"", html);
        Assert.Contains("width=\"1600\" height=\"900\"", html);
    }

    [Fact]
    public void Writes_no_width_or_height_for_an_assets_image_without_dimensions()
    {
        // The boundary: top-level dimensions are not an asset's, and a missing size is absent, not 0.
        var html = Html(Component("ebitex-image", """{"alt":"No size","width":999,"height":999,"file":{"url":"https://a/x.jpg","width":0}}"""));

        Assert.DoesNotContain("width=", html);
        Assert.DoesNotContain("height=", html);
    }

    [Fact]
    public void Renders_a_video_as_an_html5_player_with_its_poster()
    {
        var html = Html(Component("ebitex-video", """{"name":"Tour","file":{"url":"https://s/x/manifest/video.m3u8","posterUrl":"https://s/p.jpg"}}"""));

        Assert.Contains("<video controls", html);
        Assert.Contains("data-hls=\"https://s/x/manifest/video.m3u8\"", html);
        Assert.Contains("poster=\"https://s/p.jpg\"", html);
        Assert.DoesNotContain("<img", html);
    }

    [Fact]
    public void Renders_a_document_as_a_download_with_extension_and_size()
    {
        var html = Html(Component("ebitex-document", """{"name":"Guide","file":{"url":"https://s/guide.pdf","contentType":"application/pdf","sizeBytes":482113}}"""));

        Assert.Contains("href=\"https://s/guide.pdf\"", html);
        Assert.Contains("download", html);
        Assert.Contains("PDF", html);
        Assert.Contains("471 KB", html);
    }

    [Fact]
    public void Renders_nothing_without_a_file_url()
    {
        Assert.Equal("", Html(Component("ebitex-video", """{"name":"x","file":{}}""")));
        Assert.Equal("", Html(Component("image", """{"alt":"x"}""")));
    }

    [Theory]
    [InlineData("https://s/brochure.pdf?sig=1", null, "PDF")]
    [InlineData("https://s/abc", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "XLSX")]
    [InlineData("https://s/abc", "application/octet-stream", null)]
    public void Finds_a_documents_extension(string url, string? contentType, string? expected) =>
        Assert.Equal(expected, MediaReader.Extension(url, contentType));

    [Theory]
    [InlineData(512L, "512 B")]
    [InlineData(1536L, "1.5 KB")]
    [InlineData(482113L, "471 KB")]
    [InlineData(0L, "")]
    public void Formats_a_file_size(long bytes, string expected) =>
        Assert.Equal(expected, MediaReader.FormatFileSize(bytes));
}
