#include "../include/devghost.h"

#ifdef _WIN32
#include <conio.h>
#else
#include <unistd.h>
static int _getch(void) {
    return getchar();
}
#endif

void prompt_and_execute(const Diagnosis* diag, const ErrorContext* ctx) {
    while (1) {
        int ch = _getch();
        
        // Enter key pressed (\r or \n)
        if (ch == 13 || ch == 10) {
            if (diag->has_fix && strlen(diag->fix_cmd) > 0) {
                printf("\033[1;32m⚡ Executing fix:\033[0m \033[1;36m%s\033[0m\n\n", diag->fix_cmd);
                int ret = system(diag->fix_cmd);
                if (ret == 0) {
                    printf("\n\033[1;32m✔ Fix completed successfully!\033[0m\n\n");
                } else {
                    printf("\n\033[1;31m✖ Fix exited with return code %d\033[0m\n\n", ret);
                }
            }
            break;
        }

        // 'e' or 'E' key pressed
        if (ch == 'e' || ch == 'E') {
            render_explanation(diag, ctx);
            if (diag->has_fix) {
                printf("\033[1;32m[Enter]\033[0m Run Fix   \033[90m[q]\033[0m Dismiss: ");
            } else {
                printf("\033[90m[q]\033[0m Dismiss: ");
            }
            continue;
        }

        // 'q', 'Q', Escape (27), or Ctrl+C (3)
        if (ch == 'q' || ch == 'Q' || ch == 27 || ch == 3) {
            printf("\033[90mDismissed DevGhost.\033[0m\n\n");
            break;
        }
    }
}
