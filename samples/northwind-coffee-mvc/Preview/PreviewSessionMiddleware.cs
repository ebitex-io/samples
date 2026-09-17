using Ebitex.Content.Delivery;

namespace NorthwindCoffee.Mvc.Preview;

/// <summary>
/// Composer's live preview, for a site that renders on its server and never hydrates.
///
/// <para>
/// There is no React tree here for the SDK's <c>PreviewBridge</c> to land a draft in, so preview
/// reaches this site as a <em>session</em> instead: Composer frames a URL carrying a one-time token,
/// this middleware spends it once for a session secret, keeps that secret in its own cookie, and sends
/// it on the page read. Everything else about the request is unchanged.
/// </para>
///
/// <para>
/// Four branches, and the fourth is the important one: with neither a token nor a cookie, nothing
/// here happens at all, so an ordinary visit is byte-identical to one served by a build with no
/// preview support.
/// </para>
/// </summary>
public sealed class PreviewSessionMiddleware(RequestDelegate next, ILogger<PreviewSessionMiddleware> logger)
{
    /// <summary>The query parameter Composer frames the site with.</summary>
    public const string TokenParameter = "ebitex-preview-token";

    /// <summary>This site's own cookie. The name is ours; only the session value inside it is ebitex's.</summary>
    public const string CookieName = "ebitex_preview";

    private const string ItemKey = "ebitex.preview.session";

    public async Task InvokeAsync(HttpContext context)
    {
        var delivery = context.RequestServices.GetService<ContentDeliveryClient>();

        if (delivery is not null && context.Request.Query[TokenParameter].FirstOrDefault() is { Length: > 0 } token)
        {
            await ExchangeAsync(context, delivery, token);
            return;
        }

        if (context.Request.Cookies.TryGetValue(CookieName, out var session) && session is { Length: > 0 })
        {
            context.Items[ItemKey] = session;

            // A draft must never be cached anywhere, by anything.
            context.Response.Headers.CacheControl = "private, no-store";
        }

        await next(context);
    }

    /// <summary>The session for this request, or <see langword="null"/> on an ordinary visit.</summary>
    public static string? SessionFor(HttpContext context) =>
        context.Items.TryGetValue(ItemKey, out var value) ? value as string : null;

    /// <summary>
    /// Forgets the session. Called when the API says it has ended — the editor closed the layer — so
    /// that the very next read is an ordinary published one.
    /// </summary>
    public static void Clear(HttpContext context)
    {
        context.Items.Remove(ItemKey);
        context.Response.Cookies.Delete(CookieName, new CookieOptions { Path = "/" });
    }

    private async Task ExchangeAsync(HttpContext context, ContentDeliveryClient delivery, string token)
    {
        try
        {
            var grant = await delivery.ExchangePreviewTokenAsync(token, context.RequestAborted);

            var cookie = new CookieOptions
            {
                Path = "/",
                HttpOnly = true,

                // Secure is honoured on http://localhost, which browsers treat as a secure context.
                Secure = true,

                // The site is inside Composer's frame, so the cookie is third-party by definition.
                SameSite = SameSiteMode.None,
            };

            // ASP.NET Core 10's CookieOptions still has no Partitioned property, so the attribute is
            // added by hand. Without it the cookie is dropped by any browser blocking third-party
            // cookies — which is most of them — and preview would work on one machine and not another.
            cookie.Extensions.Add("Partitioned");

            context.Response.Cookies.Append(CookieName, grant.Session, cookie);
        }
        catch (ContentDeliveryException exception)
        {
            // A token is spendable exactly once, so a refresh of a framed URL lands here routinely.
            // It is not an error worth showing anyone: the redirect below still happens, and the
            // published page renders.
            logger.LogInformation(
                "Preview token could not be exchanged ({ErrorCode}); serving the published page.",
                exception.ErrorCode);
        }

        // Redirect either way. A token must never stay in the address bar: it is single-use, so a
        // copied URL would carry a credential that no longer works, and a shared one would look like
        // a way in.
        context.Response.Redirect(WithoutToken(context.Request));
    }

    private static string WithoutToken(HttpRequest request)
    {
        var query = request.Query
            .Where(pair => pair.Key != TokenParameter)
            .SelectMany(pair => pair.Value.Select(value => (pair.Key, Value: value)))
            .ToArray();

        var rebuilt = QueryString.Empty;
        foreach (var (key, value) in query)
        {
            rebuilt = rebuilt.Add(key, value ?? "");
        }

        return request.PathBase + request.Path + rebuilt;
    }
}
