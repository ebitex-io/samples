using Microsoft.AspNetCore.Mvc;
using NorthwindCoffee.Mvc.Rendering;

namespace NorthwindCoffee.Mvc.Controllers;

/// <summary>
/// Switches the visitor between retail and trade pricing.
///
/// <para>
/// A form post, a cookie, and a redirect back — the whole mechanism. Its React twin calls
/// <c>router.refresh()</c> after writing the cookie; here the redirect <em>is</em> the refresh, and
/// the next request carries the new value into the context bag the server personalizes against.
/// </para>
/// </summary>
public sealed class BuyerTypeController : Controller
{
    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult Set(string? buyerType, string? returnTo)
    {
        var value = buyerType == RequestContext.Trade ? RequestContext.Trade : RequestContext.Retail;

        Response.Cookies.Append(RequestContext.BuyerCookie, value, new CookieOptions
        {
            Path = "/",
            MaxAge = TimeSpan.FromDays(365),

            // Read only by this server, never by script: nothing in this browser has any use for it.
            HttpOnly = true,

            // Lax, not None: this cookie is for ordinary visits, and a preview session frames the site
            // cross-site with its own separate, partitioned cookie.
            SameSite = SameSiteMode.Lax,

            // Deliberately not Secure. The sample runs on http://localhost, and a Secure cookie there
            // is honoured — but a reader running this behind plain http on another host would find the
            // switch silently doing nothing. A deployment over https should turn this on.
            Secure = Request.IsHttps,
        });

        // Never redirect to whatever was posted. returnTo arrives in a form field, so an attacker can
        // put any absolute URL in it; Url.IsLocalUrl is what keeps this from being an open redirect
        // that borrows this site's name.
        return Redirect(Url.IsLocalUrl(returnTo) ? returnTo! : "/");
    }
}
