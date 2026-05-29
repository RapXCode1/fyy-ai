"use client"

import { Plus, Trash2, Settings, MessageSquare, LogOut, Sparkles } from "lucide-react"
import { useUser, UserButton } from "@clerk/nextjs"

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
  const { user, isSignedIn, isLoaded } = useUser()
  const isGuest = isLoaded && !isSignedIn

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
        <div className="w-[280px] flex flex-col h-full">
          
          {/* Header & New Chat button */}
          <div className="p-4 flex flex-col gap-4 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg fyf-gradient-bg flex items-center justify-center">
                  <span className="text-white text-xs font-black">F</span>
                </div>
                <span className="text-sm font-bold tracking-tight text-white">FYY-AI Workspace</span>
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

          {/* Chat History Section */}
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
                <p className="text-[11px] text-gray-500 font-medium">Start a new conversation</p>
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
                      borderLeft: isSelected ? "2px solid #2563FF" : "2px solid transparent",
                    }}
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    <MessageSquare
                      size={14}
                      style={{
                        color: isSelected ? "#2563FF" : "#4B5563",
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
                      className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all duration-150"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Pro Banner Upgrade info (Linear style) */}
          <div className="mx-3 mb-2 p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-yellow-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-wider">FYY Pro Tier</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-normal">
              Get priority processing, unlimited image generation, and native voice features.
            </p>
          </div>

          {/* User Account / Footer */}
          <div className="p-4 border-t border-[rgba(255,255,255,0.06)] bg-black/10 flex flex-col gap-3">
            {isGuest ? (
              <div className="flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                <div className="w-8 h-8 rounded-full border border-yellow-500/30 overflow-hidden bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold text-xs">
                  G
                </div>
                
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold truncate text-white">
                    Guest Session
                  </span>
                  <span className="text-[9px] font-medium text-yellow-500/80 truncate">
                    Limited Access (20 Chats)
                  </span>
                </div>

                <button
                  onClick={() => {
                    document.cookie = "fyy_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
                    import('@/lib/openSignIn').then(mod => mod.default()).catch(() => { window.location.href = "/sign-in" })
                  }}
                  className="w-7 h-7 flex items-center justify-center bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg transition-colors text-yellow-500 cursor-pointer"
                  title="Log in to Save Chats"
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-[#111827] flex-shrink-0">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-500/20 text-blue-400 font-bold text-xs">
                      {user?.firstName?.[0] || 'U'}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold truncate text-white">
                    {user?.fullName || 'User'}
                  </span>
                  <span className="text-[9px] text-gray-500 truncate">
                    {user?.primaryEmailAddress?.emailAddress || 'Free Tier'}
                  </span>
                </div>

                <div className="relative w-7 h-7 flex items-center justify-center bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border border-white/5">
                  <Settings size={12} className="text-gray-400" />
                  <div className="absolute inset-0 opacity-0 overflow-hidden cursor-pointer">
                    <UserButton appearance={{ elements: { avatarBox: "w-7 h-7 rounded-none" } }} />
                  </div>
                </div>
              </div>
            )}
            
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
