# 我们的星页 · OUR STAR PAGE

一个送给"刚在一起的她"的单页小网站：干净温柔、不花哨、加载很轻，手机打开也好看。

打开后的顺序是：**开场 → 我们俩（生日 / 星座 / 大爱心）→ 封底（照片）**。

> 原来的「专属小测试」「秘密留言板」「01 心动时间轴（含实时计时）」三块都已经按要求删掉，
> 相关的 HTML、CSS、JS 和配置一并清干净了，不留死代码。

## 打开方式

直接双击 `index.html` 就能看（无需服务器、无需构建、无外部依赖、零网络请求）。

想在手机上看，用本地服务器更方便：

```powershell
cd star-page
python -m http.server 8000
# 电脑访问 http://localhost:8000/
# 手机连同一个 Wi-Fi，访问 http://电脑的局域网IP:8000/
```

## 要改的东西，全在一个文件里

**`js/content.js`** —— 文字、日期都在这儿，改完刷新即可。

| 字段 | 说明 |
| --- | --- |
| `startLabel` | 封面上那行日期，想怎么写都行（现在是 `2026.10.06`） |
| `pageTitle` | 浏览器标签页上的标题 |
| `cover.line` | 开场那句话，想换行就写 `\n` |
| `cover.datePrefix` | 日期前面那三个字（现在是"故事开始于"） |
| `cover.hint` | "轻触任意位置…"那句提示 |
| `couple.kicker` | 「我们俩」那栏左上角的小标签 |
| `couple.title` / `couple.sub` | 那一栏的标题和小字；**留空就不显示**（现在就是空的） |
| `couple.him` / `couple.her` | 左右两侧的符号、生日、星座 |
| `finale.*` | 封底那句话、配文、署名、照片路径 |
| `footer` | 页脚那行小字 |

## 「我们俩」那一栏

左边是男生（金色 ♂），右边是女生（粉色 ♀），中间是一个会轻轻跳动的大爱心。
内容都在 `js/content.js` 的 `couple` 里：

```js
couple: {
  kicker: "我们俩",
  title: "",        // 留空就不显示，想写标题填上字即可
  sub: "",          // 同上
  him: { symbol: "♂", label: "生日", date: "11月24日", sign: "射手座" },
  her: { symbol: "♀", label: "生日", date: "2月2日",  sign: "处女座" }
}
```

- 想换符号、日期、星座：改这几行字就行；`label` 留空字符串 `""` 就不显示"生日"两个字。
- 想左右对调：把 `him` 和 `her` 里的内容互换。
- 手机上这一栏会自动竖过来，变成 ♂ → ♥ → ♀ 的顺序。

## 换成自己的照片

1. 把图片丢进 `assets/` 文件夹（横版最好，1600px 宽左右）。
2. 改 `js/content.js` 里 `finale.photo` 的路径，例如 `"assets/我们的照片.jpg"`。
3. 照片没放好也不会白屏——封底会显示一句提示，告诉你该改哪里。

> 现在封底用的是 `assets/our-photo.jpg`（已从原图压到 1600×720、82KB，方便手机加载）。

## 文件结构

```
index.html          页面结构
css/style.css       全部样式（配色、星空、卡片、我们俩、动效）
js/content.js       ★ 所有文字内容，只改这个文件
js/app.js           交互：星空、进入、我们俩、飘心、音效、大图、章节导航
assets/our-photo.jpg 封底照片
deploy.ps1          一键部署到 GitHub Pages
```

整站约 135 KB（其中照片 82 KB），不请求任何外部资源，打开很快。

## 交互一览

| 操作 | 效果 |
| --- | --- |
| 点击 / 轻触封面（或按 Enter、空格） | 暖色爱心散开，标题逐字浮出，进入正文 |
| 滚动 | 卡片逐个淡入；右上角圆点显示当前在第几章，点一下跳过去 |
| 点左上角站名 / 封底「回到开头」 | 回到第一屏 |
| 点封底照片 | 打开大图（Esc 或点背景关闭） |
| 右上角「音效」 | 开关合成音效（Web Audio 实时合成，不加载任何音频文件） |

## 可以调的地方

- **配色**：`css/style.css` 顶部的 `:root` 变量（`--rose` 玫瑰粉、`--gold` 暖金、`--ink` 文字色、`--bg` 底色）。
- **封面标题字号**：`.cover-line` 的 `font-size`。
- **我们俩的排版**：`.pair` 那一段；`@media (max-width:559px)` 里控制手机上竖排。
- **爱心大小**：`.pair-heart` 的 `width`。
- **圆角 / 卡片**：`:root` 里的 `--radius`、`--card`。
- 已适配手机、刘海屏安全区，以及系统"减少动态效果"偏好（开了之后动画会自动安静下来）。

## 部署到 GitHub Pages

本目录已带一个 `deploy.ps1`：

```powershell
$env:GH_TOKEN = "ghp_你的token"      # 在 https://github.com/settings/tokens 生成，勾选 repo
pwsh -File deploy.ps1
```

它会自动建仓库、上传整个文件夹（会自动带上你后来加进 `assets/` 的照片）、开启 Pages，
最后打印网站地址。重复执行 = 覆盖上传一个新版本，用来以后更新网站。

> 注意：从别处拷进来的图片可能带**只读属性**，会导致脚本写不进去。有问题先执行：
> `Get-ChildItem assets -File | ForEach-Object { $_.IsReadOnly = $false }`
