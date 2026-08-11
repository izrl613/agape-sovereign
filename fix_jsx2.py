lines = open('src/components/DiffModules.tsx').read().splitlines()
for i in range(len(lines)):
    if lines[i].strip() == ');':
        # Check if the previous line is `    ]}`
        if i > 0 and lines[i-1].strip() == ']}':
            lines[i] = '  />'
open('src/components/DiffModules.tsx', 'w').write('\n'.join(lines))
