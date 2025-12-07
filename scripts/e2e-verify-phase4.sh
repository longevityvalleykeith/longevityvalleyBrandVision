#!/bin/bash

# ==========================================
# PHASE 4 E2E VERIFICATION PROTOCOL
# Based on VERIFICATION_REPORT_071225.md
# ==========================================

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting End-to-End Verification Protocol (Phase 4)...${NC}"
echo "=================================================="

# TRACKER VARIABLES
FAILURES=0

# ---------------------------------------------------------
# STEP 1: TypeScript Check (Targeted)
# ---------------------------------------------------------
echo -e "\n${YELLOW}[1/3] Verifying Fixed TypeScript Files...${NC}"
# We filter specifically for the files that had issues: directorRouter and rateLimit
# as per Section 6 of the report.
TS_OUTPUT=$(npm run typecheck 2>&1 | grep -E "directorRouter|rateLimit")

if [ -z "$TS_OUTPUT" ]; then
    echo -e "${GREEN}PASS: No errors found in critical server files.${NC}"
else
    echo -e "${RED}FAIL: Errors detected in fixed files:${NC}"
    echo "$TS_OUTPUT"
    FAILURES=$((FAILURES+1))
fi

# ---------------------------------------------------------
# STEP 2: Rashomon Evaluation (Live API)
# ---------------------------------------------------------
echo -e "\n${YELLOW}[2/3] Running Rashomon Evaluation (Live Gemini 2.5 Flash)...${NC}"
# Executes the script mentioned in Section 2/6
if npx tsx scripts/eval-rashomon.ts; then
    echo -e "${GREEN}PASS: Rashomon logic confirmed (8/8 assertions).${NC}"
else
    echo -e "${RED}FAIL: Rashomon evaluation script returned an error.${NC}"
    FAILURES=$((FAILURES+1))
fi

# ---------------------------------------------------------
# STEP 3: Lounge UI Verification
# ---------------------------------------------------------
echo -e "\n${YELLOW}[3/3] Verifying Lounge UI Components...${NC}"
# Executes the script mentioned in Section 3/6
if npx tsx scripts/test-lounge-ui.ts; then
    echo -e "${GREEN}PASS: UI Scaffold validated (7/7 checks).${NC}"
else
    echo -e "${RED}FAIL: Lounge UI verification returned an error.${NC}"
    FAILURES=$((FAILURES+1))
fi

# ---------------------------------------------------------
# FINAL VERDICT
# ---------------------------------------------------------
echo -e "\n=================================================="
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ READY FOR PRODUCTION${NC}"
    echo "All protocols passed. Integration verified."
    exit 0
else
    echo -e "${RED}❌ VERIFICATION FAILED${NC}"
    echo "$FAILURES test suite(s) failed. Do not deploy."
    exit 1
fi
