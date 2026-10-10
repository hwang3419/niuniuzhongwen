/**
 * 马立平中文教材一年级生字卡数据库。
 * 依据马立平中文官方《1年级生字表》：第一单元 105 字、第二单元 95 字、
 * 第三单元按官方生字表逐字录入（当前公开表中列出 102 字），共 302 个生字；每个单元按课文分组。
 */

const OFFICIAL_UNITS = [
  {
    id: 'unit-1', book: '一年级 · 第一单元', badge: '第1单元 · 105字', color: '#FF7675',
    title: '第一单元：眼睛、耳朵与生活',
    description: '按《眼睛》至《算一算》的教材顺序学习 105 个生字。',
    lessons: [
      ['眼睛', '眼 睛 上 下 中 间 一 边 毛 颗 黑 葡 萄 口 目 嘴 鼻 子'],
      ['耳朵', '耳 朵 左 右 片 座 山 两 看 不 见 前 后'],
      ['手', '手 十 个 小 朋 友 你 我 大 家 都 有 五 在 只 会 做 事 开 脚 头 男 女'],
      ['萝卜', '萝 卜 红 绿 公 鸡 尾 巴 钻 到 地 底 黄 蓝'],
      ['花生', '花 生 麻 屋 帐 里 面 睡 白 胖 坐 立 走'],
      ['一去二三里', '二 三 四 六 七 八 九 去 路 门 树 多 少'],
      ['算一算', '算 棵 共 鸟 飞 还 剩 几 加 减 比']
    ]
  },
  {
    id: 'unit-2', book: '一年级 · 第二单元', badge: '第2单元 · 95字', color: '#00B894',
    title: '第二单元：雨、镜子与小动物',
    description: '按《雨》至《一头牛》的教材顺序学习 95 个生字。',
    lessons: [
      ['雨', '雨 千 万 条 线 掉 进 水 风 云 雪'],
      ['镜子', '镜 他 也 哭 笑 脸 脏 就 知 道 爸 妈 爱'],
      ['袋鼠', '袋 鼠 奇 怪 好 胸 挂 放 果 菜 娃 爬 来 米 田 石 木 土'],
      ['画', '画 远 色 近 听 无 声 春 人'],
      ['小蝌蚪', '蝌 蚪 细 身 脑 长 着 变 啦 了 腿 脱 衣 服 换 裤 褂 咦 成 青 蛙'],
      ['弯弯的月亮', '弯 的 月 亮 船 尖 闪 星 天 日 火'],
      ['一头牛', '牛 匹 马 件 羊 群 鸭 桃 百 鱼 虫 草']
    ]
  },
  {
    id: 'unit-3', book: '一年级 · 第三单元', badge: '第3单元 · 102字', color: '#0984E3',
    title: '第三单元：小山羊、落叶与故事',
    description: '按《小山羊》至《小猴子下山》的教材顺序学习 105 个生字。',
    lessons: [
      ['小山羊', '和 请 吃 说 谢 猫 狗 骨 同'],
      ['种鱼', '种 阿 姨 把 玉 秋 收 很 叔 它 想 呢'],
      ['落叶', '落 叶 吹 气 凉 从 枝 躲 当 作 沟 蚂 蚁 河 游 过 藏 伞 顶 燕 低 信 们 要 南 方'],
      ['下雪的时候', '时 候 冬 飘 起 出 玩 跑 留 印 对 这 是 那 梅 竹'],
      ['乌鸦喝水', '乌 鸦 喝 渴 处 找 瓶 可 高 着 怎 么 办 法 慢 升'],
      ['小猴子下山', '猴 又 非 常 兴 摘 往 拿 满 扔 西 瓜 圆 抱 回 兔 蹦 跳 真 追 啊 林 空']
    ]
  }
];

