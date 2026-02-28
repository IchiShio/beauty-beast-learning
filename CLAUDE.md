# CLAUDE.md - beauty-beast-learning

## プロジェクト概要
Beauty and Beastの世界観をテーマにした小1準備の知育WebアプリPWA。
カタカナ読み書き（6語）と算数基礎（1〜20・足し算）を学ぶ。
対象: 新小学1年生（6〜7歳）、iPad/タブレット向けportrait PWA。

## 技術スタック
- 純粋HTML/CSS/JavaScript（ビルドなし）
- Web Audio API（BGM/SE 手続き生成）
- HTMLAudioElement（単語MP3再生）
- Canvas API（カタカナ手書きトレース）
- PWA（manifest + Service Worker）
- GitHub Pages ホスティング

## ディレクトリ構成
| ファイル | 役割 |
|----------|------|
| `index.html` | 全UIのDOMテンプレート（divスクリーン管理） |
| `app.js` | ゲームロジック全体（BBGameクラス） |
| `style.css` | fairy-taleテーマ（gold/purple/rose配色） |
| `sw.js` | Service Worker（オフラインキャッシュ） |
| `manifest.json` | PWA設定（portrait, theme_color: #2D1B69） |
| `icon-192.png` | PWAアイコン192px |
| `icon-512.png` | PWAアイコン512px |
| `audio/` | MP3音声ファイル（単語8個 + 数字20個） |

## 音声ファイル生成コマンド
```bash
cd ~/projects/claude/beauty-beast-learning/audio
# カタカナ語
say -v Kyoko -o beast.aiff "ビースト" && ffmpeg -i beast.aiff -codec:a libmp3lame -qscale:a 4 kata_beast.mp3 -y
say -v Kyoko -o bell.aiff "ベル" && ffmpeg -i bell.aiff -codec:a libmp3lame -qscale:a 4 kata_bell.mp3 -y
say -v Kyoko -o ballroom.aiff "ボールルーム" && ffmpeg -i ballroom.aiff -codec:a libmp3lame -qscale:a 4 kata_ballroom.mp3 -y
say -v Kyoko -o dance.aiff "ダンス" && ffmpeg -i dance.aiff -codec:a libmp3lame -qscale:a 4 kata_dance.mp3 -y
say -v Kyoko -o party.aiff "パーティー" && ffmpeg -i party.aiff -codec:a libmp3lame -qscale:a 4 kata_party.mp3 -y
say -v Kyoko -o rose.aiff "ローズ" && ffmpeg -i rose.aiff -codec:a libmp3lame -qscale:a 4 kata_rose.mp3 -y
say -v Kyoko -o reddress.aiff "レッドドレス" && ffmpeg -i reddress.aiff -codec:a libmp3lame -qscale:a 4 kata_red_dress.mp3 -y
say -v Kyoko -o bluedress.aiff "ブルードレス" && ffmpeg -i bluedress.aiff -codec:a libmp3lame -qscale:a 4 kata_blue_dress.mp3 -y
# 数字1〜20
for i in $(seq 1 20); do
  say -v Kyoko -o n${i}.aiff "${i}" && ffmpeg -i n${i}.aiff -codec:a libmp3lame -qscale:a 4 num_${i}.mp3 -y
done
rm -f *.aiff
```

## 状態管理（localStorage）
```
STORAGE_KEY = 'bblearn_v1'
{
  module1: { words_mastered: [], key_earned: false, story_page: 0 },
  module2: {
    room_stars: { ballroom:0, dining:0, library:0, westwing:0 },
    rooms_unlocked: ['ballroom'],
    task_progress: {}
  },
  settings: { bgmVol:0.5, seVol:0.7 }
}
```

## 開発ルール
- 変更後は必ず `node --check app.js` で構文確認
- コードの変更後はコミット＆プッシュまで自動で行う
- sw.jsの CACHE_NAME をインクリメントしてキャッシュ強制更新（v1→v2...）
- APIキーなし（外部サービス未使用）
