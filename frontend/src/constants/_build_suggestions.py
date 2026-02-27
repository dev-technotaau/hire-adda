#!/usr/bin/env python3
"""Assembles the suggestions.ts file from parts."""
import glob
import os

dir_path = os.path.dirname(os.path.abspath(__file__))
parts = sorted(glob.glob(os.path.join(dir_path, '_suggestions_part_*.txt')))
output = os.path.join(dir_path, 'suggestions.ts')

with open(output, 'w', encoding='utf-8', newline='\n') as out:
    for p in parts:
        with open(p, 'r', encoding='utf-8') as f:
            out.write(f.read())

# Clean up
for p in parts:
    os.remove(p)
os.remove(os.path.abspath(__file__))

print(f"Wrote {output}")
