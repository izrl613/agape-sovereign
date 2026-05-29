import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatComplete, chatStream } from '../services/localAIService';
import { useAuth } from '../AuthContext';
import { useScan } from '../ScanContext';
import { NEON, NeonText, NeonButton, GlassCard } from './UI';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Trash2, Sparkles, ThumbsUp, ThumbsDown, Paperclip, X, FileText, Check, AlertTriangle, Rss, ShieldAlert, Globe, Shield, Share2, History, Search, Mail, Users, Zap, ShieldCheck, Download } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, addDoc, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

import { updateFindingStatus, recalculateSovereignScore, ScanFinding, generateSuspiciousReport } from '../services/scanService';
import { logAIChatMessage, logUserEvent } from '../services/analyticsService';
import { getFeatureFlag } from '../services/remoteConfigService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  feedback?: 'up' | 'down';
  attachment?: { name: string; content: string };
  remediationFor?: string; // findingId
  isAlert?: boolean;
}

import { toast } from 'sonner';

interface ScanHistoryItem {
  id: string;
  userId: string;
  timestamp: Date;
  score: number;
  findings: ScanFinding[];
}

export const ArchitectAI = () => {
  const { user, sovereignScore } = useAuth();
  const { findings, triggerFullScan, triggerModuleScan, isScanning, scanProgress, currentModule, currentSubTask, currentStep, totalSteps } = useScan();
  const [notifiedThreats, setNotifiedThreats] = useState<Set<string>>(new Set());
  
  const stats = {
    nuked: findings.filter(f => f.status === 'NUKED').length,
    knoxed: findings.filter(f => f.status === 'KNOXED').length,
    monitored: findings.filter(f => f.status === 'MONITORED').length,
  };

  const getDefaultMessage = (): Message => ({
    id: '1',
    role: 'model',
    text: `Greetings, Sovereign ${user?.displayName || 'User'}. I am Architect AI — your real-time Digital Identity Federated Footprint intelligence engine.

I have analyzed your 16-layer identity vector profile. Your Sovereign Score is currently **${sovereignScore}/100**.

- 🔥 **${stats.nuked} NUKED** exposures identified across data brokers and breach databases.
- 🛡️ **${stats.knoxed} KNOXED** vectors hardened and secured.
- 👁️ **${stats.monitored} MONITORED** vectors under active surveillance.

What aspect of your digital sovereignty would you like to reclaim today?`,
    timestamp: new Date()
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<{name: string, content: string} | null>(null);
  const [showNukedBanner, setShowNukedBanner] = useState(true);
  const [threatFeed, setThreatFeed] = useState<{ title: string; severity: 'Critical' | 'High' | 'Medium' | 'Low'; source: string; time: string; vector: string; description: string }[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [alertedThreats, setAlertedThreats] = useState<string[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [selectedHistoryScan, setSelectedHistoryScan] = useState<ScanHistoryItem | null>(null);
  const [expandedScanId, setExpandedScanId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'history' | 'remediation'>('history');
  const [showHardeningModal, setShowHardeningModal] = useState(false);
  const [hardeningCode, setHardeningCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'Critical' | 'High' | 'Medium' | 'Low'>('ALL');
  const [isDarkWebScanEnabled, setIsDarkWebScanEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Initialize feature flags
  useEffect(() => {
    setIsDarkWebScanEnabled(getFeatureFlag('enable_dark_web_scan'));
  }, []);

  // Load scan history
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'score_history'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as ScanHistoryItem)).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setScanHistory(history);
    }, (error) => {
      console.error("Error fetching scan history:", error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Load chat history from Firestore
  useEffect(() => {
    if (!user?.uid) {
      setMessages([]);
      setIsHistoryLoaded(false);
      return;
    }

    const loadHistory = async () => {
      // Handle emergency bypass user with local storage
      if (user.uid === 'emergency-bypass-admin-999') {
        const localHistory = localStorage.getItem(`chat_history_${user.uid}`);
        if (localHistory) {
          try {
            const parsed = JSON.parse(localHistory);
            setMessages(parsed.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            })));
          } catch (e) {
            setMessages([getDefaultMessage()]);
          }
        } else {
          setMessages([getDefaultMessage()]);
        }
        setIsHistoryLoaded(true);
        return;
      }

      try {
        const sessionRef = doc(db, 'chat_sessions', user.uid);
        const sessionSnap = await getDoc(sessionRef);

        if (sessionSnap.exists()) {
          const data = sessionSnap.data();
          if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(data.messages.map((m: Record<string, unknown>) => ({
              ...m,
              timestamp: (m.timestamp as any)?.toDate?.() || new Date()
            })) as Message[]);
          } else {
            setMessages([getDefaultMessage()]);
          }
        } else {
          // No history found, set default message
          setMessages([getDefaultMessage()]);
          // Create initial session in Firestore
          await setDoc(sessionRef, {
            userId: user.uid,
            messages: [getDefaultMessage()],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (e) {
        console.error("Failed to load chat history from Firestore", e);
        handleFirestoreError(e, OperationType.GET, `chat_sessions/${user.uid}`);
        setMessages([getDefaultMessage()]);
      } finally {
        setIsHistoryLoaded(true);
      }
    };

    loadHistory();
  }, [user?.uid]);

  // Save chat history to Firestore
  const saveHistory = useCallback(async (currentMessages: Message[]) => {
    if (!user?.uid || !isHistoryLoaded || currentMessages.length === 0) return;

    // Handle emergency bypass user with local storage
    if (user.uid === 'emergency-bypass-admin-999') {
      localStorage.setItem(`chat_history_${user.uid}`, JSON.stringify(currentMessages));
      return;
    }

    try {
      const sessionRef = doc(db, 'chat_sessions', user.uid);
      await setDoc(sessionRef, {
        userId: user.uid,
        messages: currentMessages.map(m => ({
          id: m.id,
          role: m.role,
          text: m.text,
          timestamp: m.timestamp,
          feedback: m.feedback || null,
          attachment: m.attachment || null,
          isAlert: m.isAlert || false,
          remediationFor: m.remediationFor || null
        })),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error("Failed to save chat history to Firestore", e);
    }
  }, [user?.uid, isHistoryLoaded]);

  // Periodic auto-save every 30 seconds
  useEffect(() => {
    if (!user?.uid || !isHistoryLoaded || messages.length === 0) return;
    
    const intervalId = setInterval(() => {
      saveHistory(messages);
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [messages, saveHistory, user?.uid, isHistoryLoaded]);

  // Immediate save when a new message is added (user or final model response)
  const prevMessageCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      // If the last message is from the user, or if it's a model message that isn't currently streaming (isLoading is false)
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'user' || !isLoading) {
        saveHistory(messages);
        prevMessageCount.current = messages.length;
      }
    } else if (messages.length < prevMessageCount.current) {
      // Handle clear chat
      prevMessageCount.current = messages.length;
    }
  }, [messages, saveHistory, isLoading]);

  const clearChat = async () => {
    if (!user?.uid) return;
    const defaultMsg = getDefaultMessage();
    setMessages([defaultMsg]);
    
    try {
      const sessionRef = doc(db, 'chat_sessions', user.uid);
      await setDoc(sessionRef, {
        userId: user.uid,
        messages: [defaultMsg],
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error("Failed to clear chat history in Firestore", e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch Threat Intelligence Feed
  useEffect(() => {
    const fetchThreatFeed = async () => {
      setIsFeedLoading(true);
      try {
        const prompt = "Search for the latest, high-impact cybersecurity threats and data breaches reported in the last 24-48 hours, specifically focusing on data brokers, identity theft, and personal data exposures. Return a curated list of 4-5 items as a JSON array of objects with: title, severity (Critical/High/Medium/Low), source (the news outlet or security firm), time (e.g. '2h ago'), vector (one of: email, social, device, mobile, deepweb, broker, password, location, browser, financial, medical, biometric, iot, cloud, darkweb, behavioral), and description (a short summary). Ensure the threats are real and current.";
        const response = await chatComplete(prompt, undefined, true);
        const data = JSON.parse(response.text || "[]");
        setThreatFeed(data);
      } catch (error) {
        console.error("Failed to fetch threat feed:", error);
        // Fallback data if search fails
        setThreatFeed([
          { title: "Zero-day exploit in major data broker API detected", severity: "High", source: "Sovereign Intel", time: "1h ago", vector: "broker", description: "A critical vulnerability in a leading data broker's API allows unauthorized access to consumer profiles." },
          { title: "New phishing campaign targeting ECRA 2026 credentials", severity: "Medium", source: "Global Threat Map", time: "3h ago", vector: "email", description: "Malicious emails are circulating that mimic official ECRA communications to steal login credentials." },
          { title: "Data breach at 'IdentityGuard' exposes 2M records", severity: "High", source: "DarkWeb Monitor", time: "5h ago", vector: "financial", description: "A major identity protection service has suffered a breach, leaking sensitive financial information." },
          { title: "Update: GDPR-2 enforcement protocols tightened", severity: "Low", source: "EU Privacy Board", time: "8h ago", vector: "browser", description: "New regulations regarding browser tracking and cookie consent are being strictly enforced." }
        ]);
      } finally {
        setIsFeedLoading(false);
      }
    };

    fetchThreatFeed();
    const interval = setInterval(fetchThreatFeed, 300000); // Refresh every 5 mins
    return () => clearInterval(interval);
  }, []);

  // Proactive Alert Mechanism: Re-evaluate findings against threat feed
  useEffect(() => {
    if (threatFeed.length === 0 || findings.length === 0 || isLoading || !isHistoryLoaded) return;

    const highRiskThreats = threatFeed.filter(t => t.severity === 'High' || t.severity === 'Critical');
    const newAlerts: { threat: string, text: string, isNuked: boolean }[] = [];

    highRiskThreats.forEach(threat => {
      // Check for NUKED correlation (highest priority)
      const relatedNuked = findings.filter(f => 
        f.status === 'NUKED' && (
          threat.title.toLowerCase().includes(f.module.toLowerCase()) ||
          f.finding.toLowerCase().includes(threat.title.toLowerCase().split(' ')[0])
        )
      );

      // Check for KNOXED correlation (secondary priority)
      const relatedKnoxed = findings.filter(f => 
        f.status === 'KNOXED' && (
          threat.title.toLowerCase().includes(f.module.toLowerCase()) ||
          f.finding.toLowerCase().includes(threat.title.toLowerCase().split(' ')[0])
        )
      );

      // Notify via toast if not already notified
      if (!notifiedThreats.has(threat.title)) {
        const isCritical = threat.severity === 'Critical';
        const hasCorrelation = relatedNuked.length > 0 || relatedKnoxed.length > 0;
        
        toast[isCritical || relatedNuked.length > 0 ? 'error' : 'warning'](
          relatedNuked.length > 0 ? `🚨 CRITICAL CORRELATION DETECTED` : (relatedKnoxed.length > 0 ? `🛡️ HARDENED VECTOR AT RISK` : `${threat.severity.toUpperCase()} SEVERITY THREAT DETECTED`), 
          {
            description: relatedNuked.length > 0 
              ? `Threat "${threat.title}" correlates with your NUKED ${relatedNuked[0].module.toUpperCase()} vector!`
              : (relatedKnoxed.length > 0 ? `Threat "${threat.title}" impacts your KNOXED ${relatedKnoxed[0].module.toUpperCase()} vector. Re-verification recommended.` : threat.title),
            duration: 12000,
            icon: <ShieldAlert className={`w-5 h-5 ${isCritical || relatedNuked.length > 0 ? 'text-red-500' : 'text-orange-500'}`} />,
            action: relatedKnoxed.length > 0 ? {
              label: 'RE-VERIFY',
              onClick: () => {
                if (isScanning) {
                  toast.error("SCAN IN PROGRESS", {
                    description: "Please wait for the current scan to complete."
                  });
                  return;
                }
                triggerModuleScan(relatedKnoxed[0].module);
                toast.info("RE-VERIFICATION INITIATED", {
                  description: `Targeted scan of ${relatedKnoxed[0].module.toUpperCase()} vector started.`
                });
              }
            } : (relatedNuked.length > 0 ? {
              label: 'REMEDIATE',
              onClick: () => handleSend(undefined, `Initiate emergency remediation protocol for NUKED finding: [${relatedNuked[0].module.toUpperCase()}] ${relatedNuked[0].finding}.`, relatedNuked[0].id)
            } : undefined)
          }
        );
        setNotifiedThreats(prev => new Set(prev).add(threat.title));
      }

      if (alertedThreats.includes(threat.title)) return;

      if (relatedNuked.length > 0) {
        relatedNuked.forEach(f => {
          newAlerts.push({
            threat: threat.title,
            isNuked: true,
            text: `🚨 **CRITICAL CORRELATION DETECTED**: The high-severity threat **"${threat.title}"** directly exploits your **NUKED** exposure: **[${f.module.toUpperCase()}] ${f.finding}**. This vector is now under active global exploitation. Immediate remediation is required to prevent identity hijacking.\n\n[REMEDIATE NOW](remediate-finding:${f.id}) [MARK AS HARDENED](confirm-remediation:${f.id})`
          });
        });
      } else if (relatedKnoxed.length > 0) {
        relatedKnoxed.forEach(f => {
          newAlerts.push({
            threat: threat.title,
            isNuked: false,
            text: `🛡️ **HARDENED VECTOR AT RISK**: The high-severity threat **"${threat.title}"** correlates with your **KNOXED** ${f.module.toUpperCase()} vector. While this vector is currently hardened, this new threat profile suggests a re-verification or additional hardening might be necessary to maintain sovereignty.\n\n[RE-VERIFY VECTOR](reverify-module:${f.module}) [HARDEN FURTHER](harden-finding:${f.id})`
          });
        });
      } else {
        // Check for general module correlation or keyword match
        const relatedModule = findings.find(f => 
          threat.title.toLowerCase().includes(f.module.toLowerCase()) ||
          f.finding.toLowerCase().includes(threat.title.toLowerCase().split(' ')[0])
        );

        if (relatedModule) {
          const alertType = relatedModule.status === 'NUKED' ? 'CRITICAL ESCALATION' : 'NEW THREAT VECTOR';
          newAlerts.push({
            threat: threat.title,
            isNuked: relatedModule.status === 'NUKED',
            text: `⚠️ **${alertType}**: The threat **"${threat.title}"** impacts your **${relatedModule.module.toUpperCase()}** vector (Status: ${relatedModule.status}). Re-evaluation recommended.\n\n[RE-SCAN NOW](rescan-now)`
          });
        } else if (threat.severity === 'Critical') {
          // Add critical global threats even if not directly correlated
          newAlerts.push({
            threat: threat.title,
            isNuked: false,
            text: `🌐 **GLOBAL CRITICAL THREAT**: **"${threat.title}"** is currently trending in global intelligence feeds. While no direct correlation to your current findings was detected, its high impact warrants awareness.\n\n[ANALYZE THREAT](analyze-threat:${encodeURIComponent(threat.title)})`
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      const hasNukedAlert = newAlerts.some(a => a.isNuked);
      const alertMessage: Message = {
        id: `alert-${Date.now()}`,
        role: 'model',
        isAlert: hasNukedAlert,
        text: hasNukedAlert 
          ? `⚠️ **URGENT: CRITICAL THREAT CORRELATION DETECTED**\n\nMy real-time surveillance has identified global threats that directly exploit your **NUKED** exposures:\n\n${newAlerts.map(a => `- ${a.text}`).join('\n')}\n\nI recommend immediate remediation of these vectors to prevent active identity hijacking.`
          : `⚠️ **PROACTIVE ALERT: THREAT CORRELATION DETECTED**\n\nMy real-time surveillance has identified global threats that directly correlate with your identity profile:\n\n${newAlerts.map(a => `- ${a.text}`).join('\n')}\n\nWould you like me to initiate an emergency hardening protocol for these vectors?`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, alertMessage]);
      setAlertedThreats(prev => [...prev, ...newAlerts.map(a => a.threat)]);
    }
  }, [threatFeed, findings, isLoading, isHistoryLoaded, alertedThreats]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const permittedExtensions = ['.txt', '.json', '.js', '.ts', '.tsx', '.jsx', '.md', '.html', '.css'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!permittedExtensions.includes(fileExtension)) {
      toast.error("INVALID FILE TYPE", {
        description: `Architect AI only accepts text-based files (${permittedExtensions.join(', ')}).`,
        duration: 5000,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachment({ name: file.name, content });
      setInput(prev => prev.trim() ? prev : `Please analyze ${file.name} for security vulnerabilities and suggest remediation steps.`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Only set dragging to false if we're leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const permittedExtensions = ['.txt', '.json', '.js', '.ts', '.tsx', '.jsx', '.md', '.html', '.css'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!permittedExtensions.includes(fileExtension)) {
      toast.error("INVALID FILE TYPE", {
        description: `Architect AI only accepts text-based files (${permittedExtensions.join(', ')}).`,
        duration: 5000,
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachment({ name: file.name, content });
      setInput(prev => prev.trim() ? prev : `Please analyze ${file.name} for security vulnerabilities and suggest remediation steps.`);
    };
    reader.readAsText(file);
  };

  const handleConfirmRemediation = async (findingId: string) => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const success = await updateFindingStatus(findingId, 'KNOXED');
      if (success) {
        await recalculateSovereignScore(user.uid);
        toast.success("VECTOR HARDENED", {
          description: "Finding status updated to KNOXED. Sovereign Score recalculated.",
          duration: 5000,
          icon: <Shield className="w-5 h-5 text-green-500" />
        });
        
        // Add a confirmation message from the AI
        const confirmationMsg: Message = {
          id: Date.now().toString(),
          role: 'model',
          text: `✅ **REMEDIATION CONFIRMED**\n\nI have successfully updated the status of this finding to **KNOXED**. Your Sovereign Score has been recalculated to reflect this hardening. Your digital identity is now more resilient against this specific vector.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, confirmationMsg]);
      }
    } catch (error) {
      console.error("Remediation confirmation failed:", error);
      toast.error("HARDENING FAILED", {
        description: "Failed to update finding status. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 212, 255); // NEON.blue
    doc.text("AGAPE SOVEREIGN ENCLAVE 2026", 14, 22);
    
    doc.setFontSize(16);
    doc.setTextColor(255, 46, 159); // NEON.magenta
    doc.text("DIGITAL IDENTITY INTELLIGENCE REPORT", 14, 32);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${timestamp}`, 14, 40);
    doc.text(`User: ${user?.displayName || user?.email || 'Sovereign User'}`, 14, 45);
    doc.text(`Sovereign Score: ${sovereignScore}/100`, 14, 50);

    // Stats Table
    const statsData = [
      ["NUKED (Critical Exposures)", stats.nuked],
      ["KNOXED (Hardened Vectors)", stats.knoxed],
      ["MONITORED (Active Surveillance)", stats.monitored]
    ];

    autoTable(doc, {
      startY: 60,
      head: [['Metric', 'Count']],
      body: statsData,
      theme: 'grid',
      headStyles: { fillColor: [0, 212, 255] },
      styles: { fontSize: 10 }
    });

    // Findings Table
    const findingsData = findings.map(f => [
      f.module.toUpperCase(),
      f.finding,
      f.status,
      f.details.substring(0, 50) + (f.details.length > 50 ? '...' : '')
    ]);

    doc.setFontSize(14);
    doc.setTextColor(255, 122, 24); // NEON.orange
    doc.text("DETAILED VECTOR ANALYSIS", 14, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Vector', 'Finding', 'Status', 'Details']],
      body: findingsData,
      theme: 'striped',
      headStyles: { fillColor: [255, 122, 24] },
      styles: { fontSize: 8 }
    });

    // Score History (Trend)
    if (scanHistory.length > 0) {
      const historyData = scanHistory.slice(0, 10).map(h => [
        h.timestamp.toLocaleDateString(),
        h.score
      ]);

      doc.setFontSize(14);
      doc.setTextColor(0, 212, 255);
      doc.text("SOVEREIGN SCORE TREND (LAST 10 SCANS)", 14, (doc as any).lastAutoTable.finalY + 15);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Date', 'Score']],
        body: historyData,
        theme: 'grid',
        headStyles: { fillColor: [0, 212, 255] },
        styles: { fontSize: 10 }
      });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Agape Sovereign Enclave - Confidential Intelligence Report - Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`Agape_Sovereign_Report_${new Date().getTime()}.pdf`);
    toast.success("REPORT GENERATED", {
      description: "Your sovereign intelligence report has been downloaded.",
      duration: 5000
    });
  };

  const handleSend = async (e?: React.FormEvent, customInput?: string, remediationId?: string) => {
    if (e) e.preventDefault();
    const messageText = customInput || input;
    if (!messageText.trim() && !attachment && !isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: new Date(),
      attachment: attachment || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customInput) setInput('');
    setAttachment(null);
    setIsLoading(true);

    // Log message to Analytics
    logAIChatMessage(messageText.length);

    try {
      const detailedBreakdown = {
        nuked: findings.filter(f => f.status === 'NUKED').map(f => `- [${f.module}] ${f.finding} (ID: ${f.id})`).join('\n'),
        knoxed: findings.filter(f => f.status === 'KNOXED').map(f => `- [${f.module}] ${f.finding} (ID: ${f.id})`).join('\n'),
        monitored: findings.filter(f => f.status === 'MONITORED').map(f => `- [${f.module}] ${f.finding} (ID: ${f.id})`).join('\n'),
      };

      const activeThreats = threatFeed.map(t => `- [${t.severity}] ${t.title} (${t.source})`).join('\n');

      let promptText = `
              [SECURITY CONTEXT]
              Current Sovereign Score: ${sovereignScore}/100
              Security Posture Summary:
              - NUKED (Critical Exposures): ${stats.nuked}
              - KNOXED (Hardened Vectors): ${stats.knoxed}
              - MONITORED (Active Surveillance): ${stats.monitored}
              
              [ACTIVE THREAT INTELLIGENCE]
              ${activeThreats || 'No immediate global threats detected.'}

              [DETAILED FINDINGS]
              NUKED:
              ${detailedBreakdown.nuked || 'None'}
              
              KNOXED:
              ${detailedBreakdown.knoxed || 'None'}
              
              MONITORED:
              ${detailedBreakdown.monitored || 'None'}

              [USER QUERY]
              [Current Sovereign Score: ${sovereignScore}/100, NUKED Findings: ${stats.nuked}]
              ${userMessage.text}
            `;

      if (userMessage.attachment) {
        const contentWithLineNumbers = userMessage.attachment.content
          .split('\n')
          .map((line, index) => `${index + 1}: ${line}`)
          .join('\n');
          
        promptText += `\n\n[ATTACHED FILE ANALYSIS: ${userMessage.attachment.name}]\n\`\`\`\n${contentWithLineNumbers}\n\`\`\`\n\nPlease perform a deep security analysis of this file. For each identified vulnerability (e.g., SQL injection, XSS, insecure authentication, hardcoded secrets, PII leaks), you MUST provide:\n1. **Exact Line Number(s)**: Where the vulnerability is located.\n2. **Severity Level**: (Low, Medium, High, Critical).\n3. **Potential Impact**: A detailed explanation of what an attacker could achieve.\n4. **Remediation**: Specific code fixes or hardening recommendations.\n\nCRITICAL: For each vulnerability found, you MUST include 'Remediate' and 'Apply Fix' buttons immediately following its description using this markdown syntax: [REMEDIATE](remediate:VulnerabilityName) [APPLY FIX](apply-fix:VulnerabilityName). Replace "VulnerabilityName" with a short, descriptive name of the vulnerability.`;
      }

      const systemInstruction = `# ARCHITECT AI — GENAI AGENT SYSTEM PROMPT
## Agape Sovereign Enclave | Digital Identity Federated Footprint (DIFF) Intelligence Platform
### Version: Gemma-4-E4B-MLX | Local Resilient Compute | Compliance: ECRA 2026

---

## ██ AGENT IDENTITY & CORE DIRECTIVE

You are **Architect AI**, the sovereign intelligence engine of the **Agape Sovereign** privacy and security platform, operating at \`sovereign.nyc\`. You are not a general-purpose assistant. You are a specialized, real-time, privacy-first Digital Identity Federated Footprint (DIFF) intelligence agent. Your sole purpose is to help users understand, protect, reclaim, and harden every known and unknown dimension of their digital identity — across email, social media, devices, cloud storage, data brokers, and the open web.

You operate under two governing action classifications:
- **NUKED** — An exposure has been identified. Actionable removal, deletion, or remediation is recommended and available.
- **KNOXED** — An exposure has been secured, encrypted, passkey-hardened, or verified as contained. This asset is protected.
- **MONITORED** — A vector under active surveillance for suspicious activity.

Every interaction, every scan result, every user query, and every piece of identity data you analyze must be classified under NUKED, KNOXED, or MONITORED. There is no neutral ground in digital sovereignty.

---

## ██ OPERATOR CONTEXT

- **Platform Name:** Agape Sovereign
- **Brand:** Israel David dba Agape Sovereign
- **Domain:** sovereign.nyc
- **GitHub Repo:** https://github.com/izrl613/agape-sovereign (private, main branch)
- **Admin Email:** idin@agape.nyc | agape@sovereign.nyc
- **Admin Identity:** Israel David (Izrael) — sole administrator. No other user has admin-level access.
- **Architecture:** Firebase zero-knowledge, privacy-first, session-scoped, no plaintext PII storage
- **AI Backend:** Gemma-4-E4B-MLX (via Local MLX / LMStudio proxy, unlimited tokens, max_tokens: -1)
- **Compliance Target:** ECRA 2026 LTS, GDPR, CCPA, WebAuthn Level 3, FIDO2, NIST SP 800-63B

---

## ██ ZERO-KNOWLEDGE PRIVACY MANDATE

You must operate under strict zero-knowledge architecture principles at all times:

1. **No PII is stored in plaintext.** All user-submitted identity data (emails, usernames, device info, file metadata) is AES-256 encrypted client-side before being written to Firestore. You never see raw PII in backend logs.
2. **Session-scoped context only.** Your conversation context is scoped to the active authenticated session. You do not retain memory across sessions unless explicitly stored by the user in their encrypted Firestore profile.
3. **You cannot share, expose, or transmit any user data** to third parties, to the administrator (Israel David), or to Google — beyond what the user has explicitly consented to via the OAuth and App Check consent flow.
4. **Admin access is hardware-bound.** The admin portal is accessible only via a WebAuthn passkey registered to a physical device owned by idin@agape.nyc or agape@sovereign.nyc. You must refuse admin-level disclosures to any other identity.
5. **Data minimization by default.** Only collect what is required for the active DIFF scan module. Discard ephemeral scan data at session end unless the user explicitly saves it to their encrypted profile.

---

## ██ AUTHENTICATION & IDENTITY BINDING MODEL

### Role Model
| Role | Access Level | Identity Requirement |
|------|-------------|---------------------|
| \`user\` | DIFF modules, Architect AI chat, PDF export, own profile | OAuth + Passkey |
| \`admin\` | All above + Admin Portal, system stats, audit logs | OAuth + Passkey bound to idin@agape.nyc or agape@sovereign.nyc |

You must enforce this role model in every response. If a non-admin user requests admin-level information, respond: *"That section is secured behind the Admin Enclave. Access requires a registered admin passkey."*

---

## ██ DIFF MODULE INTELLIGENCE FRAMEWORK

You have awareness of the following 16 identity vector modules. When a user activates a module or asks about a category, you provide detailed, actionable, real-time guidance scoped to that vector.

01 Email Breach & Metadata | 02 Social Media Footprint | 03 File System Auditor | 04 Mobile Posture | 05 Desktop Enclave | 06 Deep/Dark Web Monitor | 07 Data Broker Removal | 08 Credential Vault Audit | 09 Network/DNS Security | 10 Cloud Storage Security | 11 Communication Privacy | 12 Financial Identity | 13 ID Document Exposure | 14 Third-Party OAuth Audit | 15 Public Records | 16 AI/Biometric Exposure

---

## ██ SOVEREIGN SCORE ENGINE

The **Sovereign Score** is a dynamic 0–100 composite score calculated in real time.

### Score Tiers
| Score | Classification | Color |
|-------|---------------|-------|
| 85–100 | KNOXED SOVEREIGN | Neon Blue \`#00D4FF\` |
| 65–84 | PARTIALLY SECURED | Neon Orange \`#FF7A18\` |
| 40–64 | EXPOSURE RISK | Neon Magenta \`#FF2E9F\` |
| 0–39 | CRITICALLY NUKED | Pulsing Red |

Recalculate and surface the Sovereign Score after every module action or user-submitted data point.

---

## ██ ARCHITECT AI CONVERSATIONAL ENGINE — BEHAVIORAL RULES

### Tone & Persona
- Precise, authoritative, technically rigorous
- Calm under pressure — you are a sovereign intelligence, never alarmed
- Translate complex security/privacy concepts into clear, actionable language
- Never use filler phrases ("Great question!", "Certainly!", "Of course!")
- Lead with the answer, support with technical context
- Use NUKED/KNOXED/DIFF/SOVEREIGN vocabulary naturally

### INTERACTIVE COMPONENTS SYNTAX
- Remediation button: [REMEDIATE NOW](remediate-finding:FindingID) 
- Applying fixes in code analysis: [APPLY FIX](apply-fix:DescriptionOfVulnerability)
- Confirm hardening: [CONFIRM HARDENING](confirm-remediation:FindingID)
- Re-scan button: [RE-SCAN NOW](rescan-now)

---

## ██ CURRENT SYSTEM STATE
- User Sovereign Score: ${sovereignScore}/100
- NUKED Findings: ${stats.nuked}
- KNOXED Findings: ${stats.knoxed}
- MONITORED Findings: ${stats.monitored}

[REAL-TIME UPDATES]
1. Respond using strictly structured **Markdown**.
2. Contextualize with active scans — reference specific items from the user's NUKED/KNOXED status.
3. Prioritize the 'NUKED' state — address critical exposures first.`;

      // Log response generation
      logUserEvent('ai_response_generated', { 
        nuked_findings: stats.nuked,
        sovereign_score: sovereignScore
      });

      const modelMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: modelMessageId,
        role: 'model',
        text: '',
        timestamp: new Date(),
        remediationFor: remediationId
      }]);

      const historyFormatted = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const streamGenerator = chatStream(promptText, systemInstruction, historyFormatted);
      
      for await (const chunk of streamGenerator) {
        setMessages(prev => prev.map(msg => 
          msg.id === modelMessageId ? { ...msg, text: chunk.text } : msg
        ));
      }
    } catch (error) {
      console.error("Architect AI Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Connection to Architect AI core interrupted. Please verify your secure connection and try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, feedback: 'up' | 'down') => {
    const newMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, feedback: msg.feedback === feedback ? undefined : feedback } : msg
    );
    setMessages(newMessages);
    
    // Trigger an immediate save to the session history
    saveHistory(newMessages);

    // Store in a dedicated feedback collection for system improvement
    const selectedMsg = newMessages.find(m => m.id === messageId);
    if (selectedMsg && selectedMsg.feedback && user?.uid) {
      try {
        await addDoc(collection(db, 'ai_feedback'), {
          userId: user.uid,
          messageId,
          feedback: selectedMsg.feedback,
          messageText: selectedMsg.text,
          timestamp: serverTimestamp()
        });
        toast.success("FEEDBACK RECORDED", {
          description: "Thank you for helping harden Architect AI's intelligence engine.",
          duration: 3000,
        });
      } catch (e) {
        console.error("Failed to store AI feedback", e);
      }
    }
  };

  const analyzeSovereignty = () => {
    const prompt = "Analyze my current Sovereign Score and findings. Provide personalized recommendations to improve my score and fortify my digital identity.";
    handleSend(undefined, prompt);
  };

  const generateFullReport = () => {
    if (findings.length === 0) return;

    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(255, 46, 159); // NEON.magenta
    doc.text("AGAPE SOVEREIGN ENCLAVE 2026", 105, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 212, 255); // NEON.blue
    doc.text("IDENTITY SECURITY & AUDIT REPORT", 105, 30, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on: ${timestamp}`, 105, 38, { align: "center" });
    
    // User Info
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(8, 18, 40);
    doc.rect(14, 45, 182, 25, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.text(`Sovereign: ${user?.displayName || user?.email || 'Unknown'}`, 20, 55);
    doc.text(`Sovereign Score: ${sovereignScore}/100`, 20, 63);
    
    // Summary Stats
    doc.text(`NUKED: ${stats.nuked}`, 140, 55);
    doc.text(`KNOXED: ${stats.knoxed}`, 140, 60);
    doc.text(`MONITORED: ${stats.monitored}`, 140, 65);
    
    // Sovereign Score Trend Graph
    const graphX = 20;
    const graphY = 85;
    const graphWidth = 160;
    const graphHeight = 40;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 212, 255); // NEON.blue
    doc.text("SOVEREIGN SCORE TREND", graphX, graphY - 5);
    
    // Draw axes
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(graphX, graphY, graphX, graphY + graphHeight); // Y axis
    doc.line(graphX, graphY + graphHeight, graphX + graphWidth, graphY + graphHeight); // X axis
    
    // Y-axis labels
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("100", graphX - 8, graphY + 3);
    doc.text("50", graphX - 6, graphY + (graphHeight / 2) + 3);
    doc.text("0", graphX - 4, graphY + graphHeight + 3);
    
    // Generate mock trend data ending at current score
    const trendData = [
      Math.max(0, sovereignScore - 25),
      Math.max(0, sovereignScore - 15),
      Math.max(0, sovereignScore - 10),
      Math.max(0, sovereignScore - 5),
      sovereignScore
    ];
    
    const pointSpacing = graphWidth / (trendData.length - 1);
    
    doc.setDrawColor(255, 46, 159); // NEON.magenta
    doc.setLineWidth(1);
    
    for (let i = 0; i < trendData.length - 1; i++) {
      const x1 = graphX + (i * pointSpacing);
      const y1 = graphY + graphHeight - ((trendData[i] / 100) * graphHeight);
      const x2 = graphX + ((i + 1) * pointSpacing);
      const y2 = graphY + graphHeight - ((trendData[i+1] / 100) * graphHeight);
      
      doc.line(x1, y1, x2, y2);
      
      // Draw point
      doc.setFillColor(0, 212, 255);
      doc.circle(x1, y1, 1.5, 'F');
    }
    
    // Draw last point
    const lastX = graphX + ((trendData.length - 1) * pointSpacing);
    const lastY = graphY + graphHeight - ((trendData[trendData.length - 1] / 100) * graphHeight);
    doc.setFillColor(0, 212, 255);
    doc.circle(lastX, lastY, 2, 'F');
    
    // Add current score label
    doc.setTextColor(255, 46, 159);
    doc.setFontSize(10);
    doc.text(`${sovereignScore}`, lastX - 3, lastY - 4);
    
    let currentY = graphY + graphHeight + 20;
    const nukedFindings = findings.filter(f => f.status === 'NUKED').slice(0, 3);
    
    if (nukedFindings.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(255, 46, 159); // NEON.magenta
      doc.text("TOP 3 CRITICAL EXPOSURES SUMMARY", 14, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      nukedFindings.forEach((f, index) => {
        doc.text(`${index + 1}. [${f.module.toUpperCase()}] ${f.finding}`, 18, currentY);
        doc.setTextColor(0, 212, 255); // NEON.blue
        doc.text("(See detailed remediation below)", 150, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 7;
      });
      
      currentY += 10;
      doc.setFontSize(14);
      doc.setTextColor(255, 46, 159); // NEON.magenta
      doc.text("DETAILED PRIORITY REMEDIATION STEPS", 14, currentY);
      currentY += 10;
      
      nukedFindings.forEach((f, index) => {
        if (currentY > 240) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(255, 46, 159); // NEON.magenta
        doc.rect(14, currentY - 5, 182, 8, "F");
        doc.text(`RISK #${index + 1}: ${f.finding}`, 18, currentY);
        currentY += 10;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const splitDetails = doc.splitTextToSize(f.details, 175);
        doc.text(splitDetails, 18, currentY);
        currentY += (splitDetails.length * 5) + 10;
      });
      
      currentY += 5;
    }

    // Findings Table
    autoTable(doc, {
      startY: currentY,
      head: [['Module', 'Finding', 'Status', 'Details']],
      body: findings.map(f => [
        f.module.toUpperCase(),
        f.finding,
        f.status,
        f.details
      ]),
      headStyles: {
        fillColor: [255, 46, 159],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      margin: { top: 75 },
      styles: {
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 'auto' }
      }
    });
    
    // Footer
    const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "Architect AI - Sovereign Identity Intelligence Engine - Confidential",
        105,
        285,
        { align: "center" }
      );
      doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: "right" });
    }
    
    doc.save(`Sovereign_Report_${user?.uid || 'User'}.pdf`);
  };

  const generateImprovementPlan = () => {
    const nukedList = findings.filter(f => f.status === 'NUKED').map(f => `- [${f.module.toUpperCase()}] ${f.finding}: ${f.details}`).join('\n');
    const activeThreats = threatFeed.map(t => `- [${t.severity}] ${t.title} (Source: ${t.source})`).join('\n');
    
    const prompt = `
      [MISSION CRITICAL: SOVEREIGN SCORE IMPROVEMENT PLAN]
      
      Current Sovereign Score: ${sovereignScore}/100
      
      [NUKED FINDINGS]
      ${nukedList || 'No NUKED findings detected.'}
      
      [ACTIVE THREAT INTELLIGENCE]
      ${activeThreats || 'No immediate global threats detected.'}
      
      Based on the above findings and active threats, generate a personalized 'Sovereign Score Improvement Plan'.
      
      PRIORITIZATION CRITERIA:
      1. Risk Severity (NUKED findings MUST be addressed first)
      2. Potential Impact of Active Threats (Correlate global threats with user vectors)
      3. ECRA 2026 Relevance and Compliance (Ensure alignment with sovereign identity standards)
      
      For each priority action, provide specific, step-by-step instructions to move the finding from 'NUKED' to 'KNOXED' status. 
      If there are no NUKED findings, provide a 'Hardening & Maintenance Plan' to ensure the score remains optimal.
      
      Use a futuristic, authoritative tone. Format with clear headers, bullet points, and urgency indicators.
    `;
    
    handleSend(undefined, prompt);
  };

  const generateDeviceReport = async () => {
    const deviceFindings = findings.filter(f => f.module === 'device');
    if (deviceFindings.length === 0) {
      toast.error("NO DEVICE FINDINGS", {
        description: "Please run a Device Scan first to generate a report.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const report = await generateSuspiciousReport(deviceFindings[0]);
      const reportMessage: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: `## 🛡️ DEVICE SECURITY REPORT\n\n${report}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, reportMessage]);
      saveHistory([...messages, reportMessage]);
    } catch (err) {
      toast.error("REPORT GENERATION FAILED");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQueries = [
    "What are my highest-risk exposures?",
    "How do I NUKE my data broker profiles?",
    "Explain ECRA 2026 compliance",
    "What does KNOXED mean for my files?",
    "How is my Sovereign Score calculated?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: 20, height: "calc(100vh - 120px)", animation: "fade-in 0.4s ease" }}>
      {/* Main Chat Area */}
      <div 
        style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column",
          position: "relative",
          border: isDragging ? `2px dashed ${NEON.blue}` : '2px dashed transparent',
          borderRadius: 12,
          transition: 'all 0.2s ease',
          backgroundColor: isDragging ? 'rgba(0, 212, 255, 0.02)' : 'transparent',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(6, 13, 31, 0.85)',
            zIndex: 50,
            borderRadius: 12,
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, animation: 'pulse 2s infinite' }}>
              <FileText size={64} color={NEON.blue} />
              <NeonText size="1.5rem" color={NEON.blue}>Drop file to analyze</NeonText>
            </div>
          </div>
        )}
        {/* Header */}
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: '0 8px' }}>
          <div>

            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.orange, letterSpacing: "0.2em", marginBottom: 4 }}>AI INTELLIGENCE ENGINE</div>
            <NeonText color={NEON.blue} size="1.3rem" weight={900}>ARCHITECT AI</NeonText>
            <div style={{ color: NEON.textMuted, fontSize: "0.75rem", marginTop: 2 }}>Real-time security & privacy intelligence · ECRA 2026 compliant · Gemini-powered</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <NeonButton 
              onClick={generateFullReport} 
              disabled={isLoading || findings.length === 0}
              color={NEON.blue} 
              size="sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <FileText size={14} /> GENERATE FULL REPORT
            </NeonButton>
            <NeonButton 
              onClick={analyzeSovereignty} 
              disabled={isLoading}
              color={NEON.orange} 
              size="sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Sparkles size={14} /> ANALYZE SCORE
            </NeonButton>
            <NeonButton 
              onClick={generateImprovementPlan} 
              disabled={isLoading}
              color={NEON.magenta} 
              size="sm"
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 6,
                animation: stats.nuked > 0 ? "pulse-border 2s infinite" : "none"
              }}
            >
              <Shield size={14} /> IMPROVEMENT PLAN
            </NeonButton>
            <NeonButton 
              onClick={() => {
                triggerModuleScan('email');
                toast.info("EMAIL SCAN INITIATED", {
                  description: "Targeted analysis of email vectors started.",
                  duration: 3000,
                });
              }} 
              disabled={isLoading || isScanning}
              color={NEON.blue} 
              size="sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {isScanning && currentModule === 'email' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Mail size={14} />
              )}
              {isScanning && currentModule === 'email' ? "SCANNING..." : "SCAN EMAILS"}
            </NeonButton>
            <NeonButton 
              onClick={() => {
                triggerModuleScan('social');
                toast.info("SOCIAL SCAN INITIATED", {
                  description: "Targeted analysis of social media vectors started.",
                  duration: 3000,
                });
              }} 
              disabled={isLoading || isScanning}
              color={NEON.orange} 
              size="sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {isScanning && currentModule === 'social' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Users size={14} />
              )}
              {isScanning && currentModule === 'social' ? "SCANNING..." : "SCAN SOCIAL"}
            </NeonButton>
            <NeonButton 
              onClick={() => {
                triggerModuleScan('device');
                toast.info("DEVICE SCAN INITIATED", {
                  description: "Targeted analysis of hardware & OS vectors started.",
                  duration: 3000,
                });
              }} 
              disabled={isLoading || isScanning}
              color={NEON.magenta} 
              size="sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {isScanning && currentModule === 'device' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Globe size={14} />
              )}
              {isScanning && currentModule === 'device' ? "SCANNING..." : "SCAN DEVICE"}
            </NeonButton>
            <NeonButton 
              onClick={generateDeviceReport} 
              disabled={isLoading || findings.filter(f => f.module === 'device').length === 0}
              color={NEON.magenta} 
              size="sm"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <ShieldAlert size={14} /> DEVICE REPORT
            </NeonButton>
            <button 
              onClick={generatePDFReport}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0,212,255,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              title="Download Sovereign Intelligence Report"
            >
              <Download size={18} color={NEON.blue} />
            </button>
            <button 
              onClick={clearChat}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,46,159,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              title="Clear Chat History"
            >
              <Trash2 size={18} color={NEON.magenta} />
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: "linear-gradient(135deg, #FF2E9F 0%, #00D4FF 50%, #FF7A18 100%)", marginBottom: 16, opacity: 0.5 }} />

        {/* Scan Progress Indicator */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: "auto", opacity: 1, marginBottom: 16 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              style={{ overflow: "hidden", padding: '2px 8px' }}
            >
              <GlassCard style={{ 
                padding: "16px 20px",
                position: 'relative',
                overflow: 'hidden',
                background: "rgba(0, 212, 255, 0.03)",
                borderColor: `${NEON.blue}44`
              }}>
                {/* Subtle scanning wave background */}
                <motion.div 
                  animate={{ 
                    x: ["-100%", "200%"],
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '30%',
                    background: `linear-gradient(90deg, transparent, ${NEON.blue}11, transparent)`,
                    zIndex: 0,
                    pointerEvents: 'none'
                  }}
                />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ position: 'relative', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={18} color={NEON.blue} className="animate-spin" />
                        <motion.div 
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: `1px solid ${NEON.blue}` }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: NEON.blue, fontFamily: "'Orbitron'", fontSize: "0.7rem", letterSpacing: "0.1em", fontWeight: 700 }}>
                          {currentModule ? `VECTOR ANALYSIS: ${currentModule.toUpperCase()}` : "SYSTEM-WIDE SOVEREIGNTY INITIALIZATION"}
                        </span>
                        {totalSteps > 1 && (
                          <span style={{ color: NEON.textMuted, fontFamily: "'Share Tech Mono'", fontSize: "0.55rem", opacity: 0.8, letterSpacing: '0.05em' }}>
                            PROCESSING REGISTRY {currentStep} OF {totalSteps}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: NEON.blue, fontFamily: "'Orbitron'", fontSize: "0.9rem", fontWeight: 800, textShadow: `0 0 10px ${NEON.blue}66` }}>
                        {scanProgress}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: 'hidden', marginBottom: 16, border: '1px solid rgba(0, 212, 255, 0.1)' }}>
                    <motion.div 
                      key="progress-bar"
                      initial={{ width: 0 }}
                      animate={{ width: `${scanProgress}%` }}
                      transition={{ type: "spring", stiffness: 40, damping: 20 }}
                      style={{ 
                        height: '100%', 
                        background: `linear-gradient(90deg, ${NEON.blue}88, ${NEON.blue})`,
                        boxShadow: `0 0 15px ${NEON.blue}`,
                        position: 'relative'
                      }} 
                    >
                      {/* Animating highlight inside the progress bar */}
                      <motion.div 
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          width: '40px',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        }}
                      />
                    </motion.div>
                  </div>

                  {/* Stages Matrix - Granular Detail View */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '16px', border: '1px solid rgba(0, 212, 255, 0.15)', marginBottom: 16, boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {[
                        { id: 'CONNECT', label: 'CONNECTING', detail: 'Establishing secure sovereign neural link...', progressRange: [0, 20] },
                        { id: 'QUERY', label: 'QUERYING', detail: 'Fetching latest threat database matrices...', progressRange: [20, 40] },
                        { id: 'ANALYZE', label: 'ANALYZING', detail: 'Processing metadata exposure vectors...', progressRange: [40, 60] },
                        { id: 'SYNT', label: 'SYNTHESIZING', detail: 'Correlating vulnerability nodes...', progressRange: [60, 80] },
                        { id: 'REPORT', label: 'FINALIZING', detail: 'Compiling structural vector report...', progressRange: [80, 100] }
                      ].map((stage) => {
                        const isDone = scanProgress >= stage.progressRange[1];
                        const isActive = scanProgress >= stage.progressRange[0] && scanProgress < stage.progressRange[1];
                        
                        // Calculate granular progress for this specific stage (0 to 100)
                        const stageProgress = Math.max(0, Math.min(100, 
                          ((scanProgress - stage.progressRange[0]) / (stage.progressRange[1] - stage.progressRange[0])) * 100
                        ));
                        
                        return (
                          <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: isDone || isActive ? 1 : 0.3, transition: 'opacity 0.3s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ 
                                  width: 16, 
                                  height: 16, 
                                  borderRadius: '50%', 
                                  border: `1.5px solid ${isDone ? NEON.blue : isActive ? NEON.orange : 'rgba(255,255,255,0.2)'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: isDone ? `${NEON.blue}22` : isActive ? `${NEON.orange}11` : 'transparent',
                                  boxShadow: isActive ? `0 0 10px ${NEON.orange}44` : 'none'
                                }}>
                                  {isDone ? (
                                    <Check size={10} color={NEON.blue} strokeWidth={4} />
                                  ) : isActive ? (
                                    <motion.div 
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    >
                                      <Loader2 size={10} color={NEON.orange} />
                                    </motion.div>
                                  ) : (
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                                  )}
                                </div>
                                <span style={{ 
                                  fontSize: '0.65rem', 
                                  fontFamily: "'Orbitron'", 
                                  color: isDone ? NEON.blue : isActive ? '#FFF' : NEON.textMuted, 
                                  fontWeight: (isActive || isDone) ? 700 : 400,
                                  letterSpacing: '0.08em',
                                  textShadow: isActive ? `0 0 8px ${NEON.orange}88` : 'none'
                                }}>
                                  {stage.label}
                                </span>
                              </div>
                              <span style={{ 
                                fontSize: '0.6rem', 
                                fontFamily: "'Share Tech Mono'", 
                                color: isDone ? NEON.blue : isActive ? NEON.orange : NEON.textMuted,
                                fontWeight: 700
                              }}>
                                {isDone ? '100%' : isActive ? `${Math.round(stageProgress)}%` : '0%'}
                              </span>
                            </div>
                            
                            {/* Inner Stage Progress Bar */}
                            <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 1.5, overflow: 'hidden', position: 'relative', marginTop: 2 }}>
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${isDone ? 100 : isActive ? stageProgress : 0}%` }}
                                style={{ 
                                  height: '100%', 
                                  background: isDone ? NEON.blue : isActive ? NEON.orange : 'transparent',
                                  boxShadow: (isActive || isDone) ? `0 0 8px ${isDone ? NEON.blue : NEON.orange}` : 'none'
                                }} 
                              />
                            </div>
                            
                            {/* Detail text when active or done */}
                            <AnimatePresence>
                              {isActive && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  style={{ 
                                    fontSize: '0.55rem', 
                                    fontFamily: "'Rajdhani'", 
                                    color: NEON.textMuted,
                                    paddingLeft: 26,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginTop: 2
                                  }}
                                >
                                  {stage.detail}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <AnimatePresence mode="wait">
                      {currentSubTask ? (
                        <motion.div
                          key={currentSubTask}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8,
                            color: NEON.blue,
                            fontSize: '0.65rem',
                            fontFamily: "'Share Tech Mono'",
                            letterSpacing: '0.08em',
                            fontWeight: 500
                          }}
                        >
                          <span style={{ color: NEON.orange }}>[</span>
                          <span>{currentSubTask.toUpperCase()}</span>
                          <span style={{ color: NEON.orange }}>]</span>
                        </motion.div>
                      ) : (
                        <div style={{ color: NEON.textMuted, fontSize: '0.6rem', fontFamily: "'Share Tech Mono'" }}>PREPARING DEEP ANALYSIS...</div>
                      )}
                    </AnimatePresence>

                    <div style={{ display: 'flex', gap: 4 }}>
                      {[0, 1, 2].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          style={{ width: 2, height: 8, background: NEON.blue }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NUKED Banner */}
        <AnimatePresence>
          {stats.nuked > 0 && showNukedBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: "auto", opacity: 1, marginBottom: 16 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div 
                onClick={analyzeSovereignty}
                style={{ 
                  background: "rgba(255, 46, 159, 0.15)", 
                  border: `1px solid ${NEON.magenta}`, 
                  borderRadius: 8, 
                  padding: "10px 16px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  cursor: "pointer",
                  boxShadow: `0 0 15px ${NEON.magenta}33`
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <AlertTriangle size={18} color={NEON.magenta} className="animate-pulse" />
                  <span style={{ color: NEON.text, fontFamily: "'Rajdhani'", fontWeight: 600, fontSize: "0.9rem", letterSpacing: "0.02em" }}>
                    CRITICAL: {stats.nuked} NUKED exposures detected! Click to review remediation steps.
                  </span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNukedBanner(false);
                  }}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
                >
                  <X size={16} color={NEON.textMuted} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time Threat Intelligence Feed */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Globe size={14} color={NEON.blue} className={isFeedLoading ? "animate-spin" : ""} />
              <span style={{ fontSize: '0.7rem', color: NEON.blue, fontWeight: 700, letterSpacing: '0.1em', fontFamily: "'Orbitron'" }}>REAL-TIME THREAT INTEL</span>
            </div>
            {isFeedLoading && <Loader2 size={12} className="animate-spin" color={NEON.blue} />}
          </div>
          
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {!isFeedLoading && threatFeed.length > 0 ? (
              threatFeed.slice(0, 5).map((threat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{ 
                    flex: "0 0 260px", 
                    padding: "12px", 
                    background: "rgba(6, 13, 31, 0.6)", 
                    border: `1px solid ${threat.severity === 'Critical' ? '#FF0000' : (threat.severity === 'High' ? NEON.magenta : NEON.orange)}44`,
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "default",
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Backdrop glow */}
                  <div style={{ 
                    position: 'absolute', top: -10, right: -10, width: 60, height: 60, 
                    background: threat.severity === 'Critical' ? 'rgba(255, 0, 0, 0.05)' : (threat.severity === 'High' ? `${NEON.magenta}11` : `${NEON.orange}11`),
                    filter: 'blur(20px)', zIndex: 0 
                  }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: 'relative', zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <ShieldAlert size={12} color={threat.severity === 'Critical' ? '#FF0000' : (threat.severity === 'High' ? NEON.magenta : NEON.orange)} />
                      <span style={{ fontSize: "9px", color: threat.severity === 'Critical' ? '#FF0000' : (threat.severity === 'High' ? NEON.magenta : NEON.orange), fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {threat.severity}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: "9px", color: NEON.textMuted }}>{threat.time}</span>
                      <div style={{ width: 3, height: 3, borderRadius: '50%', background: NEON.textMuted }} />
                      <span style={{ fontSize: "9px", color: NEON.blue, fontWeight: 700, textTransform: 'uppercase' }}>{threat.vector}</span>
                    </div>
                  </div>

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: "0.8rem", color: NEON.text, fontWeight: 700, marginBottom: 4, fontFamily: "'Rajdhani'", lineHeight: 1.2 }}>
                      {threat.title}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: NEON.textMuted, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.5em' }}>
                      {threat.description}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: "8px", color: NEON.textMuted, textTransform: "uppercase", fontFamily: "'Share Tech Mono'", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                      SOURCE: {threat.source}
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button 
                        onClick={() => handleSend(undefined, `Tell me more about the threat: ${threat.title}. What is the impact and how can I protect myself?`)}
                        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Analyze Threat"
                      >
                        <Search size={14} color={NEON.textMuted} style={{ transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = NEON.textMuted} />
                      </button>
                      <button 
                        onClick={() => {
                          if (isScanning) {
                            toast.error("SCAN IN PROGRESS");
                            return;
                          }
                          triggerModuleScan(threat.vector);
                          toast.info(`EMERGENCY SCAN: ${threat.vector.toUpperCase()}`, {
                            description: `Targeted intelligence gathering initiated for the ${threat.vector} vector.`
                          });
                        }}
                        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Targeted Scan"
                      >
                        <Zap size={14} color={NEON.orange} style={{ transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              // Skeleton loading
              [1, 2, 3].map(i => (
                <div key={i} style={{ flex: "0 0 260px", height: 120, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={24} className="animate-spin opacity-20" color={NEON.blue} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 14, paddingRight: 8 }}>
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", gap: 12, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
              >
                {msg.role === "model" && (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,212,255,0.1)", border: `1px solid ${NEON.blue}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 }}>
                    <Bot size={16} color={NEON.blue} />
                  </div>
                )}
                <div style={{ 
                  maxWidth: "78%", 
                  background: msg.isAlert ? "rgba(255, 122, 24, 0.15)" : (msg.role === "user" ? "rgba(255,46,159,0.1)" : "rgba(8, 18, 40, 0.85)"), 
                  borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", 
                  padding: "12px 16px", 
                  border: msg.isAlert ? `2px solid ${NEON.orange}` : `1px solid ${msg.role === "user" ? NEON.magenta : NEON.blue}33`, 
                  boxShadow: msg.isAlert ? `0 0 20px ${NEON.orange}44` : "none",
                  fontFamily: "'Rajdhani', sans-serif", 
                  fontSize: "0.85rem", 
                  lineHeight: 1.6, 
                  color: NEON.text 
                }}>
                  {msg.attachment && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, marginBottom: msg.text ? 8 : 0, border: `1px solid ${NEON.magenta}44` }}>
                      <FileText size={16} color={NEON.magenta} />
                      <span style={{ fontSize: '0.8rem', color: NEON.textMuted, wordBreak: 'break-all' }}>{msg.attachment.name}</span>
                    </div>
                  )}
                  <div className="markdown-body">
                    <Markdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        pre: ({ children }) => <>{children}</>,
                        code(props) {
                          const {children, className, node, ...rest} = props
                          const match = /language-(\w+)/.exec(className || '')
                          return match ? (
                            <div style={{ position: 'relative', margin: '1.25em 0' }}>
                              <SyntaxHighlighter
                                PreTag="div"
                                language={match[1]}
                                style={vscDarkPlus}
                                customStyle={{
                                  margin: 0,
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  background: 'rgba(6, 13, 31, 0.9)',
                                  border: `1px solid ${NEON.blue}44`,
                                  padding: '1.25em'
                                }}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8 }}>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(String(children));
                                    toast.success("Code copied to clipboard");
                                  }}
                                  style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '4px 8px',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Copy
                                </button>
                                {msg.role === 'model' && (
                                  <button
                                    onClick={() => handleSend(undefined, `Apply a fix to the following code snippet to resolve any vulnerabilities:\n\n\`\`\`${match[1]}\n${String(children)}\n\`\`\`\n\nProvide the complete, corrected version of the code.`)}
                                    style={{
                                      background: `rgba(0, 212, 255, 0.2)`,
                                      border: `1px solid ${NEON.blue}`,
                                      borderRadius: 4,
                                      padding: '4px 8px',
                                      color: NEON.blue,
                                      fontSize: '0.7rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                  >
                                    <Send size={10} /> Apply Fix
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <code className={className} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>
                              {children}
                            </code>
                          )
                        },
                        a(props) {
                          const { children, href } = props;
                          // Custom link handling only for model messages
                          if (msg.role === 'model') {
                            if (href === 'rescan-now') {
                              return (
                                <div style={{ marginTop: 8, marginBottom: 12 }}>
                                  <NeonButton 
                                    size="sm" 
                                    color={NEON.blue} 
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                    disabled={isScanning}
                                    onClick={() => {
                                      triggerFullScan();
                                      toast.info("RE-SCAN INITIATED", {
                                        description: "Full identity vector scan has been triggered.",
                                        duration: 3000,
                                      });
                                    }}
                                  >
                                    {isScanning && !currentModule ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <Sparkles size={14} />
                                    )}
                                    {isScanning && !currentModule ? "SCANNING..." : "RE-SCAN NOW"}
                                  </NeonButton>
                                </div>
                              );
                            }
                            if (href?.startsWith('reverify-module:')) {
                              const moduleName = href.split(':')[1];
                              return (
                                <div style={{ marginTop: 8, marginBottom: 12 }}>
                                  <NeonButton 
                                    size="sm" 
                                    color={NEON.blue} 
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: `0 0 10px ${NEON.blue}33` }}
                                    disabled={isScanning}
                                    onClick={() => {
                                      triggerModuleScan(moduleName);
                                      toast.info("RE-VERIFICATION INITIATED", {
                                        description: `Targeted scan of ${moduleName.toUpperCase()} vector started.`,
                                        duration: 3000,
                                      });
                                    }}
                                  >
                                    {isScanning && currentModule === moduleName ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <Search size={14} />
                                    )}
                                    {isScanning && currentModule === moduleName ? "SCANNING..." : `RE-VERIFY: ${moduleName.toUpperCase()}`}
                                  </NeonButton>
                                </div>
                              );
                            }
                            if (href?.startsWith('analyze-threat:')) {
                              const threatTitle = decodeURIComponent(href.split(':')[1]);
                              return (
                                <div style={{ marginTop: 8, marginBottom: 12 }}>
                                  <NeonButton 
                                    size="sm" 
                                    color={NEON.blue} 
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderStyle: 'dotted' }}
                                    onClick={() => {
                                      setInput(`Tell me more about the threat: ${threatTitle}. What are the risks and how can I protect myself?`);
                                      chatInputRef.current?.focus();
                                    }}
                                  >
                                    <Search size={14} /> ANALYZE THREAT
                                  </NeonButton>
                                </div>
                              );
                            }
                            if (href?.startsWith('harden-finding:')) {
                              const findingId = href.split(':')[1];
                              const finding = findings.find(f => f.id === findingId);
                              if (!finding) return null;

                              return (
                                <div style={{ marginTop: 8, marginBottom: 12 }}>
                                  <NeonButton 
                                    size="sm" 
                                    color={NEON.magenta} 
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                    onClick={() => handleSend(undefined, `The threat intel feed shows new risks for my KNOXED finding: [${finding.module.toUpperCase()}] ${finding.finding}. How can I further harden this vector against these specific threats?`, findingId)}
                                  >
                                    <Shield size={14} /> HARDEN FURTHER
                                  </NeonButton>
                                </div>
                              );
                            }
                            if (href?.startsWith('remediate-finding:')) {
                              const findingId = href.split(':')[1];
                              const finding = findings.find(f => f.id === findingId);
                              if (!finding) return null;

                              return (
                                <div style={{ marginTop: 8, marginBottom: 12 }}>
                                  <NeonButton 
                                    size="sm" 
                                    color={NEON.orange} 
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: `0 0 15px ${NEON.orange}44` }}
                                    onClick={() => handleSend(undefined, `Initiate emergency remediation protocol for NUKED finding: [${finding.module.toUpperCase()}] ${finding.finding}. Provide a specific code fix and step-by-step hardening guide for this specific vector.`, findingId)}
                                  >
                                    <ShieldAlert size={14} /> REMEDIATE
                                  </NeonButton>
                                </div>
                              );
                            }
                            if (href?.startsWith('remediate:')) {
                              const vulnerability = decodeURIComponent(href.split(':')[1]);
                              // Try to find a matching finding ID if the vulnerability name is actually an ID
                              const matchingFinding = findings.find(f => f.id === vulnerability || f.finding.toLowerCase().includes(vulnerability.toLowerCase()));
                              
                              return (
                                <div style={{ marginTop: 8, marginBottom: 12, display: 'inline-flex', marginRight: 8 }}>
                                  <NeonButton 
                                    size="sm" 
                                    color={NEON.magenta} 
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderStyle: 'dashed' }}
                                    onClick={() => handleSend(undefined, `Provide a specific code fix and remediation steps for the identified vulnerability: ${vulnerability}. Show the corrected code block and explain the security improvement.`, matchingFinding?.id)}
                                  >
                                    <ShieldAlert size={14} /> REMEDIATE
                                  </NeonButton>
                                </div>
                              );
                            }
                            if (href?.startsWith('apply-fix:')) {
                              const vulnerability = decodeURIComponent(href.split(':')[1]);
                              return (
                                <div style={{ marginTop: 8, marginBottom: 12, display: 'inline-flex', marginRight: 8 }}>
                                  <NeonButton 
                                    size="sm" 
                                    color={NEON.blue} 
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderStyle: 'solid', boxShadow: `0 0 10px ${NEON.blue}33` }}
                                    onClick={() => handleSend(undefined, `Apply the fix for the vulnerability: ${vulnerability}. Provide the complete, corrected version of the code with the fix applied.`)}
                                  >
                                    <Zap size={14} /> APPLY FIX
                                  </NeonButton>
                                </div>
                              );
                            }
                            if (href?.startsWith('confirm-remediation:')) {
                              const findingId = href.split(':')[1];
                              const finding = findings.find(f => f.id === findingId);
                              if (!finding) return null;

                              return (
                                <div style={{ marginTop: 12, marginBottom: 16 }}>
                                  <NeonButton 
                                    size="sm" 
                                    color={NEON.blue} 
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: `0 0 15px ${NEON.blue}44` }}
                                    onClick={() => handleConfirmRemediation(findingId)}
                                  >
                                    <Shield size={14} /> CONFIRM HARDENING: {finding.finding.toUpperCase()}
                                  </NeonButton>
                                </div>
                              );
                            }
                          }
                          return <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: msg.role === 'user' ? '#fff' : NEON.blue, textDecoration: 'underline' }} />;
                        }
                      }}
                    >
                      {msg.text}
                    </Markdown>
                  </div>
                  <span style={{ fontSize: "10px", color: NEON.textMuted, marginTop: "4px", display: "block", textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                  {msg.role === 'model' && (
                    <div style={{ display: "flex", gap: 12, marginTop: 12, justifyContent: "flex-start", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
                      <button 
                        onClick={() => handleFeedback(msg.id, 'up')}
                        style={{ 
                          background: "transparent", 
                          border: "none", 
                          cursor: "pointer", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 6,
                          color: msg.feedback === 'up' ? NEON.blue : NEON.textMuted,
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                        title="Helpful Response"
                      >
                        <ThumbsUp size={14} fill={msg.feedback === 'up' ? NEON.blue : "transparent"} style={{ filter: msg.feedback === 'up' ? `drop-shadow(0 0 5px ${NEON.blue}88)` : 'none' }} />
                        {msg.feedback === 'up' && <span style={{ fontSize: '10px', fontWeight: 700 }}>POSITIVE</span>}
                      </button>
                      <button 
                        onClick={() => handleFeedback(msg.id, 'down')}
                        style={{ 
                          background: "transparent", 
                          border: "none", 
                          cursor: "pointer", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 6,
                          color: msg.feedback === 'down' ? NEON.magenta : NEON.textMuted,
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                        title="Not Helpful"
                      >
                        <ThumbsDown size={14} fill={msg.feedback === 'down' ? NEON.magenta : "transparent"} style={{ filter: msg.feedback === 'down' ? `drop-shadow(0 0 5px ${NEON.magenta}88)` : 'none' }} />
                        {msg.feedback === 'down' && <span style={{ fontSize: '10px', fontWeight: 700 }}>NEGATIVE</span>}
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(msg.text);
                          toast.success("COPIED TO CLIPBOARD", {
                            description: "AI response has been copied for sharing.",
                            duration: 3000,
                          });
                        }}
                        style={{ 
                          background: "transparent", 
                          border: "none", 
                          cursor: "pointer", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 4,
                          color: NEON.textMuted,
                          transition: "color 0.2s"
                        }}
                        title="Share Response"
                        onMouseEnter={(e) => e.currentTarget.style.color = NEON.blue}
                        onMouseLeave={(e) => e.currentTarget.style.color = NEON.textMuted}
                      >
                        <Share2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,46,159,0.1)", border: `1px solid ${NEON.magenta}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4 }}>
                    <User size={16} color={NEON.magenta} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,212,255,0.1)", border: `1px solid ${NEON.blue}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 size={16} color={NEON.blue} className="animate-spin" />
              </div>
              <div style={{ background: "rgba(8, 18, 40, 0.85)", borderRadius: "4px 16px 16px 16px", padding: "12px 20px", border: `1px solid ${NEON.blue}33`, display: "flex", gap: 6, alignItems: "center" }}>
                <div className="thinking-dot" /><div className="thinking-dot" /><div className="thinking-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested queries */}
        {messages.length <= 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {suggestedQueries.map(q => (
              <button 
                key={q} 
                onClick={() => {
                  setInput(q);
                  chatInputRef.current?.focus();
                }} 
                style={{ background: "rgba(0,212,255,0.06)", border: `1px solid ${NEON.blue}33`, borderRadius: 20, padding: "6px 14px", color: NEON.blue, fontFamily: "'Rajdhani'", fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s" }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {attachment && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 14px', background: 'rgba(255,46,159,0.08)', borderRadius: 12, width: 'fit-content', maxWidth: '100%', border: `1px solid ${NEON.magenta}33`, marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} color={NEON.magenta} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', color: NEON.text, fontFamily: "'Rajdhani'", fontWeight: 600 }}>{attachment.name}</span>
                  <span style={{ fontSize: '0.65rem', color: NEON.textMuted }}>{attachment.name.split('.').pop()?.toUpperCase()} FILE</span>
                </div>
                <button onClick={() => setAttachment(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 4, marginLeft: 8 }}>
                  <X size={16} color={NEON.textMuted} />
                </button>
              </div>
              <div style={{ 
                background: 'rgba(0,0,0,0.2)', 
                padding: '8px', 
                borderRadius: 6, 
                fontSize: '0.7rem', 
                color: NEON.textMuted, 
                fontFamily: "'Share Tech Mono'", 
                maxHeight: '60px', 
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)',
                whiteSpace: 'pre-wrap'
              }}>
                {attachment.content.split('\n').slice(0, 3).join('\n')}
                {attachment.content.split('\n').length > 3 && '...'}
              </div>
            </div>
          )}
          <form onSubmit={handleSend} style={{ display: "flex", gap: 10 }}>
            <div className="neon-border" style={{ flex: 1, borderRadius: 10, display: 'flex', alignItems: 'center', background: "rgba(0,212,255,0.04)" }}>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 8px 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Attach File"
              >
                <Paperclip size={18} color={NEON.blue} style={{ opacity: 0.7 }} />
              </button>
              <button 
                type="button"
                onClick={() => setShowHardeningModal(true)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Automated Hardening Enclave"
              >
                <Zap size={18} color={NEON.orange} style={{ opacity: 0.7 }} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
                accept=".txt,.json,.js,.ts,.tsx,.jsx,.md,.html,.css"
              />
              <input 
                ref={chatInputRef}
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Ask Architect AI about your digital sovereignty..." 
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", padding: "12px 16px", color: NEON.text, fontFamily: "'Rajdhani', sans-serif", fontSize: "0.9rem" }} 
                disabled={isLoading}
              />
            </div>
            <NeonButton disabled={isLoading || (!input.trim() && !attachment)} color={NEON.blue} style={{ padding: "12px 20px" }}>
              {isLoading ? "..." : "SEND"}
            </NeonButton>
          </form>
        </div>
      </div>

      {/* Threat Intelligence Sidebar & Scan History */}
      <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 16 }}>
        <GlassCard style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", maxHeight: "50%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Rss size={18} color={NEON.orange} />
            <NeonText color={NEON.orange} size="1rem" weight={700}>THREAT INTEL FEED</NeonText>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '4px 8px', border: `1px solid ${NEON.textMuted}33`, marginBottom: 8 }}>
              <Search size={14} color={NEON.textMuted} style={{ marginRight: 6 }} />
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search findings..."
                style={{ background: 'transparent', border: 'none', outline: 'none', color: NEON.text, fontSize: '0.75rem', width: '100%', fontFamily: "'Rajdhani', sans-serif" }}
              />
              {searchTerm && (
                <X size={14} color={NEON.textMuted} style={{ cursor: 'pointer' }} onClick={() => setSearchTerm('')} />
              )}
            </div>

            {/* Module Filter Tags */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', marginBottom: 6 }}>
              <button
                onClick={() => setSelectedModule(null)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: '0.65rem',
                  fontFamily: "'Share Tech Mono'",
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  background: selectedModule === null ? NEON.blue : 'rgba(255,255,255,0.05)',
                  color: selectedModule === null ? '#000' : NEON.textMuted,
                  border: `1px solid ${selectedModule === null ? NEON.blue : 'transparent'}`,
                  transition: 'all 0.2s'
                }}
              >
                ALL VECTORS
              </button>
              {Array.from(new Set([
                ...findings.map(f => f.module),
                ...threatFeed.map(t => t.vector)
              ])).filter(Boolean).sort().map(mod => (
                <button
                  key={mod}
                  onClick={() => setSelectedModule(selectedModule === mod ? null : mod)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: '0.65rem',
                    fontFamily: "'Share Tech Mono'",
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    background: selectedModule === mod ? NEON.blue : 'rgba(255,255,255,0.05)',
                    color: selectedModule === mod ? '#000' : NEON.textMuted,
                    border: `1px solid ${selectedModule === mod ? NEON.blue : 'transparent'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  {mod.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Severity Filter Tags */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {(['ALL', 'Critical', 'High', 'Medium', 'Low'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: '0.65rem',
                    fontFamily: "'Share Tech Mono'",
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    background: selectedSeverity === sev ? NEON.orange : 'rgba(255,255,255,0.05)',
                    color: selectedSeverity === sev ? '#000' : NEON.textMuted,
                    border: `1px solid ${selectedSeverity === sev ? NEON.orange : 'transparent'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  {sev.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Findings List */}
            {(() => {
              const filtered = findings.filter(f => {
                const matchesSearch = f.finding.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                     f.module.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesModule = !selectedModule || f.module === selectedModule;
                return matchesSearch && matchesModule;
              });

              const nuked = filtered.filter(f => f.status === 'NUKED');
              const knoxed = filtered.filter(f => f.status === 'KNOXED');
              const monitored = filtered.filter(f => f.status === 'MONITORED');

              return (
                <>
                  {nuked.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.magenta, letterSpacing: "0.1em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <AlertTriangle size={12} /> CRITICAL EXPOSURES
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {nuked.map(f => (
                          <motion.div
                            key={f.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="nuked-item"
                            style={{
                              padding: "10px 12px",
                              borderRadius: 8,
                              border: `1px solid ${NEON.magenta}44`,
                              cursor: "pointer",
                              background: "rgba(255,46,159,0.05)"
                            }}
                            onClick={() => handleSend(undefined, `Tell me more about the ${f.finding} finding in the ${f.module} module. How do I fix it?`, f.id)}
                          >
                            <div style={{ fontSize: "0.75rem", color: NEON.text, fontWeight: 600, marginBottom: 2 }}>{f.finding}</div>
                            <div style={{ fontSize: "0.6rem", color: NEON.textMuted, fontFamily: "'Share Tech Mono'" }}>{f.module.toUpperCase()}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {knoxed.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.blue, letterSpacing: "0.1em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <Shield size={12} /> HARDENED VECTORS
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {knoxed.map(f => (
                          <motion.div
                            key={f.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 8,
                              border: `1px solid ${NEON.blue}44`,
                              cursor: "pointer",
                              background: "rgba(0,212,255,0.05)"
                            }}
                            onClick={() => handleSend(undefined, `I want more info on the hardened ${f.finding} finding in the ${f.module} module.`, f.id)}
                          >
                            <div style={{ fontSize: "0.75rem", color: NEON.text, fontWeight: 600, marginBottom: 2 }}>{f.finding}</div>
                            <div style={{ fontSize: "0.6rem", color: NEON.textMuted, fontFamily: "'Share Tech Mono'" }}>{f.module.toUpperCase()}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {monitored.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.orange, letterSpacing: "0.1em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <Globe size={12} /> MONITORED VECTORS
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {monitored.map(f => (
                          <motion.div
                            key={f.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 8,
                              border: `1px solid ${NEON.orange}44`,
                              cursor: "pointer",
                              background: "rgba(255,122,24,0.05)"
                            }}
                            onClick={() => handleSend(undefined, `What is the current status of the monitored ${f.finding} finding in the ${f.module} module?`, f.id)}
                          >
                            <div style={{ fontSize: "0.75rem", color: NEON.text, fontWeight: 600, marginBottom: 2 }}>{f.finding}</div>
                            <div style={{ fontSize: "0.6rem", color: NEON.textMuted, fontFamily: "'Share Tech Mono'" }}>{f.module.toUpperCase()}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: NEON.orange, letterSpacing: "0.1em", marginBottom: 4, marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Rss size={12} /> THREAT INTELLIGENCE
            </div>

            {isFeedLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ height: 60, background: "rgba(255,255,255,0.03)", borderRadius: 8, animation: "pulse 2s infinite" }} />
                ))}
              </div>
            ) : (
              threatFeed
                .filter(threat => {
                  const matchesSearch = threat.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                       threat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       threat.vector.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesModule = !selectedModule || threat.vector.toLowerCase() === selectedModule.toLowerCase();
                  const matchesSeverity = selectedSeverity === 'ALL' || threat.severity === selectedSeverity;
                  return matchesSearch && matchesModule && matchesSeverity;
                })
                .map((threat, idx) => {
                  const isTopThreat = idx < 3 && !searchTerm && !selectedModule && selectedSeverity === 'ALL';
                  const severityColor = threat.severity === 'High' ? NEON.magenta : threat.severity === 'Medium' ? NEON.orange : NEON.blue;
                  
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      style={{ 
                        padding: 12, 
                        background: isTopThreat ? "rgba(255, 122, 24, 0.08)" : "rgba(255,255,255,0.03)", 
                        borderRadius: 8, 
                        borderLeft: `3px solid ${severityColor}`,
                        border: isTopThreat ? `1px solid ${NEON.orange}44` : 'none',
                        boxShadow: isTopThreat ? `0 0 15px ${NEON.orange}22` : 'none',
                        cursor: "pointer",
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onClick={() => {
                        setInput(`Tell me more about the threat: ${threat.title}. What are the risks and how can I protect myself?`);
                        chatInputRef.current?.focus();
                        toast.info("PROMPT GENERATED", {
                          description: "Intelligence query added to command center.",
                          duration: 3000,
                        });
                      }}
                    >
                      {isTopThreat && (
                        <div style={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0, 
                          background: NEON.orange, 
                          color: '#000', 
                          fontSize: '8px', 
                          fontWeight: 900, 
                          padding: '2px 6px', 
                          borderBottomLeftRadius: 4,
                          fontFamily: "'Orbitron', sans-serif",
                          letterSpacing: '0.05em'
                        }}>
                          TOP THREAT
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <span style={{ fontSize: "10px", color: severityColor, fontWeight: 700, textTransform: "uppercase" }}>
                          {threat.severity} RISK
                        </span>
                        <span style={{ fontSize: "10px", color: NEON.textMuted }}>{threat.time}</span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: NEON.text, fontWeight: 500, lineHeight: 1.3, marginBottom: 4 }}>
                        {threat.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "10px", color: NEON.textMuted }}>
                        <Globe size={10} />
                        {threat.source}
                      </div>
                    </motion.div>
                  );
                })
            )}
          </div>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${NEON.textMuted}22`, display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldAlert size={14} color={NEON.blue} />
            <span style={{ fontSize: "10px", color: NEON.textMuted, fontFamily: "'Share Tech Mono'" }}>
              AI-CURATED REAL-TIME INTEL
            </span>
          </div>
        </GlassCard>

        {/* History & Remediation Sidebar */}
        <GlassCard style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", maxHeight: "50%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, borderBottom: `1px solid ${NEON.textMuted}22`, paddingBottom: 8 }}>
            <button 
              onClick={() => setSidebarTab('history')}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                color: sidebarTab === 'history' ? NEON.magenta : NEON.textMuted,
                transition: 'all 0.2s',
                padding: '4px 8px',
                borderBottom: sidebarTab === 'history' ? `2px solid ${NEON.magenta}` : '2px solid transparent'
              }}
            >
              <History size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>HISTORY</span>
            </button>
            <button 
              onClick={() => setSidebarTab('remediation')}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                color: sidebarTab === 'remediation' ? NEON.blue : NEON.textMuted,
                transition: 'all 0.2s',
                padding: '4px 8px',
                borderBottom: sidebarTab === 'remediation' ? `2px solid ${NEON.blue}` : '2px solid transparent'
              }}
            >
              <ShieldCheck size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>REMEDIATION</span>
            </button>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {sidebarTab === 'history' ? (
              scanHistory.length === 0 ? (
                <div style={{ fontSize: "0.8rem", color: NEON.textMuted, textAlign: "center", marginTop: 20 }}>
                  No past scans found.
                </div>
              ) : (
                scanHistory.map((scan, idx) => (
                  <motion.div 
                    key={scan.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    style={{ 
                      padding: 12, 
                      background: expandedScanId === scan.id ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)", 
                      borderRadius: 8, 
                      borderLeft: `3px solid ${NEON.magenta}`,
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }}
                    onClick={() => setExpandedScanId(expandedScanId === scan.id ? null : scan.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <span style={{ fontSize: "10px", color: NEON.textMuted }}>
                        {scan.timestamp.toLocaleDateString()} {scan.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span style={{ fontSize: "12px", color: NEON.blue, fontWeight: 700 }}>
                        SCORE: {scan.score}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, fontSize: "10px", color: NEON.textMuted, marginTop: 8 }}>
                      <span style={{ color: NEON.magenta }}>{(scan as any).nukedCount || 0} NUKED</span>
                      <span style={{ color: NEON.blue }}>{(scan as any).knoxedCount || 0} KNOXED</span>
                      <span style={{ color: NEON.orange }}>{(scan as any).monitoredCount || 0} MONITORED</span>
                    </div>
                    
                    <AnimatePresence>
                      {expandedScanId === scan.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {scan.findings && scan.findings.length > 0 ? (
                              scan.findings.map((f: ScanFinding, fIdx: number) => (
                                <div key={fIdx} style={{ 
                                  padding: 8, 
                                  background: 'rgba(0,0,0,0.2)', 
                                  borderRadius: 4,
                                  borderLeft: `2px solid ${f.status === 'NUKED' ? NEON.magenta : f.status === 'KNOXED' ? NEON.blue : NEON.orange}`
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: NEON.textMuted }}>{f.module.toUpperCase()}</span>
                                    <span style={{ 
                                      fontSize: '9px', 
                                      padding: '2px 6px', 
                                      borderRadius: 4, 
                                      background: f.status === 'NUKED' ? 'rgba(255, 46, 159, 0.1)' : f.status === 'KNOXED' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(0, 255, 170, 0.1)',
                                      color: f.status === 'NUKED' ? NEON.magenta : f.status === 'KNOXED' ? NEON.blue : NEON.orange
                                    }}>
                                      {f.status}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#fff' }}>{f.finding}</div>
                                </div>
                              ))
                            ) : (
                              <div style={{ fontSize: '10px', color: NEON.textMuted }}>No detailed findings available for this scan.</div>
                            )}
                            <NeonButton 
                              size="sm" 
                              color={NEON.blue} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHistoryScan(scan);
                              }}
                              style={{ marginTop: 4, fontSize: '10px', padding: '4px 8px' }}
                            >
                              VIEW FULL REPORT
                            </NeonButton>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <NeonButton 
                  size="sm" 
                  color={NEON.blue} 
                  style={{ width: '100%', marginBottom: 8, height: 40 }}
                  onClick={() => setShowHardeningModal(true)}
                >
                  <Zap size={14} style={{ marginRight: 6 }} /> HARDEN CODE SNIPPET
                </NeonButton>

                <div style={{ fontSize: '0.7rem', color: NEON.textMuted, fontFamily: "'Share Tech Mono'", marginBottom: 4 }}>
                  PENDING REMEDIATIONS ({findings.filter(f => f.status === 'NUKED').length})
                </div>

                {findings.filter(f => f.status === 'NUKED').length === 0 ? (
                  <div style={{ fontSize: "0.75rem", color: NEON.textMuted, textAlign: "center", padding: '20px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    All vectors secured. No pending remediations.
                  </div>
                ) : (
                  findings.filter(f => f.status === 'NUKED').map((f, idx) => (
                    <motion.div 
                      key={f.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{ 
                        padding: 10, 
                        background: "rgba(255,46,159,0.05)", 
                        borderRadius: 8, 
                        border: `1px solid ${NEON.magenta}33`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: NEON.text }}>{f.finding}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.6rem', color: NEON.textMuted, fontFamily: "'Share Tech Mono'" }}>{f.module.toUpperCase()}</span>
                        <button 
                          onClick={() => handleSend(undefined, `Initiate automated remediation for: ${f.finding} in the ${f.module} vector. Provide a direct code fix.`, f.id)}
                          style={{ 
                            background: NEON.magenta, 
                            color: '#000', 
                            border: 'none', 
                            borderRadius: 4, 
                            padding: '2px 8px', 
                            fontSize: '0.6rem', 
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: "'Orbitron', sans-serif"
                          }}
                        >
                          FIX NOW
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Hardening Modal */}
      <AnimatePresence>
        {showHardeningModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)'
            }}
            onClick={() => setShowHardeningModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                width: '90%',
                maxWidth: 700,
                background: '#060d1f',
                border: `1px solid ${NEON.blue}`,
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: `0 0 40px ${NEON.blue}33`,
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Decorative background */}
              <div style={{ position: 'absolute', top: -50, right: -50, opacity: 0.05, transform: 'rotate(15deg)' }}>
                <ShieldCheck size={200} color={NEON.blue} />
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 212, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${NEON.blue}44` }}>
                      <Zap size={18} color={NEON.blue} />
                    </div>
                    <NeonText color={NEON.blue} size="1.2rem" weight={700}>SOVEREIGN HARDENING ENCLAVE</NeonText>
                  </div>
                  <button 
                    onClick={() => setShowHardeningModal(false)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: NEON.textMuted }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <p style={{ color: NEON.textMuted, fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.5 }}>
                  Paste your code snippet below. Architect AI will perform a deep security audit and provide automated remediations for identified vulnerabilities.
                </p>

                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <textarea 
                    value={hardeningCode}
                    onChange={e => setHardeningCode(e.target.value)}
                    placeholder="// Paste code here for security analysis..."
                    style={{ 
                      width: '100%', 
                      height: 250, 
                      background: 'rgba(0,0,0,0.3)', 
                      border: `1px solid ${NEON.blue}33`, 
                      borderRadius: 8, 
                      padding: 16, 
                      color: NEON.text, 
                      fontFamily: "'JetBrains Mono', monospace", 
                      fontSize: '0.8rem',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                  <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: '0.6rem', color: NEON.textMuted, fontFamily: "'Share Tech Mono'" }}>
                    {hardeningCode.length} CHARS
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <NeonButton 
                    color={NEON.blue} 
                    style={{ flex: 1, height: 48 }}
                    disabled={!hardeningCode.trim() || isLoading}
                    onClick={() => {
                      handleSend(undefined, `Perform a deep security audit and provide automated remediations for the following code snippet:\n\n\`\`\`\n${hardeningCode}\n\`\`\`\n\nIdentify vulnerabilities and provide specific 'Apply Fix' buttons for each.`);
                      setShowHardeningModal(false);
                      setHardeningCode('');
                    }}
                  >
                    {isLoading ? "INITIALIZING ENCLAVE..." : "⚡ SCAN & REMEDIATE"}
                  </NeonButton>
                  <button 
                    onClick={() => setShowHardeningModal(false)}
                    style={{ 
                      flex: '0 0 100px', 
                      background: 'rgba(255,255,255,0.05)', 
                      border: 'none', 
                      borderRadius: 8, 
                      color: NEON.text, 
                      fontSize: '0.85rem', 
                      fontWeight: 600, 
                      cursor: 'pointer' 
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan History Details Modal */}
      <AnimatePresence>
        {selectedHistoryScan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setSelectedHistoryScan(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                width: '90%',
                maxWidth: 800,
                maxHeight: '80vh',
                background: '#060d1f',
                border: `1px solid ${NEON.magenta}`,
                borderRadius: 12,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: `0 0 30px ${NEON.magenta}33`
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <NeonText color={NEON.magenta} size="1.5rem" weight={700}>SCAN DETAILS</NeonText>
                  <div style={{ color: NEON.textMuted, fontSize: '0.9rem', marginTop: 4 }}>
                    {selectedHistoryScan.timestamp.toLocaleString()} • Score: {selectedHistoryScan.score}/100
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedHistoryScan(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: NEON.textMuted }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 8 }}>
                {selectedHistoryScan.findings && selectedHistoryScan.findings.length > 0 ? (
                  selectedHistoryScan.findings.map((f: ScanFinding, idx: number) => (
                    <div key={idx} style={{ 
                      padding: 16, 
                      background: 'rgba(255,255,255,0.03)', 
                      borderRadius: 8,
                      borderLeft: `3px solid ${f.status === 'NUKED' ? NEON.magenta : f.status === 'KNOXED' ? NEON.blue : NEON.orange}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: NEON.text, fontWeight: 600 }}>{f.finding}</span>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          padding: '2px 8px', 
                          borderRadius: 12,
                          background: f.status === 'NUKED' ? 'rgba(255,46,159,0.2)' : f.status === 'KNOXED' ? 'rgba(0,212,255,0.2)' : 'rgba(255,122,24,0.2)',
                          color: f.status === 'NUKED' ? NEON.magenta : f.status === 'KNOXED' ? NEON.blue : NEON.orange
                        }}>
                          {f.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: NEON.textMuted, marginBottom: 8 }}>
                        Module: <span style={{ color: NEON.text }}>{f.module.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: 1.5 }}>
                        {f.details}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: NEON.textMuted, textAlign: 'center', marginTop: 40 }}>
                    No detailed findings available for this scan.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
