// Function to dynamically load HTML components
document.addEventListener("DOMContentLoaded", () => {
    // Check for placeholder ID
    const headerPlaceholder = document.getElementById('header-placeholder') || document.getElementById('header');
    
    if (headerPlaceholder) {
        // Read data-header attribute, default to 'header.html' if not found
        const headerFile = headerPlaceholder.getAttribute('data-header') || 'header.html';
        
        fetch(headerFile)
            .then(response => {
                if (!response.ok) throw new Error("Failed to load " + headerFile);
                return response.text();
            })
            .then(htmlData => {
                headerPlaceholder.innerHTML = htmlData;

                // Load header.js script dynamically from the js/ folder
                const script = document.createElement("script");
                script.src = "js/header.js"; // 👈 Path points to js folder
                script.type = "module";

                script.onload = () => {
                    setTimeout(() => {
                        // Check if initHeader exists and call it
                        if (typeof window.initHeader === "function") {
                            window.initHeader();
                        } else if (typeof window.initializeHeader === "function") {
                            window.initializeHeader();
                        }
                    }, 50);
                };

                document.body.appendChild(script);
            })
            .catch(err => console.error("Error loading header:", err));
    }
});