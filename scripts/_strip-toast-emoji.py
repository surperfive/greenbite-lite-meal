"""按精确串替换，去掉用户可见提示文案里的 emoji。
每项校验命中次数，未命中直接报错，避免"以为改了其实没改"。
用法：python scripts/_strip-toast-emoji.py
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# (文件, 旧串, 新串, 期望命中次数)
EDITS = [
    # ── App.tsx ──────────────────────────────────────────────
    ("src/App.tsx", "showToast(`🛒 已添加【", "showToast(`已添加【", 2),
    ("src/App.tsx", "showToast('🛒 购物车还是空的", "showToast('购物车还是空的", 1),
    ("src/App.tsx", "showToast('📱 已同步购物车", "showToast('已同步购物车", 1),
    ("src/App.tsx", "showToast('🗑️ 购物车已清空'", "showToast('购物车已清空'", 1),
    ("src/App.tsx", "showToast('❤️ 已加入我的收藏'", "showToast('已加入我的收藏'", 1),
    ("src/App.tsx", "showToast('🛒 菜品已重新加入购物车'", "showToast('菜品已重新加入购物车'", 1),
    ("src/App.tsx", "showToast('🎉 支付成功！", "showToast('支付成功！", 1),
    # ── CartPage ─────────────────────────────────────────────
    ("src/components/CartPage.tsx", "'🎉 已享受满 ¥40 免外卖配送费！'", "'已享受满 ¥40 免外卖配送费！'", 1),
    # ── GachaPage ────────────────────────────────────────────
    ("src/components/GachaPage.tsx", "onShowToast('🪙 抽卡币不足", "onShowToast('抽卡币不足", 1),
    ("src/components/GachaPage.tsx", "`🎉 揭开餐盖！", "`揭开餐盖！", 1),
    ("src/components/GachaPage.tsx", "onShowToast('🎉 签到成功！", "onShowToast('签到成功！", 1),
    ("src/components/GachaPage.tsx", "onShowToast('🎉 分享成功！", "onShowToast('分享成功！", 1),
    ("src/components/GachaPage.tsx", "onShowToast('🚚 免单配送订单已生成", "onShowToast('免单配送订单已生成", 1),
    ("src/components/GachaPage.tsx", ">🎉 达成 10 款起送！</h3>", ">达成 10 款起送！</h3>", 1),
    # ── HomePage ─────────────────────────────────────────────
    ("src/components/HomePage.tsx", "onShowToast('📋 邀请口令", "onShowToast('邀请口令", 1),
    ("src/components/HomePage.tsx", "onShowToast('🎉 恭喜！¥25", "onShowToast('恭喜！¥25", 1),
    ("src/components/HomePage.tsx", "onShowToast('🧧 恭喜！¥15", "onShowToast('恭喜！¥15", 1),
    # ── MenuPage ─────────────────────────────────────────────
    ("src/components/MenuPage.tsx", "onShowToast('🔄 已清空所有筛选')", "onShowToast('已清空所有筛选')", 1),
    # ── MePage ───────────────────────────────────────────────
    ("src/components/MePage.tsx", "`🎟️ 您当前拥有", "`您当前拥有", 1),
    ("src/components/MePage.tsx", "('☕ 咖啡卡券专区", "('咖啡卡券专区", 1),
    ("src/components/MePage.tsx", "`💰 当前账户余额", "`当前账户余额", 1),
    ("src/components/MePage.tsx", "toast: '🏢 招商加盟专线", "toast: '招商加盟专线", 1),
    ("src/components/MePage.tsx", "toast: '💼 场地租赁", "toast: '场地租赁", 1),
    ("src/components/MePage.tsx", "toast: '🎁 口令兑换", "toast: '口令兑换", 1),
    ("src/components/MePage.tsx", "toast: '💳 电子礼品卡", "toast: '电子礼品卡", 1),
    ("src/components/MePage.tsx", "toast: '📍 配送地址管理", "toast: '配送地址管理", 1),
    ("src/components/MePage.tsx", "toast: '📜 平台隐私政策", "toast: '平台隐私政策", 1),
    ("src/components/MePage.tsx", "('🎧 在线客服", "('在线客服", 1),
    ("src/components/MePage.tsx", "('🧾 电子发票开具", "('电子发票开具", 1),
    ("src/components/MePage.tsx", "('🎉 邀请链接已复制", "('邀请链接已复制", 1),
    ("src/components/MePage.tsx", "('🎁 礼品卡商城", "('礼品卡商城", 1),
    ("src/components/MePage.tsx", "('💝 已选择【元气轻享卡", "('已选择【元气轻享卡", 1),
    ("src/components/MePage.tsx", "('☕ 已选择【心动特饮卡", "('已选择【心动特饮卡", 1),
    # ── OrdersPage ───────────────────────────────────────────
    ("src/components/OrdersPage.tsx", "('🧾 电子发票助手", "('电子发票助手", 1),
    ("src/components/OrdersPage.tsx", "('🛵 骑手正在全速派送中", "('骑手正在全速派送中", 1),
    ("src/components/OrdersPage.tsx", "('⚡ 已为您向门店加急催单", "('已为您向门店加急催单", 1),
    ("src/components/OrdersPage.tsx", "('⭐ 感谢评价！", "('感谢评价！", 1),
    ("src/components/OrdersPage.tsx", "已到账 🥗'", "已到账'", 1),
    # ── ProductDetailPage ────────────────────────────────────
    ("src/components/ProductDetailPage.tsx", "`🔗 已生成「", "`已生成「", 1),
    ("src/components/ProductDetailPage.tsx", "<span>✨ 已自动应用平台最优立减优惠</span>", "<span>已自动应用平台最优立减优惠</span>", 1),
    # ── SearchModal ──────────────────────────────────────────
    ("src/components/SearchModal.tsx", "onShowToast('🗑️ 搜索历史已清空')", "onShowToast('搜索历史已清空')", 1),
    # ── GachaBurstReveal（青柠胶囊里的 ✨） ───────────────────
    ("src/components/GachaBurstReveal.tsx", "'✨ 抽到 1 款食材'", "'抽到 1 款食材'", 1),
    ("src/components/GachaBurstReveal.tsx", "`✨ 抽到 ${items.length} 款食材`", "`抽到 ${items.length} 款食材`", 1),
]

buckets: dict[pathlib.Path, str] = {}
fail = []
for rel, old, new, expect in EDITS:
    p = ROOT / rel
    buckets.setdefault(p, p.read_text(encoding="utf-8"))
    hits = buckets[p].count(old)
    if hits != expect:
        fail.append(f"{rel}  「{old}」命中 {hits} 次，期望 {expect}")
        continue
    buckets[p] = buckets[p].replace(old, new)

if fail:
    print("❌ 有替换未命中，未写入任何文件：")
    for f in fail:
        print("  -", f)
    sys.exit(1)

for p, text in buckets.items():
    p.write_text(text, encoding="utf-8")
    print(f"✓ {p.relative_to(ROOT)}")
print(f"\n共 {len(EDITS)} 处替换完成。")
