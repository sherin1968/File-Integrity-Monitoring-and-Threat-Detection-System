// dashboard.js - Client side interactivity for Flask FIM App

document.addEventListener("DOMContentLoaded", () => {
    console.log("[+] File Integrity Monitoring Dashboard initialized.");

    // Auto-dismiss flash alerts after 5 seconds
    const flashBanners = document.querySelectorAll(".alert-banner");
    flashBanners.forEach(banner => {
        setTimeout(() => {
            banner.style.transition = "opacity 0.5s ease";
            banner.style.opacity = "0";
            setTimeout(() => banner.remove(), 500);
        }, 5000);
    });

    // Provide visual feedback during scan submission
    const scanForms = document.querySelectorAll("form[action*='scan']");
    scanForms.forEach(form => {
        form.addEventListener("submit", (e) => {
            const btn = form.querySelector("button");
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = "⏳ Scanning Files (SHA-256)...";
            }
        });
    });
});
