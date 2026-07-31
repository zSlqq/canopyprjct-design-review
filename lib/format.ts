export function formatCompactNumber(
    value: number | null,
): string {
    if (value === null) {
        return "Publisher";
    }

    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}
