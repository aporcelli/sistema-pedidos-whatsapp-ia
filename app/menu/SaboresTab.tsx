'use client'

import { useEffect, useState } from 'react'
import { getFlavors, toggleFlavor, addFlavor, renameFlavor, deleteFlavor } from '@/lib/queries'
import { Flavor } from '@/types/database'
import Modal from './Modal'

export default function SaboresTab() {
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editFlavor, setEditFlavor] = useState<Flavor | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Flavor | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getFlavors().then(setFlavors).finally(() => setLoading(false))
  }, [])

  async function handleToggle(flavor: Flavor) {
    setFlavors(prev => prev.map(f => f.id === flavor.id ? { ...f, available: !f.available } : f))
    setToggling(flavor.id)
    try {
      await toggleFlavor(flavor.id, !flavor.available)
    } catch {
      setFlavors(prev => prev.map(f => f.id === flavor.id ? { ...f, available: flavor.available } : f))
    } finally {
      setToggling(null)
    }
  }

  async function handleSaveEdit() {
    if (!editFlavor) return
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === editFlavor.name) { setEditFlavor(null); return }
    setSavingEdit(true)
    try {
      await renameFlavor(editFlavor.id, trimmed)
      setFlavors(prev => prev.map(f => f.id === editFlavor.id ? { ...f, name: trimmed } : f))
      setEditFlavor(null)
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteFlavor(deleteTarget.id)
      setFlavors(prev => prev.filter(f => f.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  async function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) return
    setAdding(true)
    try {
      const created = await addFlavor(trimmed)
      setFlavors(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  const activos = flavors.filter(f => f.available).length
  const inactivos = flavors.filter(f => !f.available).length

  return (
    <>
      {/* Modal editar */}
      {editFlavor && (
        <Modal onClose={() => setEditFlavor(null)}>
          <h3 className="font-bold text-gray-900 mb-4">Editar sabor</h3>
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 mb-4"
          />
          <div className="flex gap-2">
            <button onClick={() => setEditFlavor(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500">Cancelar</button>
            <button onClick={handleSaveEdit} disabled={savingEdit} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium disabled:opacity-50">
              {savingEdit ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal eliminar */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <h3 className="font-bold text-gray-900 mb-2">Eliminar sabor</h3>
          <p className="text-sm text-gray-500 mb-5">
            ¿Querés eliminar <span className="font-semibold text-gray-800">{deleteTarget.name}</span>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500">Cancelar</button>
            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium disabled:opacity-50">
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Resumen activos/inactivos */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{activos}</p>
          <p className="text-xs text-green-600">Activos</p>
        </div>
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-400">{inactivos}</p>
          <p className="text-xs text-gray-400">Inactivos</p>
        </div>
      </div>

      {/* Agregar sabor */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Nuevo sabor..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="bg-brand-500 text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40 active:bg-brand-600"
        >
          {adding ? '...' : 'Agregar'}
        </button>
      </div>

      {/* Lista de sabores */}
      <div className="space-y-2">
        {flavors.map(flavor => (
          <div key={flavor.id} className={`bg-white rounded-2xl border-2 transition-all ${flavor.available ? 'border-gray-200' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3 p-4">
              {/* Toggle activo/inactivo */}
              <button onClick={() => handleToggle(flavor)} disabled={toggling === flavor.id} className="shrink-0">
                <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${flavor.available ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${flavor.available ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </button>
              <span className={`flex-1 font-medium ${flavor.available ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                {flavor.name}
              </span>
              {/* Botón editar */}
              <button onClick={() => { setEditFlavor(flavor); setEditValue(flavor.name) }} className="p-1.5 text-gray-400 hover:text-brand-500 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              {/* Botón eliminar */}
              <button onClick={() => setDeleteTarget(flavor)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
        {flavors.length === 0 && (
          <p className="text-center py-16 text-gray-400">No hay sabores cargados todavía</p>
        )}
      </div>
    </>
  )
}
