const pipefyForm = document.getElementById("pipefyForm");
const iframeLoading = document.getElementById("iframeLoading");

function hideLoadingState() {
    if (!iframeLoading) {
        return;
    }

    iframeLoading.style.display = "none";
}

if (pipefyForm) {
    pipefyForm.addEventListener("load", hideLoadingState, { once: true });
}
