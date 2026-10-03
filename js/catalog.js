/* ============ 模型目录 ============
 * type: anatomy=单骨模型 / anatomy-group=多骨组装 / globe / solar / molecule / cell / bone-structure
 * views: 相机预设(方向向量,在模型坐标系的观察方向)
 */
const CATALOG = [
  /* ================= 医学 · 系统解剖学 ================= */
  {
    id: 'bone-structure', type: 'bone-structure', cat: 'medical',
    groupName: '骨学总论', icon: '🦴', title: '骨的构造(长骨剖面)',
    en: 'Structure of Bone',
    desc: '骨密质、骨松质、骨膜、骨髓(红/黄)、骨髓腔、关节软骨、骺线 —— 对应实验报告「骨的构造」绘图题。',
    tags: ['模式图', '考点', '实验报告1'],
    keywords: '骨构造 骨密质 骨松质 骨膜 骨髓 骺线 长骨'
  },
  {
    id: 'skull', type: 'anatomy-group', cat: 'medical',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '颅(整体 · 可分块)',
    en: 'Skull',
    desc: '23块颅骨真实拼接,每一块都可单独隐藏/隔离/点击;含颅底内面观(视神经管、圆孔、卵圆孔、棘孔、颈静脉孔、枕骨大孔等)考点标注。',
    tags: ['真实CT数据', '考点', '实验报告3', '自测'],
    keywords: '颅 颅骨 头骨 skull 颅底 颅底内面 枕骨大孔 视神经管'
  },
  {
    id: 'frontal-bone', type: 'anatomy', cat: 'medical', file: 'frontal-bone',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '额骨', en: 'Frontal bone',
    desc: '脑颅骨之一。考点:眉弓、眶上缘、额窦、眉间。',
    tags: ['脑颅骨'], keywords: '额骨 frontal'
  },
  {
    id: 'parietal-bone', type: 'anatomy', cat: 'medical', file: 'parietal-bone',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '顶骨', en: 'Parietal bone',
    desc: '脑颅骨之一,成对。考点:翼点(额顶颞蝶四骨汇合处)位置相关。',
    tags: ['脑颅骨'], keywords: '顶骨 parietal 翼点'
  },
  {
    id: 'temporal-bone', type: 'anatomy', cat: 'medical', file: 'temporal-bone',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '颞骨', en: 'Temporal bone',
    desc: '考点:外耳门、乳突、下颌窝、关节结节、内耳门、茎突。',
    tags: ['脑颅骨'], keywords: '颞骨 temporal 乳突 下颌窝 内耳门'
  },
  {
    id: 'occipital-bone', type: 'anatomy', cat: 'medical', file: 'occipital-bone',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '枕骨', en: 'Occipital bone',
    desc: '考点:枕骨大孔(延髓与脊髓交接处通过)、枕髁、枕外隆凸。',
    tags: ['脑颅骨'], keywords: '枕骨 occipital 枕骨大孔 枕髁'
  },
  {
    id: 'sphenoid-bone', type: 'anatomy', cat: 'medical', file: 'sphenoid-bone',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '蝶骨', en: 'Sphenoid bone',
    desc: '颅底核心骨。考点:蝶鞍/垂体窝、视神经管、眶上裂、圆孔、卵圆孔、棘孔。',
    tags: ['脑颅骨', '考点'], keywords: '蝶骨 sphenoid 蝶鞍 垂体窝 圆孔 卵圆孔 棘孔'
  },
  {
    id: 'ethmoid-bone', type: 'anatomy', cat: 'medical', file: 'ethmoid-bone',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '筛骨', en: 'Ethmoid bone',
    desc: '考点:鸡冠、筛板(嗅丝通过)、垂直板、筛窦(筛骨迷路)、上/中鼻甲。',
    tags: ['脑颅骨', '考点'], keywords: '筛骨 ethmoid 鸡冠 筛板 垂直板'
  },
  {
    id: 'maxilla', type: 'anatomy', cat: 'medical', file: 'maxilla',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '上颌骨', en: 'Maxilla',
    desc: '面颅骨,成对。考点:上颌窦(鼻旁窦中最大)、牙槽突、眶下孔、颧突、腭突。',
    tags: ['面颅骨'], keywords: '上颌骨 maxilla 上颌窦 眶下孔'
  },
  {
    id: 'mandible', type: 'anatomy', cat: 'medical', file: 'mandible',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '下颌骨', en: 'Mandible',
    desc: '颅骨中唯一可活动的骨。考点:下颌头、下颌颈、冠突、髁突、下颌支、下颌角、下颌孔、颏孔、颏隆凸 —— 对应实验报告3绘图题。',
    tags: ['面颅骨', '考点', '实验报告3', '自测'],
    keywords: '下颌骨 mandible 髁突 冠突 下颌孔 颏孔 咬肌粗隆'
  },
  {
    id: 'hyoid-bone', type: 'anatomy', cat: 'medical', file: 'hyoid-bone',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '舌骨', en: 'Hyoid bone',
    desc: '颅骨以外唯一不与其他骨形成关节的骨,借韧带与颅相连。考点:舌骨体与大角。',
    tags: ['颈'], keywords: '舌骨 hyoid'
  },
  {
    id: 'vomer', type: 'anatomy', cat: 'medical', file: 'vomer',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '犁骨', en: 'Vomer',
    desc: '构成骨性鼻中隔后下部。',
    tags: ['面颅骨'], keywords: '犁骨 vomer 鼻中隔'
  },
  {
    id: 'zygomatic-bone', type: 'anatomy', cat: 'medical', file: 'zygomatic-bone',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '颧骨', en: 'Zygomatic bone',
    desc: '面颅骨,成对,构成面颊的骨性隆起。',
    tags: ['面颅骨'], keywords: '颧骨 zygomatic'
  },
  {
    id: 'nasal-bone', type: 'anatomy', cat: 'medical', file: 'nasal-bone',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '鼻骨', en: 'Nasal bone',
    desc: '面颅骨,成对,构成鼻背。',
    tags: ['面颅骨'], keywords: '鼻骨 nasal'
  },
  {
    id: 'lacrimal-bone', type: 'anatomy', cat: 'medical', file: 'lacrimal-bone',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '泪骨', en: 'Lacrimal bone',
    desc: '面颅骨,成对,为颅骨中最小的骨之一,参与构成眶内侧壁。',
    tags: ['面颅骨'], keywords: '泪骨 lacrimal'
  },
  {
    id: 'palatine-bone', type: 'anatomy', cat: 'medical', file: 'palatine-bone',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '腭骨', en: 'Palatine bone',
    desc: '面颅骨,成对,参与构成骨腭后部与鼻腔外侧壁。',
    tags: ['面颅骨'], keywords: '腭骨 palatine 骨腭'
  },
  {
    id: 'inferior-nasal-concha', type: 'anatomy', cat: 'medical', file: 'inferior-nasal-concha',
    groupName: '中轴骨 · 颅骨', icon: '💀', title: '下鼻甲', en: 'Inferior nasal concha',
    desc: '面颅骨,成对,为独立的面颅骨(区别于筛骨的上/中鼻甲)。',
    tags: ['面颅骨'], keywords: '下鼻甲 inferior nasal concha'
  },
  {
    id: 'atlas', type: 'anatomy', cat: 'medical', file: 'atlas',
    groupName: '中轴骨 · 躯干骨', icon: '🦴', title: '寰椎(C1)', en: 'Atlas',
    desc: '第一颈椎,无椎体、无棘突。考点:前弓、后弓、侧块、齿突凹、横突孔、椎动脉沟。',
    tags: ['颈椎', '考点'], keywords: '寰椎 atlas 第一颈椎 C1'
  },
  {
    id: 'axis', type: 'anatomy', cat: 'medical', file: 'axis',
    groupName: '中轴骨 · 躯干骨', icon: '🦴', title: '枢椎(C2)', en: 'Axis',
    desc: '第二颈椎。考点:齿突(dens,与寰椎前弓形成寰枢关节)、椎弓、棘突、横突孔。',
    tags: ['颈椎', '考点'], keywords: '枢椎 axis 齿突 C2'
  },
  {
    id: 'cervical-vertebra', type: 'anatomy', cat: 'medical', file: 'cervical-vertebra',
    groupName: '中轴骨 · 躯干骨', icon: '🦴', title: '普通颈椎(C4)', en: 'Typical cervical vertebra',
    desc: '考点:横突孔(椎动脉通过)、棘突末端分叉、椎孔大呈三角形、钩椎关节(Luschka关节)。',
    tags: ['颈椎', '考点'], keywords: '颈椎 横突孔 棘突分叉'
  },
  {
    id: 'thoracic-vertebra', type: 'anatomy', cat: 'medical', file: 'thoracic-vertebra',
    groupName: '中轴骨 · 躯干骨', icon: '🦴', title: '胸椎(T6)', en: 'Thoracic vertebra',
    desc: '考点:椎体肋凹、横突肋凹、上/下关节突、棘突长而斜向后下呈叠瓦状、椎弓切迹 —— 对应实验报告1填图。',
    tags: ['真实CT数据', '考点', '实验报告1', '自测'],
    keywords: '胸椎 thoracic 椎体肋凹 横突肋凹 棘突 上关节突 下关节突'
  },
  {
    id: 'lumbar-vertebra', type: 'anatomy', cat: 'medical', file: 'lumbar-vertebra',
    groupName: '中轴骨 · 躯干骨', icon: '🦴', title: '腰椎(L2)', en: 'Lumbar vertebra',
    desc: '考点:椎体最大、棘突宽短呈板状水平向后、椎孔呈三角形;腰椎穿刺经棘突间隙。',
    tags: ['考点'], keywords: '腰椎 lumbar 棘突板状 腰穿'
  },
  {
    id: 'sacrum', type: 'anatomy', cat: 'medical', file: 'sacrum',
    groupName: '中轴骨 · 躯干骨', icon: '🦴', title: '骶骨', en: 'Sacrum',
    desc: '考点:骶岬(骨盆入口前方测量标志)、骶前后孔、骶管、骶角(骶管麻醉定位)、耳状面。',
    tags: ['考点'], keywords: '骶骨 sacrum 骶岬 骶角 骶管'
  },
  {
    id: 'sternum', type: 'anatomy', cat: 'medical', file: 'sternum',
    groupName: '中轴骨 · 躯干骨', icon: '🦴', title: '胸骨', en: 'Sternum',
    desc: '由胸骨柄、胸骨体、剑突组成。考点:胸骨角(平对第2肋,计数肋的标志)、颈静脉切迹、剑突。',
    tags: ['考点'], keywords: '胸骨 sternum 胸骨角 剑突 胸骨柄'
  },
  {
    id: 'rib', type: 'anatomy', cat: 'medical', file: 'rib',
    groupName: '中轴骨 · 躯干骨', icon: '🦴', title: '肋骨(典型)', en: 'Rib',
    desc: '考点:肋头、肋颈、肋结节、肋沟(肋间血管神经走行)、肋角;真肋1-7、假肋8-10、浮肋11-12。',
    tags: ['考点'], keywords: '肋骨 rib 肋头 肋结节 肋沟 真肋 假肋 浮肋'
  },
  {
    id: 'clavicle', type: 'anatomy', cat: 'medical', file: 'clavicle',
    groupName: '四肢骨 · 上肢带骨', icon: '🦴', title: '锁骨', en: 'Clavicle',
    desc: '考点:内侧2/3凸向前、外侧1/3凸向后(易混淆点);唯一以骨性连接联结上肢与躯干的骨;中1/3易骨折。',
    tags: ['上肢'], keywords: '锁骨 clavicle 胸锁关节 肩峰端'
  },
  {
    id: 'scapula', type: 'anatomy', cat: 'medical', file: 'scapula',
    groupName: '四肢骨 · 上肢带骨', icon: '🦴', title: '肩胛骨', en: 'Scapula',
    desc: '考点:肩胛冈、肩峰、喙突、关节盂、肩胛下角(平对第7肋)、上/下角、肩胛切迹。',
    tags: ['上肢', '考点'], keywords: '肩胛骨 scapula 肩胛冈 肩峰 喙突 关节盂'
  },
  {
    id: 'humerus', type: 'anatomy', cat: 'medical', file: 'humerus',
    groupName: '四肢骨 · 自由上肢骨', icon: '💪', title: '肱骨', en: 'Humerus',
    desc: '考点:肱骨头、解剖颈、外科颈(易骨折)、大/小结节、结节间沟、桡神经沟、鹰嘴窝、冠突窝、肱骨滑车、肱骨小头、内/外上髁、尺神经沟 —— 对应实验报告2绘图题。',
    tags: ['真实CT数据', '考点', '实验报告2', '自测'],
    keywords: '肱骨 humerus 外科颈 结节间沟 桡神经沟 尺神经沟 肱骨滑车'
  },
  {
    id: 'radius', type: 'anatomy', cat: 'medical', file: 'radius',
    groupName: '四肢骨 · 自由上肢骨', icon: '💪', title: '桡骨', en: 'Radius',
    desc: '前臂外侧骨。考点:桡骨头、桡骨颈、桡骨粗隆、骨间缘、茎突(比尺骨茎突低约1cm,桡骨下端骨折Colles骨折)。',
    tags: ['上肢'], keywords: '桡骨 radius 桡骨头 茎突 Colles'
  },
  {
    id: 'ulna', type: 'anatomy', cat: 'medical', file: 'ulna',
    groupName: '四肢骨 · 自由上肢骨', icon: '💪', title: '尺骨', en: 'Ulna',
    desc: '前臂内侧骨。考点:鹰嘴、冠突、滑车切迹(半月切迹)、桡切迹、尺骨头、茎突。',
    tags: ['上肢'], keywords: '尺骨 ulna 鹰嘴 冠突 滑车切迹'
  },
  {
    id: 'scaphoid', type: 'anatomy', cat: 'medical', file: 'scaphoid',
    groupName: '四肢骨 · 手骨', icon: '✋', title: '手舟骨', en: 'Scaphoid',
    desc: '近侧列腕骨。口诀:舟月三角豆,大小头状钩。舟骨骨折易缺血坏死。',
    tags: ['腕骨', '口诀'], keywords: '手舟骨 scaphoid 腕骨'
  },
  {
    id: 'lunate', type: 'anatomy', cat: 'medical', file: 'lunate',
    groupName: '四肢骨 · 手骨', icon: '✋', title: '月骨', en: 'Lunate',
    desc: '近侧列腕骨,月形,最易脱位的腕骨。',
    tags: ['腕骨', '口诀'], keywords: '月骨 lunate 腕骨'
  },
  {
    id: 'pisiform', type: 'anatomy', cat: 'medical', file: 'pisiform',
    groupName: '四肢骨 · 手骨', icon: '✋', title: '豌豆骨', en: 'Pisiform',
    desc: '近侧列腕骨中最小的,位于尺骨远端掌侧。',
    tags: ['腕骨', '口诀'], keywords: '豌豆骨 pisiform 腕骨'
  },
  {
    id: 'trapezium', type: 'anatomy', cat: 'medical', file: 'trapezium',
    groupName: '四肢骨 · 手骨', icon: '✋', title: '大多角骨', en: 'Trapezium',
    desc: '远侧列腕骨,与第一掌骨构成拇指腕掌关节(马鞍关节)。',
    tags: ['腕骨', '口诀'], keywords: '大多角骨 trapezium'
  },
  {
    id: 'capitate', type: 'anatomy', cat: 'medical', file: 'capitate',
    groupName: '四肢骨 · 手骨', icon: '✋', title: '头状骨', en: 'Capitate',
    desc: '远侧列腕骨中最大,为腕骨的中心骨。',
    tags: ['腕骨', '口诀'], keywords: '头状骨 capitate'
  },
  {
    id: 'hamate', type: 'anatomy', cat: 'medical', file: 'hamate',
    groupName: '四肢骨 · 手骨', icon: '✋', title: '钩骨', en: 'Hamate',
    desc: '远侧列腕骨,有特征性的钩(hook of hamate)。',
    tags: ['腕骨', '口诀'], keywords: '钩骨 hamate'
  },
  {
    id: 'hip-bone', type: 'anatomy', cat: 'medical', file: 'hip-bone',
    groupName: '四肢骨 · 下肢带骨', icon: '🦴', title: '髋骨', en: 'Hip bone',
    desc: '由髂骨、坐骨、耻骨融合而成。考点:髂嵴、髂前/后上棘、坐骨大切迹、坐骨棘、坐骨结节、髋臼、闭孔 —— 对应实验报告2填图。',
    tags: ['真实CT数据', '考点', '实验报告2', '自测'],
    keywords: '髋骨 hip bone 髂嵴 髂前上棘 坐骨大切迹 坐骨棘 坐骨结节 髋臼 闭孔'
  },
  {
    id: 'femur', type: 'anatomy', cat: 'medical', file: 'femur',
    groupName: '四肢骨 · 自由下肢骨', icon: '🦵', title: '股骨', en: 'Femur',
    desc: '人体最长的长骨。考点:股骨头、股骨颈(易骨折)、大/小转子、转子间线/嵴、臀肌粗隆、股骨滑车、内外侧髁、收肌结节。',
    tags: ['真实CT数据', '考点', '自测'],
    keywords: '股骨 femur 股骨颈 大转子 小转子 股骨头'
  },
  {
    id: 'patella', type: 'anatomy', cat: 'medical', file: 'patella',
    groupName: '四肢骨 · 自由下肢骨', icon: '🦵', title: '髌骨', en: 'Patella',
    desc: '人体最大的籽骨。考点:上宽下尖,前面粗糙,关节面被髌面纵嵴分为内小外大两部分。',
    tags: ['籽骨'], keywords: '髌骨 patella 籽骨'
  },
  {
    id: 'tibia', type: 'anatomy', cat: 'medical', file: 'tibia',
    groupName: '四肢骨 · 自由下肢骨', icon: '🦵', title: '胫骨', en: 'Tibia',
    desc: '小腿内侧承重骨。考点:内侧髁/外侧髁、髁间隆起、胫骨粗隆、前缘(胫骨前嵴)、内踝。',
    tags: ['下肢'], keywords: '胫骨 tibia 胫骨粗隆 内踝'
  },
  {
    id: 'fibula', type: 'anatomy', cat: 'medical', file: 'fibula',
    groupName: '四肢骨 · 自由下肢骨', icon: '🦵', title: '腓骨', en: 'Fibula',
    desc: '小腿外侧骨,不承重。考点:腓骨头(腓总神经绕行处易损伤)、腓骨颈、外踝(比内踝低)。',
    tags: ['下肢'], keywords: '腓骨 fibula 腓骨头 外踝'
  },
  {
    id: 'talus', type: 'anatomy', cat: 'medical', file: 'talus',
    groupName: '四肢骨 · 足骨', icon: '🦶', title: '距骨', en: 'Talus',
    desc: '跗骨之一,上接胫腓骨。口诀:上距下跟,舟连于距,骰外楔内。距骨无肌肉附着,血供差易坏死。',
    tags: ['跗骨', '口诀'], keywords: '距骨 talus 跗骨'
  },
  {
    id: 'calcaneus', type: 'anatomy', cat: 'medical', file: 'calcaneus',
    groupName: '四肢骨 · 足骨', icon: '🦶', title: '跟骨', en: 'Calcaneus',
    desc: '最大的跗骨。考点:跟结节(跟腱附着)、载距突;跟骨骨折常见。',
    tags: ['跗骨', '口诀'], keywords: '跟骨 calcaneus 跟结节'
  },
  {
    id: 'skeleton', type: 'anatomy-group', cat: 'medical',
    groupName: '全身骨骼', icon: '🧍', title: '全身骨骼(成人男性)',
    en: 'Human skeleton',
    desc: '基于真实人体CT重建数据组装的全身骨骼,共200余块骨,每块可独立选中、隐藏、隔离、点击学习。骨骼数目与名称符合系统解剖学要求(掌骨、指骨等细小骨在本数据分辨率下未提供)。',
    tags: ['真实CT数据', '206块骨体系', '可分块'],
    keywords: '全身骨骼 skeleton 人体骨架 206'
  },
  {
    id: 'import', type: 'import', cat: 'medical', icon: '📥',
    groupName: '自定义', title: '导入自己的模型',
    desc: '把任意 .glb / .obj / .sdf 分子文件拖进查看器即可加载(不上传到任何服务器)。适合加载学校自带的解剖模型或其他3D素材。',
    tags: ['本地', '隐私'], keywords: '导入 import obj glb'
  },

  /* ================= 地理 ================= */
  {
    id: 'globe', type: 'globe', cat: 'geo', groupName: '地理', icon: '🌍',
    title: '地球仪 · 世界各国', en: 'The Earth',
    desc: '点击任意国家,查看中英文名称、首都、人口、大洲与简介;支持经纬度显示与国家高亮,可继续向 AI 提问深入了解。',
    tags: ['点击国家', '中英对照', 'AI扩展'], keywords: '地球 globe 国家 地理 world'
  },

  /* ================= 天文 ================= */
  {
    id: 'solar', type: 'solar', cat: 'astro', groupName: '天文', icon: '🪐',
    title: '太阳系', en: 'Solar System',
    desc: '八大行星按真实顺序与轨道运行(尺寸/距离做了可视化压缩并标注真实数据)。点击行星查看质量、公转周期、卫星数与科普介绍。',
    tags: ['动画', '点击行星', '真实数据'], keywords: '太阳系 solar 行星 水星 金星 地球 火星 木星 土星 天王星 海王星'
  },

  /* ================= 化学 ================= */
  {
    id: 'molecules', type: 'molecule-list', cat: 'chem', groupName: '化学 · 分子结构', icon: '⚗️',
    title: '常见分子结构集', en: 'Molecules',
    desc: '水、甲烷、氨、二氧化碳、乙醇、苯、葡萄糖等16种常见分子的三维球棍模型,点击原子/化学键查看元素与键的信息。',
    tags: ['球棍模型', '点击原子', '键级'], keywords: '分子 molecule 苯 水 甲烷 葡萄糖 咖啡因 化学',
    expandTo: 'molecules'
  },

  /* ================= 生物 ================= */
  {
    id: 'cell', type: 'cell', cat: 'bio', groupName: '生物', icon: '🔬',
    title: '动物细胞(模式图)', en: 'Animal cell',
    desc: '细胞膜、细胞核、线粒体、内质网、高尔基体、核糖体、溶酶体、中心体等结构的可点击三维模式图。',
    tags: ['模式图', '点击细胞器'], keywords: '细胞 cell 线粒体 细胞核 内质网 高尔基体'
  }
];

/* 分子列表由 molecule-list 卡片展开为单独模型 */
const MOLECULES = [
  { id: 'water', name: '水', formula: 'H₂O', en: 'Water', point: '2.98', note: 'V形分子,键角104.5°,因氢键而有高沸点。' },
  { id: 'methane', name: '甲烷', formula: 'CH₄', en: 'Methane', point: '-161.5', note: '最简单的有机物,正四面体结构,键角109°28′。' },
  { id: 'ammonia', name: '氨', formula: 'NH₃', en: 'Ammonia', point: '-33.3', note: '三角锥形,键角107°,一对孤对电子。' },
  { id: 'co2', name: '二氧化碳', formula: 'CO₂', en: 'Carbon dioxide', point: '-78.5(升华)', note: '直线形分子,sp杂化,是非极性分子。' },
  { id: 'methanol', name: '甲醇', formula: 'CH₃OH', en: 'Methanol', point: '64.7', note: '最简单的醇,有毒,可致失明。' },
  { id: 'ethanol', name: '乙醇', formula: 'C₂H₅OH', en: 'Ethanol', point: '78.4', note: '饮用酒的主要成分,羟基为亲水基团。' },
  { id: 'acetic-acid', name: '乙酸', formula: 'CH₃COOH', en: 'Acetic acid', point: '117.9', note: '食醋的主要成分,羧基表现出酸性。' },
  { id: 'acetone', name: '丙酮', formula: 'CH₃COCH₃', en: 'Acetone', point: '56.1', note: '最简单的酮,常用有机溶剂。' },
  { id: 'ethene', name: '乙烯', formula: 'C₂H₄', en: 'Ethylene', point: '-103.7', note: '平面分子,含碳碳双键,植物催熟剂。' },
  { id: 'benzene', name: '苯', formula: 'C₆H₆', en: 'Benzene', point: '80.1', note: '正六边形平面分子,大π键,特殊芳香性。' },
  { id: 'cyclohexane', name: '环己烷', formula: 'C₆H₁₂', en: 'Cyclohexane', point: '80.7', note: '椅式构象,碳原子sp³杂化。' },
  { id: 'urea', name: '尿素', formula: 'CO(NH₂)₂', en: 'Urea', point: '132.7', note: '第一种人工合成的有机物(维勒,1828)。' },
  { id: 'glucose', name: '葡萄糖', formula: 'C₆H₁₂O₆', en: 'Glucose', point: '146(分解)', note: '吡喃糖椅式构象,细胞最重要的能源物质。' },
  { id: 'oxygen', name: '氧气', formula: 'O₂', en: 'Oxygen', point: '-183', note: '双原子分子,顺磁性(有两对未成对电子)。' },
  { id: 'nitrogen', name: '氮气', formula: 'N₂', en: 'Nitrogen', point: '-195.8', note: '含有N≡N三键,键能大,化学性质稳定。' },
  { id: 'hydrogen', name: '氢气', formula: 'H₂', en: 'Hydrogen', point: '-252.8', note: '最小的分子,未来清洁能源的载体。' }
];
MOLECULES.forEach(m => {
  CATALOG.push({
    id: 'mol-' + m.id, type: 'molecule', cat: 'chem', groupName: '化学 · 分子结构',
    icon: '⚗️', title: m.name + ' ' + m.formula, en: m.en,
    desc: m.note + (' 沸点 ' + m.point + ' °C。'),
    tags: ['球棍模型'], keywords: m.name + ' ' + m.formula,
    mol: m.id
  });
});
