namespace NorthwindCoffee.Mvc.Content;

/// <summary>
/// The languages this site offers, and which pages are genuinely translated — the two things the CMS
/// cannot tell us, kept in one place because exactly one surface makes a claim about them.
/// </summary>
public static class SiteLocales
{
    /// <summary>
    /// The locales this app has UI for. The CMS's locale tree is free to grow ahead of the app, so a
    /// slot outside this set is ignored rather than advertised.
    /// </summary>
    public static readonly IReadOnlySet<string> Codes =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "en", "fr" };

    /// <summary>
    /// The locale an unprefixed address like <c>/about</c> is in. The site is <c>pathPrefix</c> with
    /// <c>prefixDefaultLocale</c> off, so English addresses carry no prefix.
    /// </summary>
    public const string Default = "en";

    /// <summary>
    /// The pages that genuinely have a French version, by their CMS path.
    ///
    /// <para>
    /// <strong>Why this list has to exist.</strong> <c>GetSitemapAsync</c> reports a French locale
    /// slot for <em>every</em> page, because a slot materializes for every node the moment any node
    /// in the site carries a localized slug — a slug resolves override-else-default. So
    /// <c>/fr/guides</c> is a real, working URL that serves the French locale, and what it serves is
    /// English copy, because nobody has translated that page.
    /// </para>
    ///
    /// <para>
    /// That is not a gap in the API. A page is routinely translated while keeping its slug, so slug
    /// ownership was never a translation signal, and reporting it as one would be an
    /// authoritative-sounding answer to a question the data cannot answer. Nothing in Content records
    /// whether content has been translated.
    /// </para>
    ///
    /// <para>
    /// Which leaves one party who knows: whoever runs the site. <c>hreflang</c> is a claim that a
    /// reader in that language will find their language there, and advertising a page that falls back
    /// to English earns a worse result than advertising nothing. So this list is short and
    /// hand-maintained, and read by the one place that declares alternates —
    /// <c>SitemapController</c>. The pages' own <c>&lt;head&gt;</c> declares none.
    /// </para>
    ///
    /// <para>
    /// Keyed by each page's <em>default</em> path, which carries no prefix here, so it reads the same
    /// whichever locale is asking. A bigger site would derive this rather than type it — a category on
    /// the Experience node, a field on the Contract, a convention in the slug — and all of those are
    /// content decisions, which is the point: the question belongs in your model, not in ours.
    /// </para>
    ///
    /// <para>
    /// This is the same list, and the same reasoning, as <c>lib/locales.ts</c> in the
    /// <c>northwind-coffee-ssr</c> sample. It is the same site: the two must agree, and their sitemaps
    /// are byte-identical when both are pointed at the same origin.
    /// </para>
    /// </summary>
    public static readonly IReadOnlySet<string> TranslatedPaths =
        new HashSet<string>(StringComparer.Ordinal) { "/", "/coffees", "/coffees/ethiopia-guji" };
}
