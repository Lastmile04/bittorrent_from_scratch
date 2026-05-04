#!/usr/bin/env bash

root="$(pwd)"
out="$root/completeCode.md"

echo "# Complete code dump" > "$out"

find "$root" -type f -name "*.js" \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/dist/*" \
    ! -path "*/build/*" \
| sort | while read -r file; do
    rel="${file#$root/}"

    {
        echo ""
        echo ""
        echo "## ./$rel"
        echo '```js'
        cat "$file"
        echo '```'
    } >> "$out"
done

echo "Updated $out"
    


 
