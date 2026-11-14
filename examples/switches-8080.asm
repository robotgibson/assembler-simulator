; Intel 8080 Real-Time Input Switches Demo
; Toggle switches 0-7 while running to update the Output display live!

loop:
        IN 0            ; Read switches 0-7 into A (or LDA 255)
        ADI 48          ; Convert 0..9 to ASCII '0'..'9'
        STA 232         ; Display at first Output cell (0xE8)
        JMP loop        ; Poll continuously in real time
