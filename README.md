# Simple 8-bit Assembler Simulator

A browser-based simulator providing a simplified NASM-like assembler syntax for an 8-bit x86-inspired educational CPU. Click **Instruction Set** inside the simulator to view the full opcode and architecture reference.

#### [TRY IT ONLINE](https://robotgibson.github.io/assembler-simulator/)

### Features

- **8-bit CPU:** 4 general-purpose registers (`A`, `B`, `C`, `D`), Instruction Pointer (`IP`), Stack Pointer (`SP`), and Zero (`Z`), Carry (`C`), and Fault (`F`) flags
- **Extended Instruction Set:** Includes `NOP`, `ADDC` (add with carry), and `SUBC` (subtract with borrow) alongside full arithmetic, bitwise, shift, jump, and stack operations
- **256 Bytes of Memory (`0x00`–`0xFF`):** Displayed in a `0`–`F` labeled 16x16 hex/decimal grid with hover tooltips showing address, value, ASCII character, and decoded opcode
- **Memory-Mapped Console Output (`0xE8`–`0xFF`):** 24-character ASCII display mapped to the top 24 bytes of RAM
- **16 Memory-Mapped Switch Inputs (`0`–`15`):** Interactive toggle switches mapped to addresses `255` (`0xFF`, switches `0`–`7`) and `254` (`0xFE`, switches `8`–`15`)
- **Debugging & Workflow Tools:** Live clock speed buttons (`1 HZ`–`16 HZ`), modified register/flag highlighting, built-in **Examples** loader, `.asm` source export, and full `.json` state export/import

### Running Locally

No build step is required—serve the repository root with any static HTTP server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser. *(If modifying `src/` files, run `grunt` to rebuild `assets/asmsimulator.js`.)*

### Background & Credits

Originally created by Marco Schweighauser ([upstream repository](https://github.com/Schweigi/assembler-simulator) | [archived blog walkthrough](https://web.archive.org/web/20200220000000/https://www.mschweighauser.com/make-your-own-assembler-simulator-in-javascript-part1/)). Enhanced in this fork with community PR ports (`NOP`, `ADDC`/`SUBC`, switch inputs), ALU/parser bug fixes, and UI improvements.

### License

**The MIT License** — Copyright (c) 2015 Marco Schweighauser (see `LICENSE` / source headers for full terms).
