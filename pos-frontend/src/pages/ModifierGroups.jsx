import { useEffect, useState } from 'react'
import { getModifierGroups, createModifierGroup, updateModifierGroup, deleteModifierGroup, addModifier, deleteModifier } from '../api/modifiers'
import { getProducts } from '../api/products'
import { Plus, Trash2, Edit, X, Save, Loader, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../components/Toast'
import useSettingsStore from '../store/useSettingsStore'
import { t } from '../lib/i18n'

const fmt = (n) => Number(n || 0).toLocaleString('ru', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function ModifierGroups() {
  const toast = useToast()
  const { language: lang = 'tg' } = useSettingsStore()
  const [groups, setGroups] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [editGroup, setEditGroup] = useState(null)
  const [saving, setSaving] = useState(false)

  // New group form
  const [newGroup, setNewGroup] = useState({ name: '', required: false, max_select: 1, product_ids: [] })
  const [showNewGroup, setShowNewGroup] = useState(false)

  // New modifier form per group
  const [newMod, setNewMod] = useState({})  // { groupId: { name, price } }

  const load = async () => {
    setLoading(true)
    try {
      const [g, p] = await Promise.all([getModifierGroups(), getProducts()])
      setGroups(g.data.results || g.data)
      setProducts((p.data.results || p.data).filter((x) => x.is_active && !x.is_ingredient))
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return
    setSaving(true)
    try {
      await createModifierGroup(newGroup)
      toast(t(lang, 'mods_group_created'), 'success')
      setNewGroup({ name: '', required: false, max_select: 1, product_ids: [] })
      setShowNewGroup(false)
      load()
    } catch { toast(t(lang, 'error'), 'error') }
    finally { setSaving(false) }
  }

  const handleDeleteGroup = async (id) => {
    if (!confirm(t(lang, 'mods_del_confirm'))) return
    try {
      await deleteModifierGroup(id)
      toast(t(lang, 'mods_group_deleted'))
      load()
    } catch { toast(t(lang, 'error'), 'error') }
  }

  const handleAddModifier = async (groupId) => {
    const m = newMod[groupId] || {}
    if (!m.name?.trim()) return
    setSaving(true)
    try {
      await addModifier(groupId, { name: m.name, price: parseFloat(m.price) || 0, sort_order: 0 })
      toast(t(lang, 'mods_mod_added'), 'success')
      setNewMod({ ...newMod, [groupId]: { name: '', price: '' } })
      load()
    } catch { toast(t(lang, 'error'), 'error') }
    finally { setSaving(false) }
  }

  const handleDeleteModifier = async (groupId, mid, name) => {
    try {
      await deleteModifier(groupId, mid)
      toast(`«${name}» ${t(lang, 'mods_mod_deleted')}`)
      load()
    } catch { toast(t(lang, 'error'), 'error') }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t(lang, 'mods_title')}</h1>
          <p className="text-sm text-gray-400">{t(lang, 'mods_sub')}</p>
        </div>
        <button onClick={() => setShowNewGroup(true)}
          className="btn-primary flex items-center gap-2">
          <Plus size={16} /> {t(lang, 'mods_new_group_btn')}
        </button>
      </div>

      {/* New group form */}
      {showNewGroup && (
        <div className="bg-white rounded-2xl border-2 border-indigo-200 p-5 animate-scale-in">
          <h3 className="font-bold text-gray-700 mb-4">{t(lang, 'mods_new_group_title')}</h3>
          <div className="space-y-3">
            <div>
              <label className="label">{t(lang, 'mods_group_name')}</label>
              <input className="input" placeholder={t(lang, 'mods_group_name_ph')} value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t(lang, 'mods_max_select')}</label>
                <input className="input" type="number" min="1" max="10" value={newGroup.max_select}
                  onChange={(e) => setNewGroup({ ...newGroup, max_select: Number(e.target.value) })} />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-indigo-600"
                    checked={newGroup.required}
                    onChange={(e) => setNewGroup({ ...newGroup, required: e.target.checked })} />
                  <span className="text-sm text-gray-700">{t(lang, 'mods_required_chk')}</span>
                </label>
              </div>
            </div>
            <div>
              <label className="label">{t(lang, 'mods_products_lbl')}</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {products.map((p) => {
                  const checked = newGroup.product_ids.includes(p.id)
                  return (
                    <button key={p.id} type="button"
                      onClick={() => setNewGroup({
                        ...newGroup,
                        product_ids: checked
                          ? newGroup.product_ids.filter((x) => x !== p.id)
                          : [...newGroup.product_ids, p.id]
                      })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        checked ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p.name}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreateGroup} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                {t(lang, 'mods_save')}
              </button>
              <button onClick={() => setShowNewGroup(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium">
                {t(lang, 'mods_cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-indigo-400" /></div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Tag size={36} className="mx-auto mb-3 opacity-20" />
          <p>{t(lang, 'mods_no_groups')}</p>
          <p className="text-xs mt-1">{t(lang, 'mods_hint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isExpanded = expanded === group.id
            const mod = newMod[group.id] || { name: '', price: '' }
            return (
              <div key={group.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up">
                <button
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : group.id)}
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Tag size={16} className="text-indigo-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-gray-800">{group.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {group.modifiers.length} {t(lang, 'mods_variants')} ·
                      {group.required ? ` ${t(lang, 'mods_required_lbl')}` : ` ${t(lang, 'mods_optional_lbl')}`} ·
                      {t(lang, 'mods_max_lbl')}: {group.max_select}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id) }}
                    className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-300 shrink-0" /> : <ChevronDown size={16} className="text-gray-300 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    {/* Existing modifiers */}
                    <div className="space-y-2 mt-3 mb-4">
                      {group.modifiers.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">{t(lang, 'mods_no_variants')}</p>
                      ) : (
                        group.modifiers.map((m) => (
                          <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                            <span className="text-sm font-semibold text-gray-700">{m.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-indigo-600">
                                {m.price > 0 ? `+${fmt(m.price)} ${t(lang, 'currency')}` : t(lang, 'mods_free')}
                              </span>
                              <button
                                onClick={() => handleDeleteModifier(group.id, m.id, m.name)}
                                className="text-gray-300 hover:text-red-400 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add new modifier */}
                    <div className="flex gap-2">
                      <input
                        className="input flex-1 py-2 text-sm"
                        placeholder={t(lang, 'mods_variant_ph')}
                        value={mod.name}
                        onChange={(e) => setNewMod({ ...newMod, [group.id]: { ...mod, name: e.target.value } })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddModifier(group.id)}
                      />
                      <input
                        className="input w-28 py-2 text-sm"
                        type="number"
                        min="0"
                        placeholder={t(lang, 'mods_price_ph')}
                        value={mod.price}
                        onChange={(e) => setNewMod({ ...newMod, [group.id]: { ...mod, price: e.target.value } })}
                      />
                      <button
                        onClick={() => handleAddModifier(group.id)}
                        disabled={saving}
                        className="btn-primary px-4 py-2 text-sm shrink-0"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
