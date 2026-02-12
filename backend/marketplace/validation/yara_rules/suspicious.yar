rule Shell_Script
{
    meta:
        description = "Detects Unix shell scripts via shebang"
        severity = "high"
        category = "script"
    strings:
        $shebang1 = "#!/bin/"
        $shebang2 = "#!/usr/"
    condition:
        ($shebang1 at 0) or ($shebang2 at 0)
}

rule PowerShell_Script
{
    meta:
        description = "Detects PowerShell command patterns"
        severity = "high"
        category = "script"
    strings:
        $ps1 = "powershell" nocase
        $ps2 = "Invoke-Expression" nocase
        $ps3 = "IEX(" nocase
        $ps4 = "-EncodedCommand" nocase
    condition:
        2 of ($ps*)
}

rule PHP_Script
{
    meta:
        description = "Detects PHP script tags"
        severity = "high"
        category = "script"
    strings:
        $php = "<?php"
    condition:
        $php at 0
}

rule Suspicious_Strings
{
    meta:
        description = "Detects common backdoor/C2 patterns"
        severity = "medium"
        category = "suspicious"
    strings:
        $cmd1 = "cmd.exe" nocase
        $cmd2 = "/bin/sh" nocase
        $net1 = "socket.connect" nocase
        $net2 = "reverse_tcp" nocase
        $net3 = "bind_shell" nocase
        $crypt = "ransomware" nocase
    condition:
        2 of them
}
