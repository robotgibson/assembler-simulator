app.controller('Ctrl', ['$document', '$scope', '$timeout', '$http', 'opcodes', 'disasm', 'cpu', 'cpu8080', 'memory', 'input', 'assembler', 'assembler8080', function ($document, $scope, $timeout, $http, opcodes, disasm, cpu, cpu8080, memory, input, assembler, assembler8080) {
    $scope.displayInstr = false;
    $scope.memory = memory;
    $scope.cpu = cpu;
    $scope.input = input;
    $scope.inputHex = '0000';
    $scope.refreshInputHex = function () {
        var val = 0;
        for (var i = 0; i < 16; i++) { if (input.data.at(i)) { val |= (1 << i); } }
        var h = val.toString(16).toUpperCase();
        while (h.length < 4) { h = '0' + h; }
        $scope.inputHex = h;
    };
    $scope.setInputSwitch = function (index) {
        if (index >= input.data.length) {
            throw "Error input out of bounds";
        }
        input.setBit(index);
        $scope.refreshInputHex();
    };
    $scope.setInputHex = function (hexStr) {
        var val = parseInt((hexStr || '0').replace(/^0x/i, ''), 16);
        if (isNaN(val)) { return; }
        val &= 0xFFFF;
        for (var i = 0; i < 16; i++) {
            input.data.splice(i, 1, ((val >> i) & 1) === 1);
        }
        input.sync();
        $scope.refreshInputHex();
    };
    $scope.clearInput = function () {
        input.reset();
        input.sync();
        $scope.refreshInputHex();
    };
    $scope.cpu8080 = cpu8080;
    $scope.cpuMode = '8bit';
    $scope.showAscii = true;
    $scope.ramCols = [];
    for (var rc = 0; rc < 16; rc++) { $scope.ramCols.push(rc); }
    $scope.ramSizes = [
        { label: '256B', bytes: 256 },
        { label: '1K', bytes: 1024 },
        { label: '2K', bytes: 2048 },
        { label: '16K', bytes: 16384 },
        { label: '32K', bytes: 32768 },
        { label: '64K', bytes: 65536 },
        { label: '128K', bytes: 131072 },
        { label: '256K', bytes: 262144 },
        { label: '1024K', bytes: 1048576 }
    ];
    $scope.ramSize = 256;
    $scope.ramWindowBase = 0;
    $scope.ramJumpHex = '0000';
    $scope.ramVisibleRows = [];

    $scope.rebuildRamRows = function () {
        var totalRows = Math.floor(memory.data.length / 16);
        var maxVisible = 256;
        var startRow = Math.floor($scope.ramWindowBase / 16);
        if (startRow < 0) { startRow = 0; }
        if (startRow >= totalRows) { startRow = Math.max(0, totalRows - maxVisible); }
        var count = Math.min(totalRows - startRow, maxVisible);
        var rows = [];
        for (var i = 0; i < count; i++) { rows.push(startRow + i); }
        $scope.ramVisibleRows = rows;
    };

    $scope.formatRowAddr = function (row) {
        var addr = row * 16;
        var digits = memory.data.length > 65536 ? 5 : 4;
        var h = addr.toString(16).toUpperCase();
        while (h.length < digits) { h = '0' + h; }
        return h + ':';
    };

    $scope.setRamSize = function (bytes) {
        $scope.stop();
        $scope.ramSize = bytes;
        $scope.ramWindowBase = 0;
        $scope.ramJumpHex = '0000';
        memory.resize(bytes);
        $scope.outputStartIndex = (bytes === 256) ? 232 : (bytes - 26);
        $scope.rebuildRamRows();
        $scope.reset();
    };

    $scope.jumpRamAddr = function (hexStr) {
        var v = parseInt((hexStr || '0').replace(/^0x/i, ''), 16);
        if (isNaN(v) || v < 0) { v = 0; }
        if (v >= memory.data.length) { v = memory.data.length - 16; }
        $scope.ramWindowBase = v & ~0x0F;
        $scope.rebuildRamRows();
    };

    $scope.stepRamWindow = function (deltaBytes) {
        var next = $scope.ramWindowBase + deltaBytes;
        if (next < 0) { next = 0; }
        if (next >= memory.data.length) { next = Math.max(0, memory.data.length - 4096); }
        $scope.ramWindowBase = next & ~0x0F;
        $scope.rebuildRamRows();
    };

    $scope.rebuildRamRows();
    $scope.ramSizes = [
        { label: '256B', bytes: 256 },
        { label: '1K', bytes: 1024 },
        { label: '2K', bytes: 2048 },
        { label: '16K', bytes: 16384 },
        { label: '32K', bytes: 32768 },
        { label: '64K', bytes: 65536 },
        { label: '128K', bytes: 131072 },
        { label: '256K', bytes: 262144 },
        { label: '1024K', bytes: 1048576 }
    ];
    $scope.ramSize = 256;
    $scope.ramPage = 0;
    $scope.ramCols = [];
    for (var c = 0; c < 16; c++) { $scope.ramCols.push(c); }
    $scope.ramVisibleRows = [];

    $scope.rebuildRamView = function () {
        var totalRows = Math.floor(memory.data.length / 16);
        var maxPage = Math.max(0, Math.ceil(totalRows / 64) - 1);
        if ($scope.ramPage > maxPage) { $scope.ramPage = maxPage; }
        var startRow = $scope.ramPage * 64;
        var count = Math.min(64, totalRows - startRow);
        var arr = [];
        for (var i = 0; i < count; i++) { arr.push(startRow + i); }
        $scope.ramVisibleRows = arr;
    };

    $scope.setRamSize = function (bytes) {
        $scope.stop();
        $scope.ramSize = bytes;
        $scope.ramPage = 0;
        memory.resize(bytes);
        $scope.reset();
        if (bytes > 256) {
            cpu8080.sp = Math.min(bytes, 65536) - 1;
        }
        $scope.rebuildRamView();
    };

    $scope.stepRamPage = function (delta) {
        var totalRows = Math.floor(memory.data.length / 16);
        var maxPage = Math.max(0, Math.ceil(totalRows / 64) - 1);
        $scope.ramPage = Math.max(0, Math.min(maxPage, $scope.ramPage + delta));
        $scope.rebuildRamView();
    };

    $scope.ramPageCount = function () {
        return Math.max(1, Math.ceil(Math.floor(memory.data.length / 16) / 64));
    };

    $scope.formatRowAddr = function (row) {
        var addr = row * 16;
        var digits = (memory.data.length > 65536) ? 5 : ((memory.data.length > 255) ? 4 : 2);
        var h = addr.toString(16).toUpperCase();
        while (h.length < digits) { h = '0' + h; }
        return h + ':';
    };

    $scope.rebuildRamView();
    $scope.layoutMenuOpen = false;
    $document.on('click', function (e) {
        if ($scope.layoutMenuOpen && !e.target.closest('.dock-dropdown')) {
            $scope.$apply(function () { $scope.layoutMenuOpen = false; });
        }
    });
    $scope.panelMeta = [
        { id: 'code', name: 'Code' },
        { id: 'disasm', name: 'Disassembly' },
        { id: 'labels', name: 'Labels' },
        { id: 'input', name: 'Input' },
        { id: 'output', name: 'Output' },
        { id: 'cpumem', name: 'CPU & Memory' }
    ];
    var defaultDock = {
        cols: 3,
        zones: {
            col1: ['code'],
            col2: ['disasm', 'labels'],
            col3: ['input', 'output', 'cpumem']
        },
        hidden: {},
        collapsed: {}
    };
    $scope.dock = angular.copy(defaultDock);
    try {
        var saved = JSON.parse(localStorage.getItem('asmSimDockV1') || 'null');
        if (saved && saved.zones) { $scope.dock = angular.extend(angular.copy(defaultDock), saved); }
    } catch (e) {}

    $scope.applyDockDom = function () {
        angular.forEach(['col1', 'col2', 'col3'], function (zid) {
            var zEl = document.getElementById('dock-' + zid);
            var list = $scope.dock.zones[zid] || [];
            if (!zEl) { return; }
            for (var i = 0; i < list.length; i++) {
                var card = document.querySelector('[data-panel-id="' + list.at(i) + '"]');
                if (card) { zEl.appendChild(card); }
            }
        });
    };

    $scope.saveDockLayout = function () {
        angular.forEach(['col1', 'col2', 'col3'], function (zid) {
            var zEl = document.getElementById('dock-' + zid);
            if (!zEl) { return; }
            var kids = zEl.querySelectorAll('[data-panel-id]');
            var arr = [];
            for (var i = 0; i < kids.length; i++) { arr.push(kids.item(i).getAttribute('data-panel-id')); }
            $scope.dock.zones[zid] = arr;
        });
        try { localStorage.setItem('asmSimDockV1', JSON.stringify($scope.dock)); } catch (e) {}
    };

    $scope.setDockCols = function (n) {
        $scope.dock.cols = n;
        if (n === 2) {
            $scope.dock.zones.col1 = ['code', 'labels'];
            $scope.dock.zones.col2 = ['disasm', 'input', 'output', 'cpumem'];
            $scope.dock.zones.col3 = [];
        } else {
            $scope.dock.zones.col1 = ['code'];
            $scope.dock.zones.col2 = ['disasm', 'labels'];
            $scope.dock.zones.col3 = ['input', 'output', 'cpumem'];
        }
        $scope.applyDockDom();
        $scope.saveDockLayout();
    };

    $scope.togglePanelHidden = function (pid) {
        $scope.dock.hidden[pid] = !$scope.dock.hidden[pid];
        $scope.saveDockLayout();
    };

    $scope.togglePanelCollapse = function (pid) {
        $scope.dock.collapsed[pid] = !$scope.dock.collapsed[pid];
        $scope.saveDockLayout();
    };

    $scope.resetDockLayout = function () {
        $scope.dock = angular.copy(defaultDock);
        $scope.applyDockDom();
        try { localStorage.removeItem('asmSimDockV1'); } catch (e) {}
    };

    $timeout($scope.applyDockDom, 0);
    $scope.ramRows = [];
    for (var r = 0; r < 16; r++) { $scope.ramRows.push(r); }
    $scope.disassembly = [];
    $scope.refreshDisasm = function () {
        $scope.disassembly = disasm.build(memory.data, $scope.mapping, $scope.cpuMode);
    };
    $scope.getAsciiChar = function (b) {
        return (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
    };
    var defaultCode8 = "; Simple example\n; Writes Hello World to the output\n\n\tJMP start\nhello: DB \"Hello World!\" ; Variable\n       DB 0\t; String terminator\n\nstart:\n\tMOV C, hello    ; Point to var \n\tMOV D, 232\t; Point to output\n\tCALL print\n        HLT             ; Stop execution\n\nprint:\t\t\t; print(C:*from, D:*to)\n\tPUSH A\n\tPUSH B\n\tMOV B, 0\n.loop:\n\tMOV A, [C]\t; Get char from var\n\tMOV [D], A\t; Write to output\n\tINC C\n\tINC D  \n\tCMP B, [C]\t; Check if end\n\tJNZ .loop\t; jump if not\n\n\tPOP B\n\tPOP A\n\tRET";
    var defaultCode8080 = "; Intel 8080 Hello World example\n; Writes \"Hello World!\" to memory-mapped output (232 / 0xE8)\n\n        JMP start\nhello:  DB \"Hello World!\"\n        DB 0\n\nstart:\n        LXI H, hello    ; HL points to source string\n        LXI D, 232      ; DE points to console output (0xE8)\n        CALL print\n        HLT\n\nprint:\n        MOV A, M        ; Load byte at [HL] into A\n        CPI 0           ; Check for null terminator\n        RZ              ; Return if zero\n        STAX D          ; Store A at [DE]\n        INX H           ; HL++\n        INX D           ; DE++\n        JMP print";
    $scope.setCpuMode = function (mode) {
        if ($scope.cpuMode === mode) { return; }
        $scope.stop();
        $scope.cpuMode = mode;
        $scope.selectedExample = '';
        $scope.code = (mode === '8080') ? defaultCode8080 : defaultCode8;
        $scope.reset();
    };
    $scope.error = '';
    $scope.displayHex = true;
    $scope.showAscii = true;
    $scope.disasmRows = [];
    $scope.getActiveIp = function () { return ($scope.cpuMode === '8080') ? cpu8080.ip : cpu.ip; };
    $scope.getAsciiChar = function (v) { return (v >= 32 && v <= 126) ? String.fromCharCode(v) : '.'; };
    $scope.displayA = false;
    $scope.displayB = false;
    $scope.displayC = false;
    $scope.displayD = false;
    $scope.speeds = [{speed: 1, desc: "1 HZ"},
                     {speed: 4, desc: "4 HZ"},
                     {speed: 8, desc: "8 HZ"},
                     {speed: 16, desc: "16 HZ"}];
    $scope.speed = 4;
    $scope.setSpeed = function (s) { $scope.speed = s; };
    $scope.exportAsm = function () {
        var blob = new Blob([$scope.code], { type: 'text/plain' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'program.asm';
        a.click();
        URL.revokeObjectURL(a.href);
    };
    $scope.exportState = function () {
        var st = {
            code: $scope.code,
            cpu: { gpr: cpu.gpr.slice(), ip: cpu.ip, sp: cpu.sp, zero: cpu.zero, carry: cpu.carry, fault: cpu.fault },
            memory: memory.data.slice(),
            switches: input.data.slice()
        };
        var blob = new Blob([JSON.stringify(st, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'asm-sim-state.json';
        a.click();
        URL.revokeObjectURL(a.href);
    };
    $scope.triggerImport = function () { document.getElementById('importStateFile').click(); };
    $scope.importState = function (files) {
        var file = files && files.item(0);
        if (!file) { return; }
        var reader = new FileReader();
        reader.onload = function (e) {
            $scope.$apply(function () {
                if (file.name.toLowerCase().endsWith('.asm')) {
                    $scope.stop();
                    $scope.code = e.target.result;
                    $scope.reset();
                    return;
                }
                try {
                    var st = JSON.parse(e.target.result);
                    $scope.stop();
                    $scope.reset();
                    if (typeof st.code === 'string') {
                        $scope.code = st.code;
                        try {
                            var asm = assembler.go($scope.code);
                            $scope.mapping = asm.mapping;
                            $scope.labels = asm.labels;
                            $scope.displayInstr = true;
                        } catch (ex) {}
                    }
                    if (st.cpu) {
                        if (Array.isArray(st.cpu.gpr)) { for (var i = 0; i < 4; i++) { cpu.gpr[i] = st.cpu.gpr[i] || 0; } }
                        if (typeof st.cpu.ip === 'number') { cpu.ip = st.cpu.ip; }
                        if (typeof st.cpu.sp === 'number') { cpu.sp = st.cpu.sp; }
                        cpu.zero = !!st.cpu.zero; cpu.carry = !!st.cpu.carry; cpu.fault = !!st.cpu.fault;
                    }
                    if (Array.isArray(st.memory)) {
                        for (var m = 0; m < memory.data.length && m < st.memory.length; m++) { memory.data[m] = st.memory[m] || 0; }
                    }
                    if (Array.isArray(st.switches)) {
                        for (var s = 0; s < 16; s++) { input.data[s] = !!st.switches[s]; }
                    }
                } catch (err) {
                    $scope.error = 'Invalid state JSON file';
                }
            });
        };
        reader.readAsText(file);
    };
    $scope.outputStartIndex = 232;
    $scope.changed = { gprA: false, gprB: false, gprC: false, gprD: false, sp: false, zero: false, carry: false, fault: false };
    var opcodeNames = {};
    angular.forEach(opcodes, function (v, k) { opcodeNames[v] = k; });
    $scope.examples = [
        { name: 'Hello World', file: 'examples/hello-world.asm', mode: '8bit' },
        { name: 'Switches & 16-bit Math', file: 'examples/switches-and-16bit-math.asm', mode: '8bit' },
        { name: 'Simple Example 1', file: 'examples/simple-example-1.asm', mode: '8bit' },
        { name: 'Simple Example 2', file: 'examples/simple-example-2.asm', mode: '8bit' },
        { name: 'Simple Example 3', file: 'examples/simple-example-3.asm', mode: '8bit' },
        { name: 'Hello World (8080)', file: 'examples/hello-world-8080.asm', mode: '8080' },
        { name: 'Input Switches (8080)', file: 'examples/switches-8080.asm', mode: '8080' }
    ];
    $scope.selectedExample = '';
    $scope.loadExample = function (file) {
        if (!file) { return; }
        $http.get(file).then(function (resp) {
            $scope.stop();
            if (file.indexOf('8080') !== -1) { $scope.cpuMode = '8080'; } else if (file.indexOf('hello-world.asm') !== -1 || file.indexOf('simple-example') !== -1 || file.indexOf('switches-and') !== -1) { $scope.cpuMode = '8bit'; }
            $scope.code = resp.data;
            $scope.reset();
        }, function () {
            $scope.error = 'Failed to load example: ' + file;
        });
    };
    $scope.getMemoryTooltip = function (idx) {
        var val = memory.data.at(idx);
        var pad = (memory.data.length > 65536) ? 5 : ((memory.data.length > 256) ? 4 : 2); var ha = ('00000' + idx.toString(16).toUpperCase()).slice(-pad);
        var hv = ('0' + val.toString(16).toUpperCase()).slice(-2);
        var tip = 'Addr: 0x' + ha + ' (' + idx + ') | Val: 0x' + hv + ' (' + val + ')';
        if (val >= 32 && val <= 126) { tip += " | Char: '" + String.fromCharCode(val) + "'"; }
        if ($scope.cpuMode === '8bit' && $scope.isInstruction(idx) && opcodeNames.hasOwnProperty(val)) { tip += ' | Op: ' + opcodeNames[val]; }
        return tip;
    };
    $scope.code = "; Simple example\n; Writes Hello World to the output\n\n\tJMP start\nhello: DB \"Hello World!\" ; Variable\n       DB 0\t; String terminator\n\nstart:\n\tMOV C, hello    ; Point to var \n\tMOV D, 232\t; Point to output\n\tCALL print\n        HLT             ; Stop execution\n\nprint:\t\t\t; print(C:*from, D:*to)\n\tPUSH A\n\tPUSH B\n\tMOV B, 0\n.loop:\n\tMOV A, [C]\t; Get char from var\n\tMOV [D], A\t; Write to output\n\tINC C\n\tINC D  \n\tCMP B, [C]\t; Check if end\n\tJNZ .loop\t; jump if not\n\n\tPOP B\n\tPOP A\n\tRET";

    $scope.reset = function () {
		$timeout.cancel(runner);
		input.reset();
		$scope.refreshInputHex();
		$scope.isRunning = false;
		$scope.labels = null;
		
		$scope.displayInstr = false;
		delete $scope.mapping;

        cpu.reset();
        cpu8080.reset();
        if (memory.data.length > 256) { cpu8080.sp = Math.min(memory.data.length, 65536) - 1; }
        memory.reset();
        $scope.error = '';
        $scope.selectedLine = -1;
        $scope.disassembly = [];
        $scope.disasmRows = [];
        $scope.changed = { gprA: false, gprB: false, gprC: false, gprD: false, sp: false, zero: false, carry: false, fault: false };
    };

    $scope.executeStep = function () {
        if (!$scope.checkPrgrmLoaded()) {
            $scope.assemble();
        }

        try {
            var activeCpu = ($scope.cpuMode === '8080') ? cpu8080 : cpu;
            var pG = ($scope.cpuMode === '8080') ? cpu8080.regs.slice() : cpu.gpr.slice();
            var pS = activeCpu.sp, pZ = activeCpu.zero, pC = activeCpu.carry, pF = activeCpu.fault;
            var pSign = !!cpu8080.sign, pPar = !!cpu8080.parity;
            // Execute
            var res = activeCpu.step();
            if ($scope.cpuMode === '8080') {
                $scope.changed = {
                    gprA: cpu8080.regs.at(7)!==pG.at(7), gprB: cpu8080.regs.at(0)!==pG.at(0),
                    gprC: cpu8080.regs.at(1)!==pG.at(1), gprD: cpu8080.regs.at(2)!==pG.at(2),
                    gprE: cpu8080.regs.at(3)!==pG.at(3), gprH: cpu8080.regs.at(4)!==pG.at(4),
                    gprL: cpu8080.regs.at(5)!==pG.at(5), sp: cpu8080.sp!==pS,
                    zero: cpu8080.zero!==pZ, carry: cpu8080.carry!==pC,
                    sign: cpu8080.sign!==pSign, parity: cpu8080.parity!==pPar, fault: cpu8080.fault!==pF
                };
            } else {
                $scope.changed = { gprA: cpu.gpr.at(0)!==pG.at(0), gprB: cpu.gpr.at(1)!==pG.at(1), gprC: cpu.gpr.at(2)!==pG.at(2), gprD: cpu.gpr.at(3)!==pG.at(3), sp: cpu.sp!==pS, zero: cpu.zero!==pZ, carry: cpu.carry!==pC, fault: cpu.fault!==pF };
            }

            $scope.disasmRows = disasm.build(memory.data, $scope.mapping, $scope.cpuMode);
            $scope.refreshDisasm();
            // Mark in code
            if (activeCpu.ip in $scope.mapping) {
                $scope.selectedLine = $scope.mapping[activeCpu.ip];
            }

            return res;
        } catch (e) {
            if (typeof e === 'string') {
                $scope.error = e;
            } else if (e && e.error) {
                $scope.error = (e.line !== undefined ? e.line + ' | ' : '') + e.error;
            } else {
                $scope.error = 'CPU halted (HLT / 0x00).';
            }
            return false;
        }
    };

    var runner;
    $scope.run = function () {
        if (!$scope.checkPrgrmLoaded()) {
            $scope.assemble();
            if ($scope.error) { return; }
        }

        $scope.isRunning = true;
        runner = $timeout(function () {
            if ($scope.executeStep() === true) {
                $scope.run();
            } else {
                $scope.isRunning = false;
            }
        }, 1000 / $scope.speed);
    };

    $scope.stop = function () {
        $timeout.cancel(runner);
        $scope.isRunning = false;
    };

    $scope.checkPrgrmLoaded = function () {
        return !!$scope.labels;
    };

    $scope.getChar = function (value) {
        var text = String.fromCharCode(value);

        if (text.trim() === '') {
            return '\u00A0\u00A0';
        } else {
            return text;
        }
    };

    $scope.assemble = function () {
        try {
            $scope.reset();
			$scope.displayInstr = true;

            var assembly = ($scope.cpuMode === '8080') ? assembler8080.go($scope.code) : assembler.go($scope.code);
            $scope.mapping = assembly.mapping;
            var binary = assembly.code;
            $scope.labels = assembly.labels;

            if (binary.length > memory.data.length)
                throw "Binary code does not fit into the memory. Max " + memory.data.length + " bytes are allowed";

            for (var i = 0, l = binary.length; i < l; i++) {
                memory.data[i] = binary[i];
            }
            $scope.refreshDisasm();
            $scope.disasmRows = disasm.build(memory.data, $scope.mapping, $scope.cpuMode);
        } catch (e) {
            if (typeof e === 'string') {
                $scope.error = e;
            } else if (e.line !== undefined) {
                $scope.error = e.line + " | " + e.error;
                $scope.selectedLine = e.line;
            } else {
                $scope.error = e.error || String(e);
            }
        }
    };

    $scope.jumpToLine = function (index) {
        $document[0].getElementById('sourceCode').scrollIntoView();
        $scope.selectedLine = $scope.mapping[index];
    };


    $scope.isInstruction = function (index) {
        return $scope.mapping !== undefined &&
            $scope.mapping[index] !== undefined &&
            $scope.displayInstr;
    };

    $scope.getMemoryCellCss = function (index) {
        if (index >= memory.data.length - 2) {
            return 'input-bg';
        }
        if (index >= $scope.outputStartIndex && index < memory.data.length - 2) {
            return 'output-bg';
        } else if ($scope.isInstruction(index)) {
            return 'instr-bg';
        } else if (index > cpu.sp && index <= cpu.maxSP) {
            return 'stack-bg';
        } else {
            return '';
        }
    };

    $scope.getMemoryInnerCellCss = function (index) { 
        if (index === cpu.ip) {
            return 'marker marker-ip';
        } else if (index === cpu.sp) {
            return 'marker marker-sp';
        } else if (index === cpu.gpr[0] && $scope.displayA) {
            return 'marker marker-a';
        } else if (index === cpu.gpr[1] && $scope.displayB) {
            return 'marker marker-b';
        } else if (index === cpu.gpr[2] && $scope.displayC) {
            return 'marker marker-c';
        } else if (index === cpu.gpr[3] && $scope.displayD) {
            return 'marker marker-d';
        } else {
            return '';
        }
    };
}]);
