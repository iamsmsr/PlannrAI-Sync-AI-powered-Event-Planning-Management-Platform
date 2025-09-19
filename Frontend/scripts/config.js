// Centralized config for frontend scripts
// Sets a global `window.API_BASE` that other scripts will use.
// To override in production, include a small inline script before this file:
// <script>window.API_BASE='https://api.yourdomain.com';</script>

(function(){
    if (!window.API_BASE) {
        window.API_BASE = 'https://plannraisyncbackend.ambitiousflower-691abe83.centralindia.azurecontainerapps.io';
    }
    // Provide a convenience constant available in modules/scripts that don't read window
    try { window.API_BASE_STRING = window.API_BASE; } catch(e) { /* ignore */ }
})();

//https://plannraisyncb.onrender.com
//http://localhost:8080