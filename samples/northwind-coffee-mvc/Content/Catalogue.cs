using Ebitex.Content.Delivery;
using Microsoft.AspNetCore.Http;

namespace NorthwindCoffee.Mvc.Content;

/// <summary>The catalogue's filter state, which lives entirely in the query string.</summary>
/// <param name="Roast">A roast category path, or <see langword="null"/>.</param>
/// <param name="Origin">An origin category path, or <see langword="null"/>.</param>
/// <param name="Search">Free text, matched by the stream's own full-text filter.</param>
/// <param name="Cursor">The page to show. Opaque, and replayed exactly as the server issued it.</param>
public sealed record CatalogueFilters(string? Roast = null, string? Origin = null, string? Search = null, string? Cursor = null);

/// <summary>One page of the catalogue, with the facets for the filters currently applied.</summary>
public sealed record CataloguePage(
    IReadOnlyList<ComponentValue> Items,
    string? NextCursor,
    IReadOnlyList<StreamFacetValue> RoastFacet,
    IReadOnlyList<StreamFacetValue> OriginFacet)
{
    public static readonly CataloguePage Empty = new([], null, [], []);
}

/// <summary>
/// Reads the coffee catalogue: one stream query, plus a facet call per filterable dimension.
///
/// <para>
/// Its React twin does this in a client component behind a BFF route, because the filters are
/// interactive there. Here the page <em>is</em> the endpoint: a filter is a link and the search box is
/// a <c>GET</c> form, so the whole catalogue works with JavaScript disabled and the browser's own back
/// button does what it should.
/// </para>
/// </summary>
public sealed class CatalogueReader(ContentDeliveryClient delivery, ILogger<CatalogueReader> logger)
{
    /// <summary>The stream's external id. Ordering is the stream's own configuration, not a query option.</summary>
    public const string StreamExternalId = "coffees";

    public const int PageSize = 12;

    public const string RoastKey = "roast";
    public const string OriginKey = "origin";
    public const string SearchKey = "q";

    public static CatalogueFilters FiltersFrom(IQueryCollection query) => new(
        Roast: Value(query, RoastKey),
        Origin: Value(query, OriginKey),
        Search: Value(query, SearchKey),
        Cursor: Value(query, "cursor"));

    public async Task<CataloguePage> ReadAsync(CatalogueFilters filters, string? locale, CancellationToken cancellationToken)
    {
        var applied = AppliedFilters(filters);

        try
        {
            var page = await delivery.QueryStreamAsync(
                StreamExternalId,
                new StreamQueryOptions
                {
                    Filters = applied,
                    Limit = PageSize,
                    Cursor = filters.Cursor,
                    Locale = locale,

                    // Each card links to the coffee's own page, and that address comes with the item.
                    IncludeReferencePaths = true,
                },
                cancellationToken);

            // A facet counts against every *other* active filter, so each call carries the same set the
            // query did — the endpoint excludes the facet's own dimension server-side. Facets describe
            // the whole filtered set rather than this page of it, so they are fetched only for the
            // first page; a cursor request keeps whatever the first page reported.
            if (filters.Cursor is { Length: > 0 })
            {
                return new CataloguePage(page.Items, page.NextCursor, [], []);
            }

            var roast = delivery.GetStreamFacetAsync(StreamExternalId, RoastKey, new StreamFacetOptions { Filters = applied, Locale = locale }, cancellationToken);
            var origin = delivery.GetStreamFacetAsync(StreamExternalId, OriginKey, new StreamFacetOptions { Filters = applied, Locale = locale }, cancellationToken);

            await Task.WhenAll(roast, origin);

            return new CataloguePage(page.Items, page.NextCursor, roast.Result.Values, origin.Result.Values);
        }
        catch (ContentDeliveryException exception)
        {
            // A stream this organization has not defined, or a filter value it does not know, must not
            // take the page down: the rest of it is authored content that still renders.
            logger.LogWarning(
                exception,
                "Could not read the '{Stream}' stream ({ErrorCode}); rendering the page without the catalogue.",
                StreamExternalId,
                exception.ErrorCode);

            return CataloguePage.Empty;
        }
    }

    /// <summary>
    /// The query string for a filter change — every other filter preserved, and the cursor dropped,
    /// because page 3 of one filtering is meaningless under another.
    /// </summary>
    public static string LinkFor(CatalogueFilters filters, string key, string? value)
    {
        var next = key switch
        {
            RoastKey => filters with { Roast = value, Cursor = null },
            OriginKey => filters with { Origin = value, Cursor = null },
            SearchKey => filters with { Search = value, Cursor = null },
            _ => filters with { Cursor = null },
        };

        return QueryFor(next);
    }

    /// <summary>The query string for the next page: the same filtering, one cursor on.</summary>
    public static string NextPageLink(CatalogueFilters filters, string cursor) =>
        QueryFor(filters with { Cursor = cursor });

    public static string QueryFor(CatalogueFilters filters)
    {
        var query = QueryString.Empty;

        if (filters.Roast is { Length: > 0 } roast) query = query.Add(RoastKey, roast);
        if (filters.Origin is { Length: > 0 } origin) query = query.Add(OriginKey, origin);
        if (filters.Search is { Length: > 0 } search) query = query.Add(SearchKey, search);
        if (filters.Cursor is { Length: > 0 } cursor) query = query.Add("cursor", cursor);

        return query.ToString();
    }

    public static bool HasAnyFilter(CatalogueFilters filters) =>
        filters.Roast is { Length: > 0 } || filters.Origin is { Length: > 0 } || filters.Search is { Length: > 0 };

    private static IReadOnlyDictionary<string, IReadOnlyList<string>> AppliedFilters(CatalogueFilters filters)
    {
        var applied = new Dictionary<string, IReadOnlyList<string>>();

        if (filters.Roast is { Length: > 0 } roast) applied[RoastKey] = [roast];
        if (filters.Origin is { Length: > 0 } origin) applied[OriginKey] = [origin];
        if (filters.Search is { Length: > 0 } search) applied[SearchKey] = [search];

        return applied;
    }

    private static string? Value(IQueryCollection query, string key) =>
        query[key].FirstOrDefault() is { Length: > 0 } value ? value : null;
}
