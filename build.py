#!/usr/bin/env python3
import re
import sys
import time
import os

FILES = [
    'src/app/app.js',
    'src/cpu/opcodes.js',
    'src/cpu/memory.js',
    'src/cpu/input.js',
    'src/cpu/assembler.js',
    'src/cpu/cpu.js',
    'src/emulator/i8080-asm.js',
    'src/emulator/i8080-cpu.js',
    'src/emulator/disasm.js',
    'src/app/controller.js',
    'src/ui/filters-directives.js',
    'src/emulator/docking.js',
]

def light_minify(code):
    # Strip single-line comments (outside strings) and collapse blank lines/indentation
    out = []
    for line in code.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith('//'):
            continue
        out.append(stripped)
    return '\n'.join(out)

def build(minify=False):
    chunks = [open(p, 'r', encoding='utf-8').read().strip() for p in FILES]
    bundle = ';\n'.join(chunks) + '\n'
    if minify:
        bundle = light_minify(bundle)
    with open('assets/asmsimulator.js', 'w', encoding='utf-8') as out:
        out.write(bundle)
    print(f"Built assets/asmsimulator.js ({len(bundle):,} bytes)")

if __name__ == '__main__':
    minify = '--minify' in sys.argv
    build(minify=minify)
    if '--watch' in sys.argv:
        print("Watching src/ for changes (Ctrl+C to stop)...")
        mtimes = {p: os.path.getmtime(p) for p in FILES}
        while True:
            time.sleep(0.5)
            changed = [p for p in FILES if os.path.getmtime(p) != mtimes[p]]
            if changed:
                for p in changed:
                    mtimes[p] = os.path.getmtime(p)
                build(minify=minify)
