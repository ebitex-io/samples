using Ebitex.Content.Delivery;

namespace NorthwindCoffee.Mvc.Rendering;

/// <summary>
/// The visitor facts this site personalizes on, read off the request.
///
/// <para>
/// A cookie rather than browser storage, because personalization has to be part of the <em>request</em>:
/// the server resolves every personalized value, so anything the audience tests must arrive with the
/// request that renders the page. There is nothing in the browser here to read a value and re-render.
/// </para>
/// </summary>
public static class RequestContext
{
    /// <summary>The same cookie name the other two Northwind samples use — one site, one cookie.</summary>
    public const string BuyerCookie = "northwind.buyerType";

    public const string Retail = "retail";
    public const string Trade = "trade";

    public static string BuyerTypeFrom(HttpRequest request) =>
        request.Cookies.TryGetValue(BuyerCookie, out var value) && value == Trade ? Trade : Retail;

    /// <summary>
    /// The context bag for this request. The client always sends one, an empty one included, because
    /// sending it is what selects server-resolve — which is why no renderer in this sample ever meets
    /// a personalized value it would have to decide itself.
    /// </summary>
    public static ContentContext From(HttpRequest request) =>
        new ContentContext().Set("buyerType", BuyerTypeFrom(request));
}
