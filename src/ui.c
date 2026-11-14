#include "../include/devghost.h"

#ifdef _WIN32
#include <windows.h>
static void enable_virtual_terminal(void) {
    HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
    if (hOut == INVALID_HANDLE_VALUE) return;
    DWORD dwMode = 0;
    if (!GetConsoleMode(hOut, &dwMode)) return;
    dwMode |= 0x0004; // ENABLE_VIRTUAL_TERMINAL_PROCESSING
    SetConsoleMode(hOut, dwMode);
}
#else
static void enable_virtual_terminal(void) {}
#endif

void render_card(const Diagnosis* diag, const ErrorContext* ctx) {
    enable_virtual_terminal();

    printf("\n");
    printf("\033[35m+------------------------------------------------------------------------------+\033[0m\n");
    printf("\033[35m|\033[0m  \033[1;37;45m 👻 DevGhost (C-Native) \033[0m  \033[1;31m✖ Command Failed (Exit Code: %d)\033[0m\n", ctx->exit_code);
    printf("\033[35m|\033[0m\n");
    printf("\033[35m|\033[0m  \033[1;37mCommand:\033[0m    \033[1;33m%s\033[0m\n", ctx->command);
    printf("\033[35m|\033[0m  \033[1;37mIssue:\033[0m      \033[1;37m%s\033[0m\n", diag->title);
    printf("\033[35m|\033[0m  \033[1;37mRoot Cause:\033[0m \033[90m%s\033[0m\n", diag->root_cause);

    if (diag->has_fix) {
        printf("\033[35m|\033[0m\n");
        printf("\033[35m|\033[0m  \033[1;32m✔ Suggested Fix:\033[0m\n");
        printf("\033[35m|\033[0m    \033[1;36m%s\033[0m\n", diag->fix_cmd);
        printf("\033[35m|\033[0m    \033[90m%s\033[0m\n", diag->fix_desc);
    }

    printf("\033[35m|\033[0m  ----------------------------------------------------------------------------\n");
    if (diag->has_fix) {
        printf("\033[35m|\033[0m  \033[1;32m[Enter]\033[0m Run Fix   \033[1;33m[e]\033[0m Explanation   \033[90m[q]\033[0m Dismiss\n");
    } else {
        printf("\033[35m|\033[0m  \033[1;33m[e]\033[0m Explanation   \033[90m[q]\033[0m Dismiss\n");
    }
    printf("\033[35m+------------------------------------------------------------------------------+\033[0m\n\n");
}

void render_explanation(const Diagnosis* diag, const ErrorContext* ctx) {
    printf("\n\033[1;36m--- 🔍 Deep Dive Diagnosis (C-Engine) ----------------------\033[0m\n");
    printf("\033[1mCategory:\033[0m    %s\n", diag->category);
    printf("\033[1mExplanation:\033[0m %s\n", diag->explanation);
    if (strlen(ctx->output) > 0) {
        printf("\n\033[1mCaptured Stderr:\033[0m\n\033[90m%s\033[0m\n", ctx->output);
    }
    printf("\033[1;36m------------------------------------------------------------\033[0m\n\n");
}
