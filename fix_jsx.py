import re

with open('src/components/DiffModules.tsx', 'r') as f:
    content = f.read()

# Replace the specific syntax `];\n  );\n);` or `];\n  );\n;`
content = re.sub(r'\]\n\s*\);\n(?!$)', ']\n  />\n', content)

with open('src/components/DiffModules.tsx', 'w') as f:
    f.write(content)
