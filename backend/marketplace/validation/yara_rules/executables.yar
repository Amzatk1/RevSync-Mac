rule PE_Executable
{
    meta:
        description = "Detects Windows PE executables (MZ header)"
        severity = "critical"
        category = "executable"
    strings:
        $mz = { 4D 5A }
    condition:
        $mz at 0
}

rule ELF_Binary
{
    meta:
        description = "Detects ELF binaries"
        severity = "critical"
        category = "executable"
    strings:
        $elf = { 7F 45 4C 46 }
    condition:
        $elf at 0
}

rule MachO_Binary
{
    meta:
        description = "Detects Mach-O binaries (all architectures)"
        severity = "critical"
        category = "executable"
    strings:
        $macho32    = { FE ED FA CE }
        $macho64    = { FE ED FA CF }
        $macho32_r  = { CE FA ED FE }
        $macho64_r  = { CF FA ED FE }
        $fat        = { CA FE BA BE }
    condition:
        ($macho32 at 0) or ($macho64 at 0) or
        ($macho32_r at 0) or ($macho64_r at 0) or
        ($fat at 0)
}
