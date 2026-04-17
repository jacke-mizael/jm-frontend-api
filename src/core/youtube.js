export function getYouTubeVideoId(link) {
    if (!link) {
        return "";
    }

    try {
        const url = new URL(link);

        if (url.hostname.includes("youtu.be")) {
            return url.pathname.replace("/", "");
        }

        if (url.hostname.includes("youtube.com")) {
            if (url.pathname.includes("/embed/")) {
                return url.pathname.split("/embed/")[1] || "";
            }

            return url.searchParams.get("v") || "";
        }
    } catch (_error) {
        return "";
    }

    return "";
}

export function buildYouTubeThumbUrl(link, fallbackImage = "") {
    const videoId = getYouTubeVideoId(link);

    return videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : fallbackImage;
}
