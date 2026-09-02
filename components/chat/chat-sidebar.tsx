"use client"

import { Plus, Trash2, Settings, MessageSquare, Sparkles } from "lucide-react"

interface Conversation {
  id: string
  title: string
  createdAt: Date
}

interface ChatSidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export default function ChatSidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-fade-in backdrop-blur-md"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 chat-sidebar flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}
        style={{
          width: isOpen ? "280px" : "0px",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          background: "#0E1324",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="w-[280px] flex flex-col h-full bg-[var(--fyf-surface)]">
          
          {/* Header & New Chat button */}
          <div className="p-4 flex flex-col gap-4 border-b border-[var(--fyf-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                  <img src="/brand-logo.png" alt="FYY-AI" className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-bold tracking-tight text-[var(--fyf-text)]">FYY-AI Workspace</span>
              </div>
            </div>

            <button
              onClick={onNewChat}
              className="w-full fyf-btn-primary py-2.5 justify-center flex items-center gap-2 text-xs font-semibold rounded-xl"
            >
              <Plus size={14} />
              New Chat
            </button>
          </div>

          {/* Chat History Section (Persisted Locally in User's Device) */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="px-2 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
              <span>Recents</span>
              <span className="text-[9px] font-medium text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-md">
                {conversations.length}
              </span>
            </div>

            {conversations.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare size={24} className="mx-auto text-gray-600 mb-2 opacity-50" />
                <p className="text-[11px] text-gray-500 font-medium">Mulai percakapan baru</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = currentConversationId === conv.id
                return (
                  <div
                    key={conv.id}
                    className="group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
                    style={{
                      background: isSelected ? "rgba(255, 255, 255, 0.03)" : "transparent",
                      borderLeft: isSelected ? "2px solid #E11D48" : "2px solid transparent",
                    }}
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    <MessageSquare
                      size={14}
                      style={{
                        color: isSelected ? "#E11D48" : "#4B5563",
                      }}
                      className="flex-shrink-0"
                    />
                    
                    <span
                      className="text-xs font-medium truncate flex-1 pr-6"
                      style={{
                        color: isSelected ? "#FFFFFF" : "#9CA3AF",
                      }}
                    >
                      {conv.title || "Untitled Conversation"}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteConversation(conv.id)
                      }}
                      className="absolute right-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 text-[var(--fyf-text-secondary)] hover:text-red-500 transition-all duration-150"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* User Account / Local Profile Footer */}
          <div className="p-4 border-t border-[var(--fyf-border)] bg-[var(--fyf-bg)] flex flex-col gap-3">
            <div className="flex items-center gap-3 p-2 rounded-xl border border-[var(--fyf-border)] bg-[var(--fyf-surface)]">
              <div className="w-8 h-8 rounded-full border border-rose-500/30 overflow-hidden bg-rose-500/10 flex items-center justify-center text-rose-400 font-bold text-xs">
                <Sparkles size={14} />
              </div>
              
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold truncate text-[var(--fyf-text)]">
                  FYY-AI User
                </span>
                <span className="text-[9px] text-emerald-400 font-medium truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Full Access (Tersimpan di HP)
                </span>
              </div>
            </div>
            
            <div className="px-1 text-center sm:text-left">
              <p className="text-[8px] uppercase tracking-widest text-gray-500 font-black">FYY-GROQ SYSTEM INTELLIGENCE</p>
              <p className="text-[8px] text-gray-600 mt-0.5 font-medium">© 2026 FYY-AI · Built by RapXCode</p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
