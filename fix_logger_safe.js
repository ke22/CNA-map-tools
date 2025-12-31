const fs = require('fs');

// Helper function to safely wrap Logger calls
function makeLoggerSafe(content) {
    // Replace Logger.method( with safe version
    const replacements = [
        {
            // Match Logger.warn(...) but not already wrapped
            pattern: /(?<!typeof Logger !== 'undefined' && Logger\.)Logger\.warn\(/g,
            replacement: "(typeof Logger !== 'undefined' && Logger.warn ? Logger.warn("
        },
        {
            pattern: /(?<!typeof Logger !== 'undefined' && Logger\.)Logger\.error\(/g,
            replacement: "(typeof Logger !== 'undefined' && Logger.error ? Logger.error("
        },
        {
            pattern: /(?<!typeof Logger !== 'undefined' && Logger\.)Logger\.info\(/g,
            replacement: "(typeof Logger !== 'undefined' && Logger.info ? Logger.info("
        },
        {
            pattern: /(?<!typeof Logger !== 'undefined' && Logger\.)Logger\.debug\(/g,
            replacement: "(typeof Logger !== 'undefined' && Logger.debug ? Logger.debug("
        }
    ];
    
    // Actually, let's use a simpler approach - replace all Logger calls with a helper
    // But for now, let's just check if the file loads correctly
    return content;
}

// Actually, the issue might be simpler - let's check if the modules are exporting correctly
console.log("Checking module exports...");

