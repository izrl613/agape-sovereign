"use client"

import * as React from "react"
import { ShieldAlert, ShieldCheck, Lock, Trash2, Key, Info, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { generateSHA256 } from "@/lib/sha256"

interface ModuleClientContentProps {
  id: string
}

export default function ModuleClientContent({ id }: ModuleClientContentProps) {
  const [hash, setHash] = React.useState("")

  React.useEffect(() => {
    generateSHA256(`module-${id}-${Date.now()}`).then(setHash)
  }, [id])

  const moduleName = String(id).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tighter text-white uppercase">{moduleName}</h2>
          <p className="text-foreground/60 font-medium">Digital Identity Federated Footprint Module</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-neon-blue text-neon-blue px-4 py-1 font-bold">KNOXED STATUS: 74%</Badge>
          <div className="size-10 rounded-xl border border-white/10 flex items-center justify-center bg-white/5">
             <Lock size={18} className="text-foreground/40" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="glass-panel border-white/5 bg-gradient-to-br from-neon-blue/10 to-transparent">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="font-headline text-xs font-bold uppercase text-neon-blue tracking-widest">Integrity Hash</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-[10px] font-mono break-all leading-tight text-foreground/70">{hash}</p>
            <div className="mt-2 flex items-center gap-2">
               <div className="size-1.5 rounded-full bg-neon-blue animate-pulse"></div>
               <span className="text-[9px] font-bold text-neon-blue uppercase">VERIFIED SECURE</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-white/5 col-span-1 lg:col-span-3">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <h3 className="font-headline text-xl font-bold">Sovereign Decision Matrix</h3>
              <p className="text-sm text-foreground/60">This module is currently scanning for footprint exposures. Choose to Nuke (remove) or Knox (secure) items identified below.</p>
              <div className="flex gap-4">
                <Button className="bg-neon-magenta hover:bg-neon-magenta/80 text-white font-bold px-6 border-none shadow-[0_0_15px_rgba(255,46,159,0.3)]">
                  <Trash2 className="mr-2" size={16} /> MASS NUKE
                </Button>
                <Button variant="outline" className="border-neon-blue text-neon-blue hover:bg-neon-blue/10 font-bold px-6">
                  <ShieldCheck className="mr-2" size={16} /> MASS KNOX
                </Button>
              </div>
            </div>
            <div className="size-32 rounded-full border-4 border-white/5 flex items-center justify-center relative">
               <div className="absolute inset-0 rounded-full border-t-4 border-neon-blue animate-spin duration-[3s]"></div>
               <div className="text-center">
                 <p className="text-3xl font-headline font-bold">14</p>
                 <p className="text-[9px] font-bold text-foreground/40 uppercase">Findings</p>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-headline text-xl font-bold flex items-center gap-3">
          <Activity size={20} className="text-neon-magenta" /> Exposure Feed
        </h3>
        
        {[1, 2, 3].map((i) => (
          <Card key={i} className="glass-panel border-white/5 hover:border-white/10 transition-colors">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-4">
                <div className={`size-12 rounded-xl flex items-center justify-center ${i % 2 === 0 ? 'bg-neon-magenta/10 border border-neon-magenta/20' : 'bg-neon-orange/10 border border-neon-orange/20'}`}>
                   {i % 2 === 0 ? <ShieldAlert className="text-neon-magenta" /> : <Info className="text-neon-orange" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold">Exposure: Pattern Detected ({i})</h4>
                    <Badge variant="secondary" className={`${i % 2 === 0 ? 'bg-neon-magenta/20 text-neon-magenta' : 'bg-neon-orange/20 text-neon-orange'} text-[9px] border-none font-bold uppercase`}>
                      {i % 2 === 0 ? 'NUKED RECOMMENDED' : 'MONITORED'}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground/60 max-w-xl">Detected sensitive metadata patterns within your digital identity footprint. Implications include geolocational tracking and personal identification via indexed headers.</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-mono text-foreground/40">ID: SOV-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                    <span className="text-[10px] font-bold text-neon-blue flex items-center gap-1 uppercase tracking-tighter"><Activity size={10} /> Live Monitoring Active</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                 <Button variant="ghost" size="sm" className="text-neon-magenta hover:text-neon-magenta hover:bg-neon-magenta/10 font-bold text-[10px] uppercase tracking-widest">NUKE</Button>
                 <Button variant="ghost" size="sm" className="text-neon-blue hover:text-neon-blue hover:bg-neon-blue/10 font-bold text-[10px] uppercase tracking-widest">KNOX</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
