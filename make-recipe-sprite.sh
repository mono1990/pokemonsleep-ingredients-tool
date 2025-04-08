#!/bin/bash

# スプライト出力設定
OUTPUT_NAME="recipe-sprite.png"
CELL_SIZE="256x256"
COLUMNS=8
INPUT_DIR="icons"

# ファイルリストを配列として取得（スペース区切り）
mapfile -t FILE_LIST < <(find "$INPUT_DIR" -type f \( -iname "*.png" -o -iname "*.jpg" \) | sort)

# カウントと行数計算
TOTAL=${#FILE_LIST[@]}
ROWS=$(( (TOTAL + COLUMNS - 1) / COLUMNS ))

echo "🔍 ファイル数: $TOTAL（${COLUMNS}列 × ${ROWS}行）"

# montage 実行（"${FILE_LIST[@]}" に注意！）
montage "${FILE_LIST[@]}" -geometry ${CELL_SIZE}+0+0 -tile ${COLUMNS}x${ROWS} "$OUTPUT_NAME"

# 出力確認
if [ -f "$OUTPUT_NAME" ]; then
  echo "✅ スプライト画像生成成功！保存先: $(realpath "$OUTPUT_NAME")"
else
  echo "❌ スプライト画像の生成に失敗しました"
fi
