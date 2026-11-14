; Intel 8080 Hello World example
; Writes "Hello World!" to memory-mapped output (232 / 0xE8)

        JMP start
hello:  DB "Hello World!"
        DB 0

start:
        LXI H, hello    ; HL points to source string
        LXI D, 232      ; DE points to console output (0xE8)
        CALL print
        HLT

print:
        MOV A, M        ; Load byte at [HL] into A
        CPI 0           ; Check for null terminator
        RZ              ; Return if zero
        STAX D          ; Store A at [DE]
        INX H           ; HL++
        INX D           ; DE++
        JMP print
