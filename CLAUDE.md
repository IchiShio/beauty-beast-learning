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
edge-tts（MS Edge TTS、`ja-JP-NanamiNeural`）で生成。pip install edge-tts 必要。

```bash
cd ~/projects/claude/beauty-beast-learning/audio
VOICE="ja-JP-NanamiNeural"
# カタカナ語
edge-tts --voice $VOICE --text "ビースト" --write-media kata_beast.mp3
edge-tts --voice $VOICE --text "ベル" --write-media kata_bell.mp3
edge-tts --voice $VOICE --text "ボールルーム" --write-media kata_ballroom.mp3
edge-tts --voice $VOICE --text "ダンス" --write-media kata_dance.mp3
edge-tts --voice $VOICE --text "パーティー" --write-media kata_party.mp3
edge-tts --voice $VOICE --text "ローズ" --write-media kata_rose.mp3
edge-tts --voice $VOICE --text "レッドドレス" --write-media kata_red_dress.mp3
edge-tts --voice $VOICE --text "ブルードレス" --write-media kata_blue_dress.mp3
# 数字1〜20
for i in $(seq 1 20); do
  edge-tts --voice $VOICE --text "${i}" --write-media num_${i}.mp3
done
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
