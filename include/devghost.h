#ifndef DEVGHOST_H
#define DEVGHOST_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_CMD_LEN 512
#define MAX_ERR_LEN 2048
#define MAX_TEXT_LEN 512

/* Structure representing the captured execution context */
typedef struct {
    char command[MAX_CMD_LEN];
    int exit_code;
    char output[MAX_ERR_LEN];
} ErrorContext;

/* Structure holding the diagnosed root cause and proposed fix */
typedef struct {
    char category[64];
    char title[128];
    char root_cause[MAX_TEXT_LEN];
    char explanation[MAX_TEXT_LEN];
    char fix_cmd[MAX_CMD_LEN];
    char fix_desc[MAX_TEXT_LEN];
    int has_fix;
} Diagnosis;

/* Function Prototypes */
void diagnose_error(const ErrorContext* ctx, Diagnosis* diag);
void render_card(const Diagnosis* diag, const ErrorContext* ctx);
void render_explanation(const Diagnosis* diag, const ErrorContext* ctx);
void prompt_and_execute(const Diagnosis* diag, const ErrorContext* ctx);
void run_demo(void);
void show_status(void);
void install_powershell_hook(void);

#endif /* DEVGHOST_H */
