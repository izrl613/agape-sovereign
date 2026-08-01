const fs = require('fs');
const path = require('path');

// Read the HTML file
const htmlPath = path.join(__dirname, '../docs/SHA256+_SESSION_EXPORT.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Simple HTML to PDF conversion using print functionality
// Since PDF libraries are having issues, we'll create a print-friendly HTML version
const printHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SHA256+ Session Export</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            line-height: 1.6;
            color: #333;
        }
        h1 {
            color: #00D4FF;
            border-bottom: 2px solid #00D4FF;
            padding-bottom: 10px;
        }
        h2 {
            color: #FF2E9F;
            margin-top: 30px;
        }
        h3 {
            color: #7C3AED;
        }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        pre code {
            background: none;
            padding: 0;
        }
        .check {
            color: #10B981;
            font-weight: bold;
        }
        .cross {
            color: #EF4444;
            font-weight: bold;
        }
        .section {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-left: 4px solid #00D4FF;
        }
        @media print {
            body {
                padding: 20px;
            }
            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>
`;

// Write the print-friendly HTML
const printHtmlPath = path.join(__dirname, '../docs/SHA256+_SESSION_EXPORT_PRINT.html');
fs.writeFileSync(printHtmlPath, printHtml);

console.log('Print-friendly HTML created at:', printHtmlPath);
console.log('Open this file in your browser and use Cmd+P to save as PDF');