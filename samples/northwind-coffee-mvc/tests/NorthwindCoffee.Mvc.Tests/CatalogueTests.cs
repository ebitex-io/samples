using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using NorthwindCoffee.Mvc.Content;

namespace NorthwindCoffee.Mvc.Tests;

/// <summary>
/// The catalogue's filter state lives entirely in the query string, which is what lets it work with
/// JavaScript disabled. These cover the pure half of that: what a URL means, and what each control's
/// link should be.
/// </summary>
public class CatalogueTests
{
    private static IQueryCollection Query(params (string Key, string Value)[] pairs) =>
        new QueryCollection(pairs.ToDictionary(p => p.Key, p => new StringValues(p.Value)));

    [Fact]
    public void Reads_every_filter_from_the_query_string()
    {
        var filters = CatalogueReader.FiltersFrom(Query(
            ("roast", "roast/light"),
            ("origin", "origins/kenya"),
            ("q", "washed"),
            ("cursor", "abc123")));

        Assert.Equal("roast/light", filters.Roast);
        Assert.Equal("origins/kenya", filters.Origin);
        Assert.Equal("washed", filters.Search);
        Assert.Equal("abc123", filters.Cursor);
    }

    [Fact]
    public void Ignores_an_unknown_parameter()
    {
        // An allow-list, not a passthrough: an arbitrary query parameter must never reach the stream
        // as a filter it never declared.
        var filters = CatalogueReader.FiltersFrom(Query(("roast", "roast/light"), ("utm_source", "post")));

        Assert.Equal("roast/light", filters.Roast);
        Assert.Null(filters.Search);
    }

    [Fact]
    public void An_empty_value_is_no_filter_at_all()
    {
        var filters = CatalogueReader.FiltersFrom(Query(("q", "")));

        Assert.Null(filters.Search);
        Assert.False(CatalogueReader.HasAnyFilter(filters));
    }

    [Fact]
    public void Changing_a_filter_keeps_the_others()
    {
        var filters = new CatalogueFilters(Roast: "roast/light", Search: "washed");

        var link = CatalogueReader.LinkFor(filters, CatalogueReader.OriginKey, "origins/kenya");

        Assert.Contains("roast=roast%2Flight", link);
        Assert.Contains("origin=origins%2Fkenya", link);
        Assert.Contains("q=washed", link);
    }

    [Fact]
    public void Changing_a_filter_drops_the_cursor()
    {
        // Page three of one filtering is meaningless under another, and replaying that cursor would be
        // answered with invalid_cursor at best and a wrong page at worst.
        var filters = new CatalogueFilters(Roast: "roast/light", Cursor: "abc123");

        var link = CatalogueReader.LinkFor(filters, CatalogueReader.RoastKey, "roast/dark");

        Assert.DoesNotContain("cursor", link);
        Assert.Contains("roast=roast%2Fdark", link);
    }

    [Fact]
    public void Clearing_a_filter_removes_it_from_the_link()
    {
        var filters = new CatalogueFilters(Roast: "roast/light", Origin: "origins/kenya");

        var link = CatalogueReader.LinkFor(filters, CatalogueReader.RoastKey, null);

        Assert.DoesNotContain("roast=", link);
        Assert.Contains("origin=origins%2Fkenya", link);
    }

    [Fact]
    public void The_next_page_keeps_the_filtering()
    {
        var filters = new CatalogueFilters(Roast: "roast/light");

        var link = CatalogueReader.NextPageLink(filters, "cursor-2");

        Assert.Contains("roast=roast%2Flight", link);
        Assert.Contains("cursor=cursor-2", link);
    }

    [Fact]
    public void No_filters_is_an_empty_query_string()
    {
        var filters = new CatalogueFilters();

        Assert.Equal("", CatalogueReader.QueryFor(filters));
        Assert.False(CatalogueReader.HasAnyFilter(filters));
    }

    [Theory]
    [InlineData("roast/light", null, null)]
    [InlineData(null, "origins/kenya", null)]
    [InlineData(null, null, "washed")]
    public void Any_single_filter_counts_as_filtered(string? roast, string? origin, string? search)
    {
        Assert.True(CatalogueReader.HasAnyFilter(new CatalogueFilters(roast, origin, search)));
    }
}
