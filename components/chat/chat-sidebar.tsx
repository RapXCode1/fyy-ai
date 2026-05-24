"use client"

import { Plus, Trash2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div className={`fixed lg:relative inset-y-0 left-0 z-50 chat-sidebar flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? "w-72 opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-full lg:translate-x-0"
      }`}>
        {/* Inner container with fixed width to prevent content squishing during transition */}
        <div className="w-72 flex flex-col h-full">
        {/* New Chat Button */}
        <div className="p-5 border-b border-border/50 bg-gradient-to-b from-card/60 to-card/40">
          <Button
            onClick={onNewChat}
            className="w-full bg-primary text-primary-foreground border-0 justify-center gap-3 rounded-lg py-3 font-semibold transition-all duration-200 hover:bg-primary/90"
          >
            <Plus size={18} />
            New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>
          ) : (
            conversations.map((conversation, index) => (
              <div
                key={conversation.id}
                className={`group relative p-3 rounded-md cursor-pointer transition-all duration-200 ${
                  currentConversationId === conversation.id
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <p className="text-sm font-medium text-foreground truncate">
                  {conversation.title}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteConversation(conversation.id)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all duration-200"
                >
                  <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-border/50 bg-gradient-to-t from-card/60 to-transparent flex flex-col gap-4">
          {isGuest ? (
            <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border border-border/30 hover:bg-muted/50 transition-colors group/account">
              <div className="w-8 h-8 rounded-full border border-border/50 shadow-sm overflow-hidden bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-xs">
                G
              </div>
              
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-bold truncate text-foreground/90">
                  Tamu (Guest Mode)
                </span>
                <span className="text-[10px] font-medium text-amber-500/80 truncate">
                  Trial Terbatas (20 Chat)
                </span>
              </div>

              <button
                onClick={() => {
                  document.cookie = "fyy_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
                  window.location.href = "/sign-in";
                }}
                className="w-8 h-8 flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/25 rounded-lg transition-colors border border-amber-500/25 text-amber-500 cursor-pointer"
                title="Keluar dari Guest Mode"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border border-border/30 hover:bg-muted/50 transition-colors group/account">
              {/* Static Avatar for visual */}
              <div className="w-8 h-8 rounded-full border border-border/50 shadow-sm overflow-hidden bg-background">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold text-xs">
                    {user?.firstName?.[0] || 'U'}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-bold truncate text-foreground/90">
                  {user?.fullName || 'User'}
                </span>
                <span className="text-[10px] font-medium text-cyan-500/80 truncate">
                  {user?.primaryEmailAddress?.emailAddress || 'Free Tier'}
                </span>
              </div>

              {/* Settings Button that overlays the actual invisible Clerk UserButton */}
              <div className="relative w-8 h-8 flex items-center justify-center bg-background/50 rounded-lg hover:bg-muted transition-colors cursor-pointer border border-border/50">
                <Settings size={14} className="text-muted-foreground transition-colors group-hover/account:text-cyan-400 group-hover/account:animate-spin-slow" />
                <div className="absolute inset-0 opacity-0 overflow-hidden cursor-pointer">
                  <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-none" } }} />
                </div>
              </div>
            </div>
          )}
          <div>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-black">FYY-GROQ SYSTEM INTELLIGENCE (FYY-LLM)</p>
            <p className="text-[9px] text-muted-foreground/40 mt-0.5 font-medium">© 2026 FYY-AI by RapXCode</p>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
