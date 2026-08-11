#!/usr/bin/env bash
# ============================================================
# sync-media.sh
# Pulls CodeQuest media from the family host and pushes it into
# an S3 bucket you control.
#
# Usage:
#   ./sync-media.sh --bucket my-assets-bucket [options]
#
# Options:
#   --bucket NAME     destination S3 bucket (required)
#   --prefix PATH     key prefix in the bucket, default: codequest-media/
#   --groups LIST     comma separated group ids from media-manifest.json
#                     default: brand,avatars
#                     available: brand,avatars,transformations,clips,event_footage
#   --profile NAME    AWS profile to use
#   --region NAME     AWS region
#   --dry-run         list what would happen, transfer nothing
#   --keep            keep the local download directory afterwards
#
# Examples:
#   ./sync-media.sh --bucket cq-assets --dry-run
#   ./sync-media.sh --bucket cq-assets --groups brand,avatars,clips
#   ./sync-media.sh --bucket cq-assets --groups all --profile codequest
#
# Notes:
#   Needs curl, python3 and the aws cli. Downloads to a temp
#   directory first, verifies each file is non-empty, sets the
#   right content type, then uploads.
#   Re-running is safe. Existing keys are overwritten.
# ============================================================
set -euo pipefail

SRC_BASE="https://altitudeaico.github.io/goteamolatoyes/"
MANIFEST="${MANIFEST:-media-manifest.json}"
BUCKET=""
PREFIX="codequest-media/"
GRP_SEL="brand,avatars"
PROFILE=""
REGION=""
DRY=0
KEEP=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket)  BUCKET="$2"; shift 2 ;;
    --prefix)  PREFIX="$2"; shift 2 ;;
    --groups)  GRP_SEL="$2"; shift 2 ;;
    --profile) PROFILE="$2"; shift 2 ;;
    --region)  REGION="$2"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    --keep)    KEEP=1; shift ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
done

[[ -z "$BUCKET" ]] && { echo "error: --bucket is required" >&2; exit 1; }
[[ -f "$MANIFEST" ]] || { echo "error: $MANIFEST not found. Run from the package directory." >&2; exit 1; }
command -v python3 >/dev/null || { echo "error: python3 is required" >&2; exit 1; }
command -v curl >/dev/null || { echo "error: curl is required" >&2; exit 1; }
[[ $DRY -eq 0 ]] && { command -v aws >/dev/null || { echo "error: aws cli is required" >&2; exit 1; }; }

AWS_ARGS=()
[[ -n "$PROFILE" ]] && AWS_ARGS+=(--profile "$PROFILE")
[[ -n "$REGION" ]]  && AWS_ARGS+=(--region "$REGION")

[[ "$GRP_SEL" == "all" ]] && GRP_SEL="brand,avatars,transformations,clips,event_footage"
PREFIX="${PREFIX%/}/"

WORK="$(mktemp -d)"
cleanup(){ [[ $KEEP -eq 0 ]] && rm -rf "$WORK"; }
trap cleanup EXIT

echo "CodeQuest media sync"
echo "  source      $SRC_BASE"
echo "  destination s3://$BUCKET/$PREFIX"
echo "  groups      $GRP_SEL"
[[ $DRY -eq 1 ]] && echo "  MODE        dry run, nothing will transfer"
echo

TOTAL=0; OK=0; FAIL=0

IFS=',' read -ra GRP_LIST <<< "$GRP_SEL"
for gid in "${GRP_LIST[@]}"; do
  gid="$(echo "$gid" | tr -d ' ')"
  META="$(python3 - "$MANIFEST" "$gid" <<'PY'
import json,sys
m=json.load(open(sys.argv[1]))
g=next((x for x in m["groups"] if x["id"]==sys.argv[2]), None)
if g: print(g["label"]+"\t"+g["suggested_destination"]+"\t"+g.get("notes",""))
PY
)"
  if [[ -z "$META" ]]; then
    echo "  skip: no group named '$gid' in the manifest"
    continue
  fi
  LABEL="$(echo "$META" | cut -f1)"
  DEST="$(echo "$META"  | cut -f2)"
  NOTES="$(echo "$META" | cut -f3)"
  echo "== $LABEL  ->  s3://$BUCKET/${PREFIX}${DEST}"
  [[ -n "$NOTES" ]] && echo "   note: $NOTES"

  while IFS=$'\t' read -r path asname what; do
    TOTAL=$((TOTAL+1))
    fname="$(basename "$path")"
    [[ -n "$asname" && "$asname" != "-" ]] && fname="$asname"
    key="${PREFIX}${DEST}${fname}"

    if [[ $DRY -eq 1 ]]; then
      printf "   would copy  %-34s -> %s\n" "$fname" "$key"
      OK=$((OK+1))
      continue
    fi

    printf "   %-34s " "$fname"
    if ! curl -fsSL --retry 3 --retry-delay 2 -o "$WORK/$fname" "${SRC_BASE}${path}"; then
      echo "DOWNLOAD FAILED"; FAIL=$((FAIL+1)); continue
    fi
    if [[ ! -s "$WORK/$fname" ]]; then
      echo "EMPTY FILE"; FAIL=$((FAIL+1)); continue
    fi

    case "$fname" in
      *.mp4)  ctype="video/mp4" ;;
      *.mov)  ctype="video/quicktime" ;;
      *.png)  ctype="image/png" ;;
      *.jpg|*.jpeg) ctype="image/jpeg" ;;
      *.css)  ctype="text/css" ;;
      *)      ctype="application/octet-stream" ;;
    esac

    if aws s3 cp "$WORK/$fname" "s3://$BUCKET/$key" \
         --content-type "$ctype" \
         --cache-control "public, max-age=31536000, immutable" \
         "${AWS_ARGS[@]}" >/dev/null 2>&1; then
      sz=$(du -h "$WORK/$fname" | cut -f1)
      echo "ok  ($sz)"
      OK=$((OK+1))
    else
      echo "UPLOAD FAILED"
      FAIL=$((FAIL+1))
    fi
    rm -f "$WORK/$fname"
  done < <(python3 - "$MANIFEST" "$gid" <<'PY'
import json,sys
m=json.load(open(sys.argv[1]))
g=next((x for x in m["groups"] if x["id"]==sys.argv[2]), None)
for f in (g["files"] if g else []): print(f["path"]+"\t"+(f.get("as") or "-")+"\t"+f["what"])
PY
)
  echo
done

echo "done. $OK of $TOTAL succeeded, $FAIL failed."
[[ $FAIL -gt 0 ]] && exit 1
exit 0
