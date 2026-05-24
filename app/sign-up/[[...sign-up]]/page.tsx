"use client"

import { SignUp } from "@clerk/nextjs";
import { ShieldCheck, User } from "lucide-react";

export default function Page() {
  const handleEnterGuestMode = () => {
    const date = new Date();
    date.setTime(date.getTime() + (24 * 60 * 60 * 1000)); // 1 day
    document.cookie = `fyy_guest=true; path=/; expires=${date.toUTCString()}; SameSite=Strict`;
    window.location.href = "/chat";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative z-10 p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="mb-6 text-center animate-fade-in">
          <h1 className="text-4xl font-black italic tracking-tighter text-foreground bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 bg-clip-text text-transparent pr-2 inline-block">
            FYY-AI
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Create your secure account</p>
        </div>
        
        <SignUp 
          path="/sign-up" 
          routing="path" 
          signInUrl="/sign-in" 
          appearance={{
            elements: {
              card: "bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-border/50 hover:bg-muted/50 text-foreground transition-all",
              formButtonPrimary: "bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white transition-all border-none",
              footerActionLink: "text-cyan-500 hover:text-cyan-400",
              formFieldLabel: "text-foreground",
              formFieldInput: "bg-background border-border/50 text-foreground",
              dividerLine: "bg-border/50",
              dividerText: "text-muted-foreground",
              footerActionText: "text-muted-foreground"
            }
          }} 
        />

        <button
          onClick={handleEnterGuestMode}
          className="mt-4 w-full py-3 px-4 rounded-xl border border-dashed border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/15 text-cyan-400 hover:text-cyan-300 font-bold text-sm tracking-wide transition-all duration-300 hover:scale-102 flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden group shadow-lg shadow-cyan-500/5"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <User size={16} className="relative z-10" />
          <span className="relative z-10">Masuk Sebagai Tamu (Guest Mode)</span>
        </button>
 
        <div className="mt-8 flex flex-col items-center gap-1 text-xs text-muted-foreground/60 font-medium animate-fade-in">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-cyan-500/70" />
            <span>Fyy Security Protocol</span>
          </div>
          <span>Engineered by RapXCode</span>
        </div>
      </div>
    </div>
  );
}
