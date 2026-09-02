"use client"

import { useState, useEffect } from "react"
import { User, ShieldCheck, Sparkles, X, Heart, Check, HelpCircle } from "lucide-react"

export interface UserProfile {
  name: string
  age: string
}

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentProfile: UserProfile
  onSaveProfile: (profile: UserProfile) => void
  isInitialPrompt?: boolean
}

export default function UserProfileModal({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
  isInitialPrompt = false,
}: UserProfileModalProps) {
  const [name, setName] = useState(currentProfile.name || "")
  const [age, setAge] = useState(currentProfile.age || "")
  const [error, setError] = useState("")

  useEffect(() => {
    setName(currentProfile.name || "")
    setAge(currentProfile.age || "")
  }, [currentProfile])

  if (!isOpen) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) {
      setError("Silakan masukkan nama atau nama panggilanmu.")
      return
    }

    if (cleanName.length > 30) {
      setError("Nama terlalu panjang (maksimal 30 karakter).")
      return
    }

    setError("")
    onSaveProfile({
      name: cleanName,
      age: age.trim(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[var(--fyf-surface)] border border-[var(--fyf-border)] rounded-3xl p-6 sm:p-7 shadow-2xl animate-scale-in text-left">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--fyf-text)] flex items-center gap-1.5">
                {isInitialPrompt ? "Kenalan dengan FYY-AI" : "Profil Pengguna"}
                <Sparkles size={14} className="text-rose-400" />
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Biar asisten AI mengenalmu dan menyapamu dengan akrab
              </p>
            </div>
          </div>

          {!isInitialPrompt && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition"
              title="Tutup"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Nama / Nama Panggilan <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError("")
                }}
                placeholder="Contoh: Rhafi, Alex, Alya..."
                maxLength={30}
                className="w-full px-4 py-3 bg-[var(--fyf-bg)] border border-[var(--fyf-border)] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Umur / Usia (Tahun)</span>
              <span className="text-[10px] text-gray-500 lowercase font-normal">opsional</span>
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Contoh: 19, 24, 30..."
              min={5}
              max={120}
              className="w-full px-4 py-3 bg-[var(--fyf-bg)] border border-[var(--fyf-border)] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium">{error}</p>
          )}

          {/* Privacy & Trust Assurance Notice */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-gray-300">
              <span className="font-semibold text-emerald-300">100% Privat & Aman di HP-mu.</span> Data ini hanya disimpan di browser/perangkat lokalmu (tanpa registrasi/password) agar respon FYY-AI lebih personal dan tidak kaku.
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check size={14} />
              Simpan & Mulai Ngobrol
            </button>

            {isInitialPrompt && (
              <button
                type="button"
                onClick={() => {
                  onSaveProfile({ name: "Pengguna FYY", age: "" })
                  onClose()
                }}
                className="py-3 px-4 bg-white/[0.05] hover:bg-white/10 text-gray-400 hover:text-white font-medium text-xs rounded-xl transition"
              >
                Lewati Dulu
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  )
}
