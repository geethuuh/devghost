#include "../include/devghost.h"
#include <ctype.h>

/* Helper function to perform case-insensitive substring search */
static const char* stristr(const char* haystack, const char* needle) {
    if (!haystack || !needle) return NULL;
    size_t needle_len = strlen(needle);
    if (needle_len == 0) return haystack;

    for (; *haystack; haystack++) {
        size_t i;
        for (i = 0; i < needle_len; i++) {
            if (tolower((unsigned char)haystack[i]) != tolower((unsigned char)needle[i])) {
                break;
            }
        }
        if (i == needle_len) return haystack;
    }
    return NULL;
}

/* Helper to extract a single quoted token like 'express' from string */
static int extract_quoted(const char* text, const char* pattern, char* out, size_t max_len) {
    const char* pos = strstr(text, pattern);
    if (!pos) return 0;
    
    pos += strlen(pattern);
    while (*pos && (*pos == ' ' || *pos == '\'' || *pos == '\"')) pos++;
    
    size_t idx = 0;
    while (*pos && *pos != '\'' && *pos != '\"' && *pos != '\n' && *pos != ' ' && idx < max_len - 1) {
        out[idx++] = *pos++;
    }
    out[idx] = '\0';
    return (idx > 0);
}

void diagnose_error(const ErrorContext* ctx, Diagnosis* diag) {
    memset(diag, 0, sizeof(Diagnosis));
    diag->has_fix = 0;

    char combined[MAX_CMD_LEN + MAX_ERR_LEN + 10];
    snprintf(combined, sizeof(combined), "%s %s", ctx->command, ctx->output);

    /* 1. Port Conflict (EADDRINUSE) */
    if (strstr(combined, "EADDRINUSE") || stristr(combined, "address already in use") || stristr(combined, "port is already in use")) {
        strncpy(diag->category, "port_conflict", sizeof(diag->category) - 1);
        
        // Try extracting port number
        char port[16] = "3000";
        const char* p = strstr(combined, ":::");
        if (!p) p = strstr(combined, ":");
        if (p) {
            p++;
            while (*p && !isdigit((unsigned char)*p)) p++;
            int i = 0;
            while (*p && isdigit((unsigned char)*p) && i < 15) {
                port[i++] = *p++;
            }
            if (i > 0) port[i] = '\0';
        }

        snprintf(diag->title, sizeof(diag->title), "Port %s Conflict (EADDRINUSE)", port);
        snprintf(diag->root_cause, sizeof(diag->root_cause), "Another background process is actively bound to local port %s.", port);
        snprintf(diag->explanation, sizeof(diag->explanation), "Your application cannot listen on port %s because an orphan process or background server is holding the port.", port);
        snprintf(diag->fix_cmd, sizeof(diag->fix_cmd), "npx kill-port %s", port);
        snprintf(diag->fix_desc, sizeof(diag->fix_desc), "Terminate the process occupying port %s.", port);
        diag->has_fix = 1;
        return;
    }

    /* 2. Missing Module (Cannot find module) */
    char pkg[128];
    if (extract_quoted(combined, "Cannot find module", pkg, sizeof(pkg)) ||
        extract_quoted(combined, "Module not found", pkg, sizeof(pkg))) {
        
        strncpy(diag->category, "missing_dependency", sizeof(diag->category) - 1);
        snprintf(diag->title, sizeof(diag->title), "Missing Dependency: '%s'", pkg);
        snprintf(diag->root_cause, sizeof(diag->root_cause), "Package '%s' is imported in code but not installed in node_modules.", pkg);
        snprintf(diag->explanation, sizeof(diag->explanation), "The runtime cannot find '%s'. Installing this dependency will resolve the crash.", pkg);
        snprintf(diag->fix_cmd, sizeof(diag->fix_cmd), "npm install %s", pkg);
        snprintf(diag->fix_desc, sizeof(diag->fix_desc), "Install '%s' and save it to package.json.", pkg);
        diag->has_fix = 1;
        return;
    }

    /* 3. Git No Upstream Branch */
    if (strstr(combined, "has no upstream branch")) {
        strncpy(diag->category, "git_issue", sizeof(diag->category) - 1);
        strncpy(diag->title, "Git Branch Has No Remote Tracking", sizeof(diag->title) - 1);
        strncpy(diag->root_cause, "Local branch has not been linked to a remote tracking branch on origin.", sizeof(diag->root_cause) - 1);
        strncpy(diag->explanation, "Git requires explicit upstream configuration before pushing newly created local branches.", sizeof(diag->explanation) - 1);
        strncpy(diag->fix_cmd, "git push --set-upstream origin main", sizeof(diag->fix_cmd) - 1);
        strncpy(diag->fix_desc, "Push current branch and establish remote tracking.", sizeof(diag->fix_desc) - 1);
        diag->has_fix = 1;
        return;
    }

    /* 4. Common CLI Command Typos */
    if (strncmp(ctx->command, "gti", 3) == 0) {
        strncpy(diag->category, "command_not_found", sizeof(diag->category) - 1);
        strncpy(diag->title, "Command Typo: 'gti' -> 'git'", sizeof(diag->title) - 1);
        strncpy(diag->root_cause, "'gti' is not recognized. Did you mean 'git'?", sizeof(diag->root_cause) - 1);
        snprintf(diag->fix_cmd, sizeof(diag->fix_cmd), "git %s", ctx->command + 3);
        strncpy(diag->fix_desc, "Run the corrected git command.", sizeof(diag->fix_desc) - 1);
        diag->has_fix = 1;
        return;
    }

    if (strncmp(ctx->command, "npn", 3) == 0) {
        strncpy(diag->category, "command_not_found", sizeof(diag->category) - 1);
        strncpy(diag->title, "Command Typo: 'npn' -> 'npm'", sizeof(diag->title) - 1);
        strncpy(diag->root_cause, "'npn' is not recognized. Did you mean 'npm'?", sizeof(diag->root_cause) - 1);
        snprintf(diag->fix_cmd, sizeof(diag->fix_cmd), "npm %s", ctx->command + 3);
        strncpy(diag->fix_desc, "Run the corrected npm command.", sizeof(diag->fix_desc) - 1);
        diag->has_fix = 1;
        return;
    }

    /* 5. Missing Python Module */
    char py_pkg[128];
    if (extract_quoted(combined, "No module named", py_pkg, sizeof(py_pkg))) {
        strncpy(diag->category, "missing_dependency", sizeof(diag->category) - 1);
        snprintf(diag->title, sizeof(diag->title), "Missing Python Module: '%s'", py_pkg);
        snprintf(diag->root_cause, sizeof(diag->root_cause), "Python module '%s' is not installed in the active environment.", py_pkg);
        snprintf(diag->fix_cmd, sizeof(diag->fix_cmd), "pip install %s", py_pkg);
        snprintf(diag->fix_desc, sizeof(diag->fix_desc), "Install '%s' using pip.", py_pkg);
        diag->has_fix = 1;
        return;
    }

    /* 6. Default Fallback */
    strncpy(diag->category, "general_runtime", sizeof(diag->category) - 1);
    strncpy(diag->title, "Command Failed with Non-Zero Exit Code", sizeof(diag->title) - 1);
    snprintf(diag->root_cause, sizeof(diag->root_cause), "Process exited with failure code %d.", ctx->exit_code);
    strncpy(diag->explanation, "The command terminated unexpectedly. Inspect stderr output above for details.", sizeof(diag->explanation) - 1);
    diag->has_fix = 0;
}
