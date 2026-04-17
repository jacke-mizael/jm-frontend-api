export function toNumericId(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export function toOrderValue(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}
