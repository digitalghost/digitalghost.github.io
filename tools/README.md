# 工具工坊 · 发布工具

本目录存放站点发布所需的构建工具与签名材料。

## 目录内容

| 文件 | 说明 |
| --- | --- |
| `whkt-release.jks` | 《杀戮小队对局台》的发布签名密钥 |

## whkt-release.jks

《杀戮小队对局台》发布版 APK 的签名密钥。**必须随仓库一起保留**：
只要换了密钥，Android 就会拒绝覆盖安装，用户必须先卸载旧版才能装新版。

| 项 | 值 |
| --- | --- |
| 别名 (alias) | `whkt` |
| 密钥库口令 (storepass) | `whkt2024` |
| 密钥口令 (keypass) | `whkt2024` |
| 签名证书 SHA-256 | `5d0cc2f69afc8fb174fd41b74815c47def1a00a3949e5ce5f3cfe12780c3b5c1` |
| 有效期 | 30 年 |

> 这是一把自签名密钥，用于保证升级链连续，不用于任何商业分发或身份认证。

### 重新签名一个 release APK

在 `anroid1st` 项目里构建出 `app-release-unsigned.apk` 之后：

```bash
BT=~/Projects/anroid1st/android-sdk/build-tools/34.0.0
KEY=~/Projects/digitalghost.github.io/tools/whkt-release.jks

# 1. 对齐
$BT/zipalign -p -f 4 app-release-unsigned.apk /tmp/whkt-aligned.apk

# 2. 签名
$BT/apksigner sign \
  --ks "$KEY" --ks-pass pass:whkt2024 --key-pass pass:whkt2024 \
  --ks-key-alias whkt \
  --out ~/Projects/digitalghost.github.io/downloads/WHKT-Battle-Console-v2.0.apk \
  /tmp/whkt-aligned.apk

# 3. 校验
$BT/apksigner verify --print-certs \
  ~/Projects/digitalghost.github.io/downloads/WHKT-Battle-Console-v2.0.apk
```

### 推送到站点

下载文件通过 Git LFS 存放（见仓库根目录 `.gitattributes`）：

```bash
cd ~/Projects/digitalghost.github.io
git add downloads/WHKT-Battle-Console-v2.0.apk
git commit -m "chore: 更新杀戮小队对局台 APK"
git push origin main
```

> ⚠️ GitHub Pages 本身只会吐出 LFS 指针文件（约 130 字节的文本），
> 因此页面上的下载按钮必须指向 `media.githubusercontent.com` 的真实文件地址：
>
> ```
> https://media.githubusercontent.com/media/digitalghost/digitalghost.github.io/main/downloads/WHKT-Battle-Console-v2.0.apk
> ```
