#!/bin/bash
# Telegram Bot API sender — DR MAGfield content distribution
# Token: @DrMAGfield_bot (8704934933:AAEbz63kc4EcvPo4-puoeZaWeT1uSZIUXZI)
# Chats:
#   DR MAGfield supergroup: -1003771302334 (default)
#   Keith private: 1544430803
# Usage:
#   ./send-telegram.sh "<message>"          → supergroup
#   ./send-telegram.sh -p <chat_id> <msg> → specify chat
#   ./send-telegram.sh -photo <chat_id> <file> <caption> → send photo

BOT_TOKEN="8704934933:AAEbz63kc4EcvPo4-puoeZaWeT1uSZIUXZI"
DR_MAGFIELD_GROUP="-1003771302334"
KEITH_PRIVATE="1544430803"

MODE="${1}"
shift

if [ "$MODE" = "-photo" ]; then
  CHAT_ID="${1}"
  FILE="${2}"
  CAPTION="${3}"
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto" \
    -F "chat_id=${CHAT_ID}" \
    -F "photo=@${FILE}" \
    -F "caption=${CAPTION}" \
    -F "disable_notification=false" \
    | jq '.ok, .result.message_id, .error_code' 2>/dev/null
elif [ "$MODE" = "-p" ]; then
  CHAT_ID="${1}"
  TEXT="$2"
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=${TEXT}" \
    -d "disable_web_page_preview=true" \
    | jq '.ok, .result.message_id, .error_code' 2>/dev/null
else
  # Default: send to DR MAGfield supergroup
  TEXT="${MODE} $@"
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${DR_MAGFIELD_GROUP}" \
    -d "text=${TEXT}" \
    -d "disable_web_page_preview=true" \
    | jq '.ok, .result.message_id, .error_code' 2>/dev/null
fi
