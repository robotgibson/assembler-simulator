; Extended features example
; Demonstrates 16-bit ADDC/SUBC math, NOP, and Switch Input (address 255)
; Tip: Click Assemble first, toggle switch 0 ON or OFF, then click Run.

	JMP start

msg_on:  DB "SW0: ON "
	 DB 0
msg_off: DB "SW0: OFF"
	 DB 0

start:
	; 1. 16-bit addition: 0x01FF (511) + 0x0002 (2) = 0x0201 (513)
	MOV A, 0xFF	; Low byte of 511
	MOV B, 0x01	; High byte of 511
	ADD A, 0x02	; Low byte -> 0x01, sets Carry flag
	ADDC B, 0x00	; High byte -> 0x01 + 0x00 + Carry = 0x02

	; 2. 16-bit subtraction with borrow: 0x0201 (513) - 0x0002 (2) = 0x01FF (511)
	SUB A, 0x02	; Low byte -> 0xFF, sets Carry (borrow) flag
	SUBC B, 0x00	; High byte -> 0x02 - 0x00 - Borrow = 0x01

	NOP		; No-operation instruction

	; 3. Read switches 0-7 from address 255 (0xFF) and check bit 0 (switch 0)
	MOV A, [255]
	AND A, 1
	CMP A, 1
	JZ .is_on

	MOV C, msg_off
	JMP .done

.is_on:
	MOV C, msg_on

.done:
	MOV D, 232	; Point to console output
	CALL print
	HLT

print:			; print(C:*from, D:*to)
	PUSH A
	PUSH B
	MOV B, 0
.loop:
	MOV A, [C]
	MOV [D], A
	INC C
	INC D
	CMP B, [C]
	JNZ .loop
	POP B
	POP A
	RET
