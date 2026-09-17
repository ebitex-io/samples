using System.Net;
using System.Text;
using Ebitex.Content.Delivery;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using NorthwindCoffee.Mvc.Preview;

namespace NorthwindCoffee.Mvc.Tests;

/// <summary>
/// The four branches of live preview for a site that never hydrates.
///
/// <para>
/// The fourth — neither a token nor a cookie — is the one worth asserting hardest: an ordinary
/// visitor's request must come out the other side byte-identical to one served by a build with no
/// preview support at all.
/// </para>
/// </summary>
public class PreviewSessionMiddlewareTests
{
    [Fact]
    public async Task A_token_is_exchanged_once_and_redirected_away()
    {
        var handler = new StubHandler(HttpStatusCode.OK, """{"session":"cps_abc123"}""");
        var context = ContextWith(handler, "/coffees/christmas-blend", "?ebitex-preview-token=cpt_xyz");

        var nextRan = await InvokeAsync(context);

        Assert.Equal(1, handler.Calls);
        Assert.Equal(StatusCodes.Status302Found, context.Response.StatusCode);

        // The token must never remain in the address: it is single-use, so a copied URL would carry a
        // credential that no longer works.
        Assert.Equal("/coffees/christmas-blend", context.Response.Headers.Location);
        Assert.False(nextRan);
    }

    [Fact]
    public async Task The_cookie_is_partitioned_and_third_party_safe()
    {
        var handler = new StubHandler(HttpStatusCode.OK, """{"session":"cps_abc123"}""");
        var context = ContextWith(handler, "/", "?ebitex-preview-token=cpt_xyz");

        await InvokeAsync(context);

        var cookie = Assert.Single(context.Response.Headers.SetCookie!);

        Assert.Contains("ebitex_preview=cps_abc123", cookie);
        Assert.Contains("httponly", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("secure", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=none", cookie, StringComparison.OrdinalIgnoreCase);

        // Without this the cookie is dropped by any browser blocking third-party cookies, and preview
        // would work on one machine and not another.
        Assert.Contains("partitioned", cookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Other_query_parameters_survive_the_redirect()
    {
        var handler = new StubHandler(HttpStatusCode.OK, """{"session":"cps_abc123"}""");
        var context = ContextWith(handler, "/coffees", "?roast=roast%2Flight&ebitex-preview-token=cpt_xyz");

        await InvokeAsync(context);

        var location = context.Response.Headers.Location.ToString();

        Assert.StartsWith("/coffees?", location);
        Assert.Contains("roast=roast%2Flight", location);
        Assert.DoesNotContain("ebitex-preview-token", location);
    }

    [Fact]
    public async Task A_failed_exchange_still_strips_the_token()
    {
        // A token is spendable once, so refreshing a framed URL lands here routinely. It is not an
        // error worth showing anyone — but the token still must not stay in the address.
        var handler = new StubHandler(HttpStatusCode.Unauthorized, """{"error":"invalid_preview_token"}""");
        var context = ContextWith(handler, "/about", "?ebitex-preview-token=cpt_spent");

        var nextRan = await InvokeAsync(context);

        Assert.Equal(StatusCodes.Status302Found, context.Response.StatusCode);
        Assert.Equal("/about", context.Response.Headers.Location);
        // .Count, not Assert.Empty: StringValues implicitly converts to string, so Assert.Empty on an
        // absent header is handed null and throws — an assertion that looks right and tests nothing.
        Assert.Equal(0, context.Response.Headers.SetCookie.Count);
        Assert.False(nextRan);
    }

    [Fact]
    public async Task A_cookie_carries_the_session_into_the_page_read()
    {
        var handler = new StubHandler(HttpStatusCode.OK, "{}");
        var context = ContextWith(handler, "/about", "");
        context.Request.Headers.Cookie = "ebitex_preview=cps_live";

        string? seen = null;
        await InvokeAsync(context, ctx => seen = PreviewSessionMiddleware.SessionFor(ctx));

        Assert.Equal("cps_live", seen);
        Assert.Equal("private, no-store", context.Response.Headers.CacheControl);
        Assert.Equal(0, handler.Calls);
    }

    [Fact]
    public async Task An_ordinary_visit_is_untouched()
    {
        var handler = new StubHandler(HttpStatusCode.OK, "{}");
        var context = ContextWith(handler, "/about", "");

        var nextRan = await InvokeAsync(context);

        Assert.True(nextRan);
        Assert.Equal(0, handler.Calls);
        // .Count, not Assert.Empty: StringValues implicitly converts to string, so Assert.Empty on an
        // absent header is handed null and throws — an assertion that looks right and tests nothing.
        Assert.Equal(0, context.Response.Headers.SetCookie.Count);
        Assert.Equal(0, context.Response.Headers.CacheControl.Count);
        Assert.Null(PreviewSessionMiddleware.SessionFor(context));
    }

    [Fact]
    public void Clearing_forgets_the_session_and_expires_the_cookie()
    {
        var context = new DefaultHttpContext();
        context.Items["ebitex.preview.session"] = "cps_live";

        PreviewSessionMiddleware.Clear(context);

        Assert.Null(PreviewSessionMiddleware.SessionFor(context));
        Assert.Contains("ebitex_preview=", Assert.Single(context.Response.Headers.SetCookie!));
    }

    private static DefaultHttpContext ContextWith(StubHandler handler, string path, string query)
    {
        var client = new ContentDeliveryClient(
            new HttpClient(handler),
            new ContentDeliveryOptions
            {
                ApiKey = "frm_live_" + new string('a', 56),
                SiteId = Guid.NewGuid(),
                BaseUrl = new Uri("https://api.example"),
            });

        var services = new ServiceCollection();
        services.AddSingleton(client);

        return new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider(),
            Request = { Path = path, QueryString = new QueryString(query) },
        };
    }

    private static async Task<bool> InvokeAsync(HttpContext context, Action<HttpContext>? onNext = null)
    {
        var nextRan = false;

        var middleware = new PreviewSessionMiddleware(
            ctx =>
            {
                nextRan = true;
                onNext?.Invoke(ctx);
                return Task.CompletedTask;
            },
            NullLogger<PreviewSessionMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        return nextRan;
    }

    private sealed class StubHandler(HttpStatusCode status, string body) : HttpMessageHandler
    {
        public int Calls { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;

            return Task.FromResult(new HttpResponseMessage(status)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json"),
            });
        }
    }
}
