using System.Globalization;

namespace NorthwindCoffee.Mvc.Content;

/// <summary>
/// Presentation formatting for the shop's own numbers, matching the other two Northwind samples so
/// the same product reads identically in all three.
/// </summary>
public static class Format
{
    /// <summary>
    /// The shop's currency. A constant rather than a content field on purpose: this sample sells in
    /// one currency, and a per-product currency field would be a shape nothing in the model supports.
    /// </summary>
    public const string PriceCurrency = "GBP";

    private static readonly CultureInfo Culture = CultureInfo.GetCultureInfo("en-GB");

    public static string Price(double value) => value.ToString("C", Culture);

    public static string Weight(double grams) => $"{grams.ToString("0.##", Culture)}g";

    /// <summary>
    /// Minutes as an ISO 8601 duration, for a HowTo's <c>totalTime</c>. Schema.org wants a duration,
    /// not a number of minutes, and a reader of the JSON-LD gets nothing useful from "25".
    /// </summary>
    public static string IsoDuration(double minutes) =>
        minutes >= 60 && minutes % 60 == 0
            ? $"PT{(int)(minutes / 60)}H"
            : minutes >= 60
                ? $"PT{(int)(minutes / 60)}H{(int)(minutes % 60)}M"
                : $"PT{(int)minutes}M";
}