const PINYIN = `
眼 yǎn 睛 jīng 上 shàng 下 xià 中 zhōng 间 jiān 一 yī 边 biān 毛 máo 颗 kē 黑 hēi 葡 pú 萄 táo 口 kǒu 目 mù 嘴 zuǐ 鼻 bí 子 zǐ 田 tián 人 rén
耳 ěr 朵 duǒ 左 zuǒ 右 yòu 片 piàn 座 zuò 山 shān 两 liǎng 看 kàn 不 bù 见 jiàn 前 qián 后 hòu
手 shǒu 十 shí 个 gè 小 xiǎo 朋 péng 友 yǒu 你 nǐ 我 wǒ 大 dà 家 jiā 都 dōu 有 yǒu 五 wǔ 在 zài 只 zhī 会 huì 做 zuò 事 shì 开 kāi 脚 jiǎo 头 tóu 男 nán 女 nǚ
萝 luó 卜 bo 红 hóng 绿 lǜ 公 gōng 鸡 jī 尾 wěi 巴 bā 钻 zuān 到 dào 地 dì 底 dǐ 黄 huáng 蓝 lán
花 huā 生 shēng 麻 má 屋 wū 帐 zhàng 里 lǐ 面 miàn 睡 shuì 白 bái 胖 pàng 坐 zuò 立 lì 走 zǒu
二 èr 三 sān 四 sì 六 liù 七 qī 八 bā 九 jiǔ 去 qù 路 lù 门 mén 树 shù 多 duō 少 shǎo 算 suàn 棵 kē 共 gòng 鸟 niǎo 飞 fēi 还 hái 剩 shèng 几 jǐ 加 jiā 减 jiǎn 比 bǐ
雨 yǔ 千 qiān 万 wàn 条 tiáo 线 xiàn 掉 diào 进 jìn 水 shuǐ 风 fēng 云 yún 雪 xuě 镜 jìng 他 tā 也 yě 哭 kū 笑 xiào 脸 liǎn 脏 zāng 就 jiù 知 zhī 道 dào 爸 bà 妈 mā 爱 ài
袋 dài 鼠 shǔ 奇 qí 怪 guài 好 hǎo 胸 xiōng 挂 guà 放 fàng 果 guǒ 菜 cài 娃 wá 爬 pá 来 lái 米 mǐ 石 shí 木 mù 土 tǔ 画 huà 远 yuǎn 色 sè 近 jìn 听 tīng 无 wú 声 shēng 春 chūn
蝌 kē 蚪 dǒu 细 xì 身 shēn 脑 nǎo 长 cháng 着 zhe 变 biàn 啦 la 了 le 腿 tuǐ 脱 tuō 衣 yī 服 fú 换 huàn 裤 kù 褂 guà 咦 yí 成 chéng 青 qīng 蛙 wā
弯 wān 的 de 月 yuè 亮 liàng 船 chuán 尖 jiān 闪 shǎn 星 xīng 天 tiān 日 rì 火 huǒ 牛 niú 匹 pǐ 马 mǎ 件 jiàn 羊 yáng 群 qún 鸭 yā 桃 táo 百 bǎi 鱼 yú 虫 chóng 草 cǎo
和 hé 请 qǐng 吃 chī 说 shuō 谢 xiè 猫 māo 狗 gǒu 骨 gǔ 同 tóng 种 zhǒng 阿 ā 姨 yí 把 bǎ 玉 yù 秋 qiū 收 shōu 很 hěn 叔 shū 它 tā 想 xiǎng 呢 ne
落 luò 叶 yè 吹 chuī 气 qì 凉 liáng 从 cóng 枝 zhī 躲 duǒ 当 dāng 作 zuò 沟 gōu 蚂 mǎ 蚁 yǐ 河 hé 游 yóu 过 guò 藏 cáng 伞 sǎn 顶 dǐng 燕 yàn 低 dī 信 xìn 们 men 要 yào 南 nán 方 fāng
时 shí 候 hòu 冬 dōng 飘 piāo 起 qǐ 出 chū 玩 wán 跑 pǎo 留 liú 印 yìn 对 duì 这 zhè 是 shì 那 nà 梅 méi 竹 zhú 乌 wū 鸦 yā 喝 hē 渴 kě 处 chù 找 zhǎo 瓶 píng 可 kě 高 gāo 怎 zěn 么 me 办 bàn 法 fǎ 慢 màn 升 shēng
猴 hóu 又 yòu 非 fēi 常 cháng 兴 xīng 摘 zhāi 往 wǎng 拿 ná 满 mǎn 扔 rēng 西 xī 瓜 guā 圆 yuán 抱 bào 回 huí 兔 tù 蹦 bèng 跳 tiào 真 zhēn 追 zhuī 啊 a 林 lín 空 kōng
`.trim().split(/\s+/).reduce((map, token, index, list) => {
  if (index % 2 === 0) map[token] = list[index + 1];
  return map;
}, {});

const MLP_DATABASE = {
  version: '2026.10-official-g1-302',
  source: '马立平中文官方《1年级生字表》',
  units: OFFICIAL_UNITS.map(unit => ({
    ...unit,
    characters: unit.lessons.flatMap(([lesson, chars]) => chars.split(/\s+/).map(char => ({
      char,
      lesson,
      pinyin: PINYIN[char] || '',
      words: [char],
      sentence: `我们一起认识“${char}”。`,
      english: 'Chinese character',
      radical: '—',
      strokes: '—',
      mnemonic: `在课文《${lesson}》中认识“${char}”。`,
      hint: `认真认读“${char}”，每天进步一点点。`
    })))
  }))
};

function getAllCharacters() {
  return MLP_DATABASE.units.flatMap(unit => unit.characters.map(c => ({ ...c, unitId: unit.id, unitTitle: unit.title })));
}

function getCharacterByChar(charStr) {
  for (const unit of MLP_DATABASE.units) {
    const found = unit.characters.find(c => c.char === charStr);
    if (found) return { ...found, unitId: unit.id, unitTitle: unit.title };
  }
  return null;
}

if (typeof window !== 'undefined') {
  window.MLP_DATABASE = MLP_DATABASE;
  window.getAllCharacters = getAllCharacters;
  window.getCharacterByChar = getCharacterByChar;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MLP_DATABASE, getAllCharacters, getCharacterByChar };
}
