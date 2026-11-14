#include "../include/devghost.h"

void run_demo(void) {
    printf("\n\033[1;36m--- 👻 Running DevGhost Native C Demo -----------------------\033[0m\n");
    printf("\033[90mSimulating real crash: 'npm run dev' failing on port 3000...\033[0m\n");

    ErrorContext ctx;
    memset(&ctx, 0, sizeof(ErrorContext));
    strncpy(ctx.command, "npm run dev", sizeof(ctx.command) - 1);
    ctx.exit_code = 1;
    strncpy(ctx.output, "Error: listen EADDRINUSE: address already in use :::3000", sizeof(ctx.output) - 1);

    Diagnosis diag;
    diagnose_error(&ctx, &diag);
    render_card(&diag, &ctx);
    prompt_and_execute(&diag, &ctx);
}

void show_status(void) {
    printf("\n\033[1;35m👻 DevGhost Status (C-Native Systems Engine)\033[0m\n\n");
    printf("\033[1mArchitecture:\033[0m   Native C (C99 Standard)\n");
    printf("\033[1mBinary:\033[0m         devghost.exe (Zero runtime dependencies)\n");
    printf("\033[1mLatency:\033[0m        Sub-millisecond heuristic engine\n");
    printf("\033[1mPlatform:\033[0m       Windows Win32 / POSIX compatible\n\n");
    printf("Run \033[1;36mdevghost demo\033[0m to test interactive error interception!\n\n");
}

void install_powershell_hook(void) {
    printf("\n\033[1;35m👻 Setting up DevGhost Hook in PowerShell Profile...\033[0m\n\n");
    printf("Add the following hook to your PowerShell $PROFILE:\n\n");
    printf("\033[36mfunction Global:prompt {\n");
    printf("    $lastExit = $LASTEXITCODE\n");
    printf("    if ($lastExit -ne $null -and $lastExit -ne 0) {\n");
    printf("        $h = Get-History -Count 1 -ErrorAction SilentlyContinue\n");
    printf("        if ($h -and -not ($h.CommandLine -match '^devghost')) {\n");
    printf("            devghost --cmd \"$($h.CommandLine)\" --code \"$lastExit\"\n");
    printf("        }\n");
    printf("    }\n");
    printf("    \"PS $($executionContext.SessionState.Path.CurrentLocation)> \"\n");
    printf("}\033[0m\n\n");
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        printf("\n\033[1;35m👻 DevGhost - Autonomous Shell Interceptor (C-Native)\033[0m\n");
        printf("Usage:\n");
        printf("  devghost demo                   Run simulated crash diagnosis\n");
        printf("  devghost status                 Show runtime status and engine info\n");
        printf("  devghost setup                  Show PowerShell shell integration hook\n");
        printf("  devghost --cmd <cmd> --code <code> [--err <err>]  Diagnose real crash\n\n");
        return 0;
    }

    if (strcmp(argv[1], "demo") == 0) {
        run_demo();
        return 0;
    }

    if (strcmp(argv[1], "status") == 0) {
        show_status();
        return 0;
    }

    if (strcmp(argv[1], "setup") == 0) {
        install_powershell_hook();
        return 0;
    }

    // Parse command line arguments
    ErrorContext ctx;
    memset(&ctx, 0, sizeof(ErrorContext));
    ctx.exit_code = 1;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--cmd") == 0 && i + 1 < argc) {
            strncpy(ctx.command, argv[++i], sizeof(ctx.command) - 1);
        } else if (strcmp(argv[i], "--code") == 0 && i + 1 < argc) {
            ctx.exit_code = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--err") == 0 && i + 1 < argc) {
            strncpy(ctx.output, argv[++i], sizeof(ctx.output) - 1);
        }
    }

    if (strlen(ctx.command) == 0) {
        printf("Error: Missing --cmd argument.\n");
        return 1;
    }

    Diagnosis diag;
    diagnose_error(&ctx, &diag);
    render_card(&diag, &ctx);
    prompt_and_execute(&diag, &ctx);

    return 0;
}
