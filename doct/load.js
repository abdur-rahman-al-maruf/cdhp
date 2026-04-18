// This script runs when the page loads and fetches a specific header file,
// then injects it into the placeholder element.
document.addEventListener("DOMContentLoaded", () => {

    const headerPlaceholder = document.getElementById('header-placeholder');

    if (headerPlaceholder) {
        // Get the file name from the HTML data-header attribute, if not provided, load the default 'header.html'
        const headerFile = headerPlaceholder.getAttribute('data-header') || 'header.html';

        fetch(headerFile)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Header file not found');
                }
                return response.text();
            })
            .then(htmlData => {
                headerPlaceholder.innerHTML = htmlData;
                // After loading the HTML, dynamically load header.js as a module
                const script = document.createElement('script');
                script.src = 'header.js'; 
                script.type = 'module';

                script.onload = () => {
                    // Call the initialization function after the script is fully loaded
                    setTimeout(() => {
                        if (typeof window.initializeHeader === 'function') {
                            window.initializeHeader();
                        }
                    }, 50);
                };

                document.body.appendChild(script);
            })
            .catch(error => {
                console.error('Error loading header:', error);
            });
    }
});