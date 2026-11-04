import { Dish } from '../types';

export interface IngredientMeta {
  bgImage: string;
  bgAlt: string;
  bgColor: string;
  /**
   * 可选：hero 背景图的 CSS filter 覆盖。
   * 默认（不填）走 ProductDetailPage 里那套 `brightness-.98 contrast-1.03`；
   * 填了就用这里，用来做「把背景往后推」的景深处理（虚化 + 降饱和 + 轻微压亮）。
   * ⚠️ 一旦填了，img 会额外带上 `scale-106`（比默认 102 大），
   *    因为 blur 会让图片边缘出现半透明羽化，不留余量会在 hero 四边露白。
   */
  bgFilter?: string;
  topBadge1: { bold: string; text: string };
  topBadge2: { prefix: string; main: string };
  stampTop: string;
  stampBottom: string;
  subTraits: string[];
}

/**
 * Maps any dish and its specific ingredients to a matching clean solid/complementary studio backdrop photo
 * featuring a single hero raw ingredient (single halved avocado, single coconut half, single golden wheat ear, etc.)
 * with generous negative space for a luxury high-end commercial aesthetic.
 */
export function getDishIngredientMeta(dish: Dish): IngredientMeta {
  const name = dish.name || '';
  const desc = dish.description || '';
  const subtitle = dish.subtitle || '';
  const allText = `${name} ${desc} ${subtitle}`.toLowerCase();

  // 1. 牛油果 / Avocado (纯色补色纯净背景 + 单颗极简切开墨西哥哈斯牛油果，留白高级感)
  if (allText.includes('牛油果') || allText.includes('avocado')) {
    return {
      // 本地素材（public/backdrops/avocado.jpg，1024×572，比例 1.79，和 hero 的
      // 390×220=1.77 基本一致，object-cover 裁得很少）。
      // bgColor 取的是这张图的背景绿（#4F7603）而不是原来的 #203a1c：
      // 图片加载前 hero 先铺底色，色差大会闪一下；这里必须跟着换。
      bgImage: '/backdrops/avocado.jpg',
      bgAlt: 'Whole Hass avocado on the left and two halves on the right over a solid green backdrop',
      bgColor: '#4F7603',
      topBadge1: { bold: '好评榜', text: 'NO.1' },
      topBadge2: { prefix: '鲜食专属', main: '墨西哥哈斯牛油果' },
      stampTop: '鲜食',
      stampBottom: '首创',
      subTraits: ['墨西哥优质哈斯牛油果', '低温慢煮高蛋白', '每日鲜切现拌锁鲜']
    };
  }

  // 1b. 羽衣甘蓝 / Kale (纯绿渐变底 + 带水珠的羽衣甘蓝原叶微距特写)
  // ⚠️ **必须排在生椰分支（2）之前**：「羽衣甘蓝酸奶昔」的 description 里写了
  //    「生椰乳」，而 allText 包含 description，所以一旦掉到下面就会被 `includes('椰')`
  //    截走，显示成椰青背景。用菜名/关键词优先命中。
  if (allText.includes('羽衣甘蓝') || allText.includes('kale')) {
    return {
      // 本地素材（public/backdrops/kale.jpg，1024×506，比例 2.02）。hero 是 1.77，
      // 比图更窄 —— object-cover 按高度铺满，左右各裁掉约 6%，叶片主体仍在画面里。
      // bgColor 取图里那片绿的均值（#85BA6C），图加载前先铺这层，不会有换色闪烁。
      bgImage: '/backdrops/kale.jpg',
      bgAlt: 'Macro shot of fresh curly kale leaves with water droplets on a green backdrop',
      bgColor: '#85BA6C',
      topBadge1: { bold: '绿叶鲜活', text: 'TOP.1' },
      topBadge2: { prefix: '冷链直采', main: '有机羽衣甘蓝原叶' },
      stampTop: '鲜活',
      stampBottom: '现打',
      subTraits: ['鲜采有机羽衣甘蓝', '0蔗糖希腊酸奶', '高叶绿素+活性益生菌']
    };
  }

  // 2. 生椰 / 椰乳 / 椰子 / Coconut (纯色极简静物台面 + 单只切开原只生椰子，高纯净度)
  if (allText.includes('椰') || allText.includes('coconut')) {
    return {
      bgImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=85',
      bgAlt: 'Single raw fresh halved coconut on clean solid studio background',
      bgColor: '#17361e',
      topBadge1: { bold: '人气推荐', text: 'NO.1' },
      topBadge2: { prefix: '鲜食专属', main: '印尼生椰岛直采' },
      stampTop: '鲜食',
      stampBottom: '首创',
      subTraits: ['专属生态生椰果园', '清爽甘甜', '1H冷榨锁鲜']
    };
  }

  // 3. 咖啡 / 燕麦拿铁 / 拿铁 / Coffee / Oat Milk (极简暖色纯净背景 + 单支新鲜咖啡豆/极简燕麦原粒)
  if (allText.includes('燕麦') || allText.includes('咖啡') || allText.includes('拿铁') || allText.includes('冷萃')) {
    return {
      bgImage: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1200&q=85',
      bgAlt: 'Minimalist single raw coffee beans on clean solid complementary background',
      bgColor: '#2c1e14',
      topBadge1: { bold: '冷萃特调', text: 'TOP.1' },
      topBadge2: { prefix: '大师专属', main: 'OATLY咖啡大师燕麦' },
      stampTop: '冷萃',
      stampBottom: '慢萃',
      subTraits: ['18小时低温慢速冷萃', 'Oatly燕麦大师奶', '0蔗糖浓郁坚果尾韵']
    };
  }

  // 4. 南瓜 / 藜麦 / 谷物 / Pumpkin / Quinoa (极简纯色背景 + 单颗饱满有机贝贝小南瓜，留白通透)
  if (allText.includes('南瓜') || allText.includes('藜麦') || allText.includes('pumpkin')) {
    return {
      bgImage: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=1200&q=85',
      bgAlt: 'Single fresh organic baby pumpkin on solid minimalist complementary backdrop',
      bgColor: '#3d250d',
      topBadge1: { bold: '慢碳饱腹', text: 'NO.1' },
      topBadge2: { prefix: '高原直采', main: '现烤贝贝南瓜·三色藜麦' },
      stampTop: '轻食',
      stampBottom: '首创',
      subTraits: ['三色高原慢碳藜麦', '现烤贝贝小南瓜', '高膳食纤维加倍']
    };
  }

  // 5. 三明治 / 全麦吐司 / 金枪鱼 / Sandwich / Wheat (金黄纯色底 + 环绕式散落小麦粒)
  if (allText.includes('三明治') || allText.includes('全麦') || allText.includes('吐司') || allText.includes('sandwich')) {
    return {
      // 本地素材（public/backdrops/sandwich-wheat.jpg，1024×753，比例 1.36，53KB）。
      // hero 是 390×220=1.77，比图更扁 —— object-cover 按宽度铺满后上下各裁掉约 11%
      // （合计 23%），麦粒环的上下两端稍微出画，中间「留白圈」正好落在食物后面。
      // bgColor 取图的金黄底（#DDA747）：图加载前先铺这层，避免闪一下深棕。
      bgImage: '/backdrops/sandwich-wheat.jpg',
      bgAlt: 'Scattered golden wheat grains on a warm amber studio background',
      bgColor: '#DDA747',
      topBadge1: { bold: '随手轻食', text: 'TOP.1' },
      topBadge2: { prefix: '原粮烘焙', main: '100%全麦原粮吐司' },
      stampTop: '手工',
      stampBottom: '现制',
      subTraits: ['100%纯全麦吐司', '深海高蛋白金枪鱼', '双层饱满健康夹心']
    };
  }

  // 6. 牛肉 / 牛排 / 黑椒 / Beef (暗调极简纯色岩板背景 + 单支鲜采有机迷迭香草)
  if (allText.includes('牛') || allText.includes('beef') || allText.includes('黑椒')) {
    return {
      bgImage: 'https://images.unsplash.com/photo-1514944298352-7b2434a9463b?auto=format&fit=crop&w=1200&q=85',
      bgAlt: 'Single fresh rosemary sprig on clean minimalist slate background',
      bgColor: '#241712',
      topBadge1: { bold: '燃脂增肌', text: 'NO.1' },
      topBadge2: { prefix: '原切直供', main: '澳洲谷饲精选牛肉' },
      stampTop: '原切',
      stampBottom: '直供',
      subTraits: ['澳洲谷饲原切牛霖肉', '现磨香浓黑胡椒', '低温炙烤鲜嫩锁汁']
    };
  }

  // 7. 虾 / 彩椒 / 海鲜 / Shrimp (清爽纯色纯净底色 + 单只鲜活厄瓜多尔白虾原料)
  if (allText.includes('虾') || allText.includes('shrimp') || allText.includes('海鲜') || allText.includes('彩椒')) {
    return {
      bgImage: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=1200&q=85',
      bgAlt: 'Single fresh raw king prawn on clean complementary studio surface',
      bgColor: '#142a33',
      topBadge1: { bold: '高钙低脂', text: 'NO.1' },
      topBadge2: { prefix: '深海鲜捞', main: '厄瓜多尔白虾·三色甜椒' },
      stampTop: '深海',
      stampBottom: '鲜捞',
      subTraits: ['厄瓜多尔白虾现剥现灼', '鲜脆三色甜椒粒', '香草白葡萄酒汁']
    };
  }

  // 8. 暖锅 / 香菇 / 菌菇 / Hotpot / Mushroom (照烧鸡腿+豆腐+花菇+时蔬的满幅近景, 非留白构图)
  if (allText.includes('暖锅') || allText.includes('香菇') || allText.includes('蘑菇') || dish.category === 'hot') {
    return {
      // 本地素材（public/backdrops/teriyaki-pot.jpg，1400×700，比例 2.0）。
      // ⚠️ 这张和前几张**构图性质不同**：牛油果/羽衣甘蓝都是「原料 + 大量留白」，
      //    这张是整锅菜的俯拍近景，画面塞满。hero 1.77 比它窄，object-cover
      //    左右各裁约 6%（=每边 ~11px @390 宽），主视觉（中间那排照烧鸡）完整保留。
      //    bgColor 取整体均值 #A86124：满幅图没有纯色边，只能拿均值兜底。
      bgImage: '/backdrops/teriyaki-pot.jpg',
      bgAlt: 'Close-up overhead shot of teriyaki glazed chicken with tofu, shiitake and vegetables',
      bgColor: '#A86124',
      // 2026-10-25 用户「给这个背景减弱一点」：满幅近景和前景砂锅抢戏，
      // 用景深把它往后推 —— 3px 虚化（食材轮廓还认得出，但不再抢焦点）、
      // 饱和降到 0.88（照烧酱的橙红最容易跳）、亮度 0.96 只做一点点退让。
      // **不加重压暗**：上一轮刚因为「太暗」把渐变从 30% 收到 12%，这里不能再走回头路。
      bgFilter: 'blur(3px) saturate(0.88) brightness(0.96)',
      topBadge1: { bold: '暖心暖胃', text: 'NO.1' },
      topBadge2: { prefix: '鲜菇现炖', main: '原木花菇·昆布慢熬' },
      stampTop: '暖心',
      stampBottom: '现炖',
      subTraits: ['原木鲜采优质香菇', '去皮鲜嫩多汁鸡腿肉', '日式昆布高汤慢炖']
    };
  }

  // 9. 酸奶 / 蓝莓 / 浆果 / Yogurt / Berry (纯净极简纯色背景 + 单株高山新鲜野生蓝莓带叶原料)
  if (allText.includes('酸奶') || allText.includes('蓝莓') || allText.includes('yogurt') || allText.includes('berry')) {
    return {
      bgImage: 'https://images.unsplash.com/photo-1563746098251-d35aef196e83?auto=format&fit=crop&w=1200&q=85',
      bgAlt: 'Single fresh blueberry sprig with leaf on clean minimalist complementary background',
      bgColor: '#161c2d',
      /**
       * ⚠️ 这张浆果静物是全套背景里**唯一一张天生就暗**的（实拍测：hero 上半平均亮度
       * 54/255 = 21%，76% 的像素低于 L=60）—— 它是一张"暗调静物"，叠加上面那层
       * 12%/8% 的压暗之后更闷。2026-10-27 用户「这个背景太暗了」。
       *
       * 所以给**这一张**单独提亮，而不是去调全局滤镜：
       * 其它背景（牛油果 / 羽衣甘蓝 / 麦香 / 照烧锅）本身是中高明度，
       * 全局 brightness 一加就过曝，只有这张需要补。
       *
       * 参数取 `brightness(1.42) contrast(0.92) saturate(1.14)`：
       * · brightness 1.42 把 21% 抬到 ~31%（实测平均 L 54 → 77，暗部占比 76% → 57%）；
       * · contrast 0.92 **不是**为了对比，而是把亮度往中灰拉、**托起暗部** ——
       *   只加 brightness 的话暗部（大量 L<30 的浆果阴影）几乎不动，只有高光变白；
       * · saturate 1.14 补回提亮 + 降对比后被稀释的浆果红（中位饱和度 0.66 → ~0.72）。
       * 实测通道裁切只有 0.23%，高光没爆。
       * ⚠️ 填了 bgFilter 会连带 `scale-106`（见接口注释），比默认 102 多 4% 裁切，可接受。
       */
      bgFilter: 'brightness(1.42) contrast(0.92) saturate(1.14)',
      topBadge1: { bold: '高蛋白甜点', text: 'NO.1' },
      topBadge2: { prefix: '高山鲜摘', main: '野生蓝莓·纯正希腊酸奶' },
      stampTop: '纯正',
      stampBottom: '希腊',
      subTraits: ['传统滤乳清浓醇质地', '高山新鲜野生蓝莓', '低温轻烤坚果碎']
    };
  }

  // 10. Default Salad/Bowl (清新纯净纯色底 + 单片带露有机水培脆生菜叶，极简高级)
  if (dish.category === 'salad' || dish.category === 'bowl') {
    return {
      bgImage: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=1200&q=85',
      bgAlt: 'Single fresh crisp organic lettuce leaf on minimalist complementary solid background',
      bgColor: '#1d3417',
      topBadge1: { bold: '主厨推荐', text: 'TOP.1' },
      topBadge2: { prefix: '农场直采', main: '有机罗马生菜·特调轻酱' },
      stampTop: '鲜食',
      stampBottom: '首创',
      subTraits: ['有机认证无公害蔬菜', '优质高蛋白搭配', '每日现拌特调油醋汁']
    };
  }

  // 11. General Drink Fallback
  if (dish.category === 'drink') {
    return {
      bgImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=85',
      bgAlt: 'Single fresh raw ingredient on clean complementary studio background',
      bgColor: '#17361e',
      topBadge1: { bold: '低卡鲜饮', text: 'NO.1' },
      topBadge2: { prefix: '现调锁鲜', main: '0卡糖轻盈配方' },
      stampTop: '鲜食',
      stampBottom: '首创',
      subTraits: ['0蔗糖低卡轻负担', '现调制锁鲜出杯', '清爽甘甜回味无穷']
    };
  }

  // 12. General Fallback
  return {
    bgImage: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=1200&q=85',
    bgAlt: 'Single fresh raw ingredient on minimalist complementary studio background',
    bgColor: '#203a1c',
    topBadge1: { bold: '品质严选', text: 'NO.1' },
    topBadge2: { prefix: '源头直采', main: '高品质健康轻食' },
    stampTop: '鲜食',
    stampBottom: '优选',
    subTraits: ['甄选优质原料', '健康控卡配比', '现做现出保障']
  };
}
