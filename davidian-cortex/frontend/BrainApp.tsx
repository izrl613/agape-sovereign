import React, { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowDownToLine, ArrowUpRight, BookOpen, BrainCircuit, BriefcaseBusiness, Check, ChevronDown, Cloud,
  File, FileArchive, FileText, Folder, FolderOpen, HardDrive, Layers3,
  Link2, LockKeyhole, Menu, MessageSquareText, MoreHorizontal, Network, Plus, Search, Send,
  Settings2, ShieldCheck, Sparkles, Trash2, Upload, UserRound, X, Zap,
} from 'lucide-react';
import './brain.css';

type Source = 'iCloud Drive' | 'OneDrive' | 'Google Drive' | 'Gemini Notebook' | 'iCloud Notes' | 'Local files';
type BrainFile = { id: string; name: string; size: number; source: Source; kind: string; added: number; text?: string; folder?: string };
type Note = { id: string; title: string; body: string; created: number; kind: string };
type BrainProject = { id: string; name: string; description: string; created: number; updated: number; color: string; fileIds: string[] };
type Message = { id: string; role: 'user' | 'cortex'; text: string; time: string };
type CloudService = 'iCloud Drive' | 'OneDrive' | 'Google Drive';

const FILES_KEY = 'davidian-cortex-files-v1';
const NOTES_KEY = 'davidian-cortex-notes-v1';
const MESSAGES_KEY = 'davidian-cortex-messages-v1';
const PROVIDERS_KEY = 'davidian-cortex-providers-v1';
const PROJECTS_KEY = 'davidian-cortex-projects-v1';
const PROFILE_KEY = 'davidian-cortex-profile-v1';
const DENSITY_KEY = 'davidian-cortex-density-v1';
const initialFiles: BrainFile[] = [
  { id: 'f1', name: 'The long arc of becoming.md', size: 24800, source: 'Local files', kind: 'Markdown', added: Date.now() - 1000 * 60 * 31, folder: 'Personal / Reflections', text: 'Growth is less a straight line than a network. Ideas become useful when they connect to lived experience, recur over time, and change the questions we ask.' },
  { id: 'f2', name: 'Cortex research brief.pdf', size: 1843200, source: 'Google Drive', kind: 'PDF', added: Date.now() - 1000 * 60 * 60 * 4, folder: 'Research / AI', text: 'A working brief on personal knowledge systems, retrieval, and trustworthy AI.' },
  { id: 'f3', name: 'Notebook — recursive thinking', size: 8600, source: 'Gemini Notebook', kind: 'Notebook', added: Date.now() - 1000 * 60 * 60 * 18, folder: 'Notebooks', text: 'Key ideas: recursive mapping, memory as a living graph, and creating a reliable path from curiosity to synthesis.' },
  { id: 'f4', name: 'Field notes — October 26', size: 4200, source: 'iCloud Notes', kind: 'Note', added: Date.now() - 1000 * 60 * 60 * 27, folder: 'Notes / Daily', text: 'A good system should make it easier to notice what I already know, then make room for what I have not learned yet.' },
  { id: 'f5', name: 'Studio roadmap 2026.docx', size: 66200, source: 'OneDrive', kind: 'Document', added: Date.now() - 1000 * 60 * 60 * 43, folder: 'Studio / Planning', text: 'Roadmap themes: durable tools, thoughtful automation, practical creativity, and a more connected personal archive.' },
];
const initialNotes: Note[] = [
  { id: 'n1', title: 'Recursive thinking', body: 'An idea gets stronger when I can trace it back to a source, relate it to another discipline, and put it to work.', created: Date.now() - 1000 * 60 * 35, kind: 'Synthesis' },
  { id: 'n2', title: 'A personal knowledge graph', body: 'The archive should reflect how I think: nodes for concepts, edges for relationships, and provenance for every connection.', created: Date.now() - 1000 * 60 * 60 * 3, kind: 'Hypothesis' },
];
const seedMessages: Message[] = [
  { id: 'm1', role: 'cortex', text: 'Welcome back, Israel. Your knowledge space is ready. Add a file, connect a library, or ask a question to start a new thread.', time: '09:41' },
];
const providerMeta: Record<CloudService, { color: string; glyph: string; description: string }> = {
  'iCloud Drive': { color: '#65a8ff', glyph: '☁', description: 'Bring in folders from iCloud Drive using a local folder export or file picker.' },
  OneDrive: { color: '#55aaff', glyph: '▰', description: 'Import a folder or connect your Microsoft account when OAuth is configured.' },
  'Google Drive': { color: '#8bb7ff', glyph: '▲', description: 'Import Drive folders or connect Google Drive when OAuth is configured.' },
};
const navItems = [
  { id: 'overview', label: 'Overview', icon: Network },
  { id: 'library', label: 'Knowledge library', icon: Layers3 },
  { id: 'notebooks', label: 'Notebooks & notes', icon: BookOpen },
  { id: 'projects', label: 'Projects', icon: BriefcaseBusiness },
  { id: 'activity', label: 'Activity stream', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];
const graphNodes = [
  [0.1,0.48,'SOURCE'],[0.2,0.23,'identity'],[0.25,0.69,'curiosity'],[0.35,0.43,'memory'],[0.4,0.16,'recursive thinking'],[0.48,0.76,'field notes'],[0.53,0.34,'knowledge graph'],[0.62,0.57,'synthesis'],[0.67,0.16,'AI research'],[0.75,0.42,'creative practice'],[0.82,0.72,'studio roadmap'],[0.9,0.26,'future self'],[0.92,0.57,'patterns'],[0.35,0.87,'values'],[0.58,0.9,'questions'],[0.15,0.85,'daily notes'],[0.79,0.88,'learning'],[0.49,0.06,'ideas'],[0.06,0.12,'attention'],[0.68,0.29,'agency'],[0.29,0.57,'meaning'],[0.88,0.1,'projects'],[0.45,0.56,'reflection'],[0.14,0.35,'focus'],[0.59,0.71,'decisions'],[0.99,0.42,'possibility'],
] as const;
const graphEdges = [[0,1],[0,18],[0,23],[1,3],[1,20],[2,3],[2,13],[2,15],[3,4],[3,5],[3,6],[3,20],[4,6],[4,17],[4,22],[5,7],[5,13],[6,7],[6,8],[6,19],[6,22],[7,9],[7,14],[7,22],[8,9],[8,11],[9,10],[9,12],[9,19],[10,16],[10,24],[11,12],[11,21],[12,16],[12,25],[13,14],[13,15],[14,16],[14,24],[17,18],[17,19],[18,23],[20,22],[21,25],[22,24]];

function readStored<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
function writeStored(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
function timeAgo(time: number) { const mins = Math.max(1, Math.floor((Date.now() - time) / 60000)); return mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`; }
function bytes(n: number) { if (n < 1024) return `${n} B`; if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`; return `${(n / 1024 ** 2).toFixed(1)} MB`; }
function fileKind(name: string) { const ext = name.split('.').pop()?.toLowerCase() || ''; if (['md','txt','rtf','html','htm'].includes(ext)) return 'Text'; if (ext === 'pdf') return 'PDF'; if (['doc','docx','pages'].includes(ext)) return 'Document'; if (['json','ipynb'].includes(ext)) return 'Notebook'; if (['jpg','jpeg','png','gif','heic','webp'].includes(ext)) return 'Image'; if (['zip','tar','gz'].includes(ext)) return 'Archive'; return ext ? ext.toUpperCase() : 'File'; }

export function DavidianCortex() {
  const [files, setFiles] = useState<BrainFile[]>(() => readStored(FILES_KEY, initialFiles));
  const [notes, setNotes] = useState<Note[]>(() => readStored(NOTES_KEY, initialNotes));
  const [messages, setMessages] = useState<Message[]>(() => readStored(MESSAGES_KEY, seedMessages));
  const [providers, setProviders] = useState<Record<CloudService, boolean>>(() => readStored(PROVIDERS_KEY, { 'iCloud Drive': false, OneDrive: false, 'Google Drive': false }));
  const [projects, setProjects] = useState<BrainProject[]>(() => readStored(PROJECTS_KEY, []));
  const [profileName, setProfileName] = useState<string>(() => readStored(PROFILE_KEY, 'Israel David'));
  const [nameDraft, setNameDraft] = useState(profileName);
  const [compactMode, setCompactMode] = useState<boolean>(() => readStored(DENSITY_KEY, false));
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectFileSelection, setProjectFileSelection] = useState<string[]>([]);
  const [activeNav, setActiveNav] = useState('overview');
  const [activeTab, setActiveTab] = useState<'Council'|'Memory'|'Tools'>('Council');
  const [query, setQuery] = useState('');
  const [prompt, setPrompt] = useState('');
  const [dialog, setDialog] = useState<'sources'|'notes'|'connect'|'project'|'projectFiles'|null>(null);
  const [connectService, setConnectService] = useState<CloudService>('Google Drive');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [dragging, setDragging] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [scope, setScope] = useState('All sources');
  const uploadRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const notebookRef = useRef<HTMLInputElement>(null);
  const noteImportRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const visibleFiles = useMemo(() => files.filter(file => `${file.name} ${file.folder || ''} ${file.source} ${file.text || ''}`.toLowerCase().includes(query.toLowerCase())), [files, query]);
  const visibleNotes = useMemo(() => notes.filter(note => `${note.title} ${note.body}`.toLowerCase().includes(query.toLowerCase())), [notes, query]);
  const selectedProject = projects.find(project => project.id === selectedProjectId) || null;

  useEffect(() => { if (!writeStored(FILES_KEY, files)) setToast('Browser storage is full. Export your archive and remove some imported items.'); }, [files]);
  useEffect(() => { if (!writeStored(NOTES_KEY, notes)) setToast('Browser storage is full. Export your archive and remove some imported items.'); }, [notes]);
  useEffect(() => { if (!writeStored(MESSAGES_KEY, messages)) setToast('Conversation history is too large to save. Export your archive.'); }, [messages]);
  useEffect(() => { writeStored(PROVIDERS_KEY, providers); }, [providers]);
  useEffect(() => { if (!writeStored(PROJECTS_KEY, projects)) setToast('Browser storage is full. Export your archive before adding more projects.'); }, [projects]);
  useEffect(() => { writeStored(PROFILE_KEY, profileName); }, [profileName]);
  useEffect(() => { writeStored(DENSITY_KEY, compactMode); }, [compactMode]);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(''), 3600); return () => window.clearTimeout(id); }, [toast]);
  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setActiveNav('library'); window.setTimeout(() => searchRef.current?.focus(), 30);
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  const appendFiles = async (list: FileList | File[], source: Source = 'Local files') => {
    const incoming: BrainFile[] = await Promise.all(Array.from(list).map(async file => {
      const canRead = file.size < 500_000 && (/^(text\/|application\/(json|pdf|xml))/.test(file.type) || /\.(md|txt|json|html?|csv)$/i.test(file.name));
      let text = '';
      if (canRead && !/\.pdf$/i.test(file.name)) { try { text = (await file.text()).slice(0, 12000); } catch { /* binary or unsupported */ } }
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || '';
      const folder = relativePath.includes('/') ? relativePath.split('/').slice(0, -1).join(' / ') : undefined;
      return { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, name: file.name, size: file.size, source, kind: fileKind(file.name), added: Date.now(), text, folder };
    }));
    if (!incoming.length) return;
    setFiles(old => [...incoming, ...old]);
    setToast(`${incoming.length} item${incoming.length === 1 ? '' : 's'} added to your library`);
  };
  const handleUpload = (event: ChangeEvent<HTMLInputElement>, source: Source = 'Local files') => { if (event.target.files) void appendFiles(event.target.files, source); event.target.value = ''; };
  const handleDrop = (event: DragEvent<HTMLElement>) => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files.length) void appendFiles(event.dataTransfer.files); };
  const addNote = () => {
    if (!noteTitle.trim() || !noteBody.trim()) return;
    const note: Note = { id: `${Date.now()}`, title: noteTitle.trim(), body: noteBody.trim(), created: Date.now(), kind: 'Personal note' };
    setNotes(old => [note, ...old]); setNoteTitle(''); setNoteBody(''); setDialog(null); setToast('Note saved to your personal memory');
  };
  const createProject = () => {
    const cleanName = projectName.trim();
    if (!cleanName) return;
    const now = Date.now();
    const project: BrainProject = { id: `${now}-${Math.random().toString(36).slice(2,7)}`, name: cleanName, description: projectDescription.trim(), created: now, updated: now, color: ['magenta','blue','orange'][projects.length % 3], fileIds: [] };
    setProjects(old => [project, ...old]); setSelectedProjectId(project.id); setActiveNav('projects'); setProjectName(''); setProjectDescription(''); setDialog(null); setToast(`Project “${cleanName}” created`);
  };
  const saveProjectFiles = () => {
    if (!selectedProjectId) return;
    setProjects(old => old.map(project => project.id === selectedProjectId ? { ...project, fileIds: projectFileSelection, updated: Date.now() } : project));
    setDialog(null); setToast('Project sources updated');
  };
  const deleteProject = (project: BrainProject) => {
    if (!window.confirm(`Delete the project “${project.name}”? Your notes and files will stay in the library.`)) return;
    setProjects(old => old.filter(item => item.id !== project.id));
    if (selectedProjectId === project.id) setSelectedProjectId(null);
    setToast(`Project “${project.name}” deleted`);
  };
  const clearLocalWorkspace = () => {
    if (!window.confirm('Clear imported files, notes, projects, and conversation from this browser? This cannot be undone.')) return;
    setFiles([]); setNotes([]); setProjects([]); setMessages(seedMessages); setSelectedProjectId(null); setToast('Local workspace cleared');
  };
  const askCortex = () => {
    const clean = prompt.trim(); if (!clean) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = { id: `${Date.now()}`, role: 'user', text: clean, time: now };
    const terms = clean.toLowerCase().split(/\W+/).filter(word => word.length > 3);
    const matches = [...files.map(file => ({ title: file.name, content: file.text || '', source: file.source })), ...notes.map(note => ({ title: note.title, content: note.body, source: note.kind }))]
      .map(item => ({ ...item, score: terms.filter(term => `${item.title} ${item.content}`.toLowerCase().includes(term)).length }))
      .filter(item => item.score > 0).sort((a,b) => b.score-a.score).slice(0,3);
    const reply = matches.length
      ? `I found ${matches.length} relevant ${matches.length === 1 ? 'source' : 'sources'} in your personal archive. ${matches.map(item => `“${item.title}” (${item.source})`).join('; ')}. These look connected to your question. I can synthesize them further as your library grows.`
      : `I’ve added your question to the workspace thread. I don’t see a direct match in the sources currently indexed, so try adding a related note, Gemini notebook, or cloud folder to give this question more context.`;
    setMessages(old => [...old, userMessage, { id: `${Date.now()}-reply`, role: 'cortex', text: reply, time: now }]); setPrompt('');
    window.setTimeout(() => document.getElementById('message-end')?.scrollIntoView({ behavior: 'smooth' }), 20);
  };
  const connect = () => {
    if (providers[connectService]) { setProviders(old => ({ ...old, [connectService]: false })); setToast(`${connectService} disconnected`); }
    else { setDialog(null); setToast(`To securely link ${connectService}, choose “Import a folder” or configure OAuth credentials in your private deployment.`); }
  };
  const importTextCollection = async (event: ChangeEvent<HTMLInputElement>, source: 'Gemini Notebook'|'iCloud Notes') => {
    const picked = event.target.files; if (!picked) return;
    const newNotes: Note[] = [];
    for (const file of Array.from(picked)) {
      if (file.size > 1_000_000) continue;
      try {
        const body = (await file.text()).slice(0, 20000);
        const title = file.name.replace(/\.(md|txt|json|html?)$/i, '');
        const asNotebook = source === 'Gemini Notebook';
        newNotes.push({ id: `${Date.now()}-${Math.random()}`, title, body, created: Date.now(), kind: asNotebook ? 'Gemini Notebook' : 'iCloud Note' });
        setFiles(old => [{ id: `${Date.now()}-${Math.random()}`, name: file.name, size: file.size, source, kind: asNotebook ? 'Notebook' : 'Note', added: Date.now(), text: body.slice(0,12000), folder: asNotebook ? 'Notebooks' : 'Notes' }, ...old]);
      } catch { /* ignore unreadable export */ }
    }
    if (newNotes.length) { setNotes(old => [...newNotes, ...old]); setToast(`${newNotes.length} ${source === 'Gemini Notebook' ? 'notebook' : 'note'}${newNotes.length === 1 ? '' : 's'} imported`); }
    else setToast('No readable text files found. Export your notes as .txt, .md, .html, or .json and try again.');
    event.target.value = '';
  };
  const downloadArchive = () => {
    const data = JSON.stringify({ app: 'DAVIDIAN CORTEX', owner: profileName, exportedAt: new Date().toISOString(), files, notes, projects, messages }, null, 2);
    const href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); const link = document.createElement('a'); link.href = href; link.download = 'davidian-cortex-archive.json'; link.click(); URL.revokeObjectURL(href); setToast('Encrypted-workspace data export prepared as JSON');
  };

  return <div className={`cortex-app ${dragging ? 'is-dragging' : ''} ${compactMode ? 'compact-mode' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={e => { if (e.currentTarget === e.target) setDragging(false); }} onDrop={handleDrop}>
    <input ref={uploadRef} type="file" multiple hidden onChange={e => handleUpload(e)} />
    <input ref={folderRef} type="file" multiple hidden {...{ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>} onChange={e => handleUpload(e)} />
    <input ref={notebookRef} type="file" multiple hidden accept=".md,.txt,.json,.html,.htm" onChange={e => void importTextCollection(e, 'Gemini Notebook')} />
    <input ref={noteImportRef} type="file" multiple hidden accept=".md,.txt,.json,.html,.htm" onChange={e => void importTextCollection(e, 'iCloud Notes')} />
    <header className="topbar">
      <button className="mobile-menu icon-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation"><Menu size={17}/></button>
      <div className="brandmark"><div className="brand-orbit"><BrainCircuit size={18}/><span/></div><div><div className="brand-title">DAVIDIAN <i>//</i> CORTEX</div><div className="brand-sub">ISRAEL DAVID’S PERSONAL KNOWLEDGE ENGINE</div></div></div>
      <div className="top-status"><span className="status-pulse"/> PRIVATE WORKSPACE <span className="status-sep">/</span> LOCAL-FIRST</div>
      <div className="top-metrics"><div><span>MEMORY</span><b>{files.length + notes.length} ITEMS</b></div><div><span>STORAGE</span><b>{bytes(totalBytes)}</b></div><div className="sync-state"><span className="status-pulse"/> SAVED</div></div>
      <button className="settings-button" onClick={() => { setActiveNav('settings'); setMobileMenu(false); }}><Settings2 size={15}/><span>Settings</span></button>
    </header>

    <aside className={`left-rail ${mobileMenu ? 'nav-open' : ''}`}>
      <div className="rail-section-label">YOUR MIND</div>
      {navItems.map(item => <button key={item.id} className={`rail-item ${activeNav === item.id ? 'selected' : ''}`} onClick={() => { setActiveNav(item.id); setMobileMenu(false); }}><item.icon size={16}/><span>{item.label}</span>{item.id==='library' && <b className="rail-count">{files.length}</b>}{item.id==='projects' && <b className="rail-count">{projects.length}</b>}</button>)}
      <div className="rail-divider"/>
      <div className="rail-section-head"><span>CONNECTED SOURCES</span><button title="Add source" onClick={() => setDialog('sources')}><Plus size={15}/></button></div>
      {(['iCloud Drive','OneDrive','Google Drive'] as CloudService[]).map(name => <button key={name} className="source-item" onClick={() => { setConnectService(name); setDialog('connect'); }}><span className={`provider-dot ${name.toLowerCase().replaceAll(' ','-')}`}>{providerMeta[name].glyph}</span><span>{name}</span><span className={`source-state ${providers[name] ? 'connected' : ''}`}>{providers[name] ? '●' : '○'}</span></button>)}
      <div className="rail-divider"/>
      <div className="rail-section-head"><span>QUICK ACCESS</span></div>
      <button className="quick-item" onClick={() => setActiveNav('notebooks')}><span className="quick-icon violet"><BookOpen size={14}/></span><span>Gemini notebooks</span><ChevronDown size={13}/></button>
      <button className="quick-item" onClick={() => setActiveNav('notebooks')}><span className="quick-icon orange"><FileText size={14}/></span><span>iCloud notes</span><ChevronDown size={13}/></button>
      <div className="rail-bottom">
        <div className="privacy-card"><div className="privacy-icon"><LockKeyhole size={15}/></div><div><b>Your mind, your rules.</b><p>Files stay in this browser until you export or connect a provider.</p></div></div>
        <button className="profile-button" onClick={() => { setNameDraft(profileName); setActiveNav('settings'); }}><div className="avatar">{profileName.split(/\s+/).map(part => part[0]).join('').slice(0,2).toUpperCase()}</div><div><b>{profileName}</b><small>Workspace owner · Settings</small></div><MoreHorizontal size={16}/></button>
      </div>
    </aside>

    <main className="main-column">
      <div className="workspace-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> PERSONAL KNOWLEDGE SYSTEM <span className="slash">/</span> {activeNav.toUpperCase()}</div><h1>{activeNav === 'overview' ? <>Your mind, <em>connected.</em></> : activeNav === 'library' ? <>Knowledge <em>library.</em></> : activeNav === 'notebooks' ? <>Notes & <em>notebooks.</em></> : activeNav === 'projects' ? <>Your <em>projects.</em></> : activeNav === 'settings' ? <>Workspace <em>settings.</em></> : <>The living <em>stream.</em></>}</h1><p>{activeNav === 'settings' ? 'Make DAVIDIAN CORTEX feel like yours.' : activeNav === 'projects' ? 'Give each area of focus a home, with its own files and notes.' : <>One home for the ideas, notes, and sources that make you <strong>you.</strong></>}</p></div><div className="heading-actions"><button className="outline-button" onClick={activeNav === 'projects' ? () => { setSelectedProjectId(null); setActiveNav('projects'); } : downloadArchive}><ArrowDownToLine size={14}/>{activeNav === 'projects' ? 'All projects' : 'Export'}</button><button className="primary-button" onClick={() => activeNav === 'projects' ? setDialog('project') : setDialog('sources')}><Plus size={15}/>{activeNav === 'projects' ? 'New project' : 'Add to brain'}</button></div></div>

      {activeNav === 'overview' ? <>
        <section className="graph-card panel">
          <div className="panel-heading"><div><div className="section-title"><Network size={14}/> GLOBAL WORKSPACE TOPOLOGY</div><div className="section-caption">A living map of your ideas, sources, and the paths between them.</div></div><div className="graph-controls"><span className="graph-legend"><i className="legend-magenta"/> Ideas <i className="legend-blue"/> Sources <i className="legend-orange"/> Insights</span><button className="tiny-select" onClick={() => setScope(scope === 'All sources' ? 'Recent' : 'All sources')}>{scope}<ChevronDown size={12}/></button></div></div>
          <div className="graph-canvas" onClick={() => setSelectedNode(null)}><div className="graph-grid"/><svg className="graph-lines" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-label="Interactive knowledge graph">{graphEdges.map(([a,b],i) => <line key={`${a}-${b}`} x1={graphNodes[a][0]*1000} y1={graphNodes[a][1]*600} x2={graphNodes[b][0]*1000} y2={graphNodes[b][1]*600} className={`edge edge-${i%4}`}/>)}{graphNodes.map((node,i) => <g key={i} className={`graph-node node-${i%3} ${selectedNode===node[2] ? 'active' : ''}`} onClick={e => { e.stopPropagation(); setSelectedNode(String(node[2])); }}><circle cx={node[0]*1000} cy={node[1]*600} r={selectedNode===node[2] ? 8 : i<5 ? 5 : 3.5}/><text x={node[0]*1000+8} y={node[1]*600-8}>{node[2]}</text></g>)}</svg><div className="graph-watermark">{files.length + notes.length} NODES <span>•</span> {graphEdges.length} RELATIONSHIPS <span>•</span> CLICK A NODE TO INSPECT</div><div className="graph-zoom"><button onClick={() => setToast('Graph zoomed in')}>+</button><span>100%</span><button onClick={() => setToast('Graph zoomed out')}>−</button></div></div>
        </section>
        <section className="bottom-panels"><div className="panel drive-panel"><div className="panel-heading"><div><div className="section-title"><HardDrive size={14}/> MEMORY DRIVE REGULATORS</div><div className="section-caption">A quick pulse on your personal knowledge system.</div></div><span className="live-tag"><i/> LIVE</span></div><div className="meter-row"><div><span>Indexed memory</span><b>{files.length + notes.length} items</b></div><div className="meter-track"><span style={{width:`${Math.min(100, 26+(files.length+notes.length)*4)}%`}}/></div><small>{files.length} source files <span>·</span> {notes.length} notes & notebooks</small></div><div className="meter-row"><div><span>Knowledge connections</span><b>{Math.min(99, 38+files.length*7)}%</b></div><div className="meter-track blue"><span style={{width:`${Math.min(95, 38+files.length*7)}%`}}/></div><small>Ideas linked across your archive</small></div><div className="meter-row"><div><span>Personal context</span><b>{notes.length ? 'GROWING' : 'READY'}</b></div><div className="meter-track orange"><span style={{width:`${Math.min(100, 19+notes.length*22)}%`}}/></div><small>Reflections, notebook imports, and notes</small></div><div className="regulator-footer"><ShieldCheck size={13}/> Files and notes are stored in this browser by default.</div></div>
          <div className="panel stream-panel"><div className="panel-heading"><div><div className="section-title"><Sparkles size={14}/> RECENTLY IN YOUR ORBIT</div><div className="section-caption">Fresh signals from your personal archive.</div></div><button className="text-link" onClick={() => setActiveNav('activity')}>View all <ArrowUpRight size={12}/></button></div><div className="recent-list">{files.slice(0,3).map(file => <button key={file.id} className="recent-item" onClick={() => { setQuery(file.name); setActiveNav('library'); }}><span className={`recent-icon ${file.source==='Gemini Notebook'?'violet':file.source==='iCloud Notes'?'orange':''}`}>{file.kind==='Notebook'?<BookOpen size={14}/>:file.kind==='Note'?<MessageSquareText size={14}/>:<FileText size={14}/>}</span><span className="recent-content"><b>{file.name}</b><small>{file.source} <i>·</i> {timeAgo(file.added)}</small></span><ArrowUpRight size={13}/></button>)}</div></div></section>
      </> : activeNav === 'library' ? <section className="panel full-list-panel"><div className="library-toolbar"><div className="searchbox"><Search size={15}/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your files, folders, and ideas…"/><kbd>⌘ K</kbd></div><button className="outline-button" onClick={()=>folderRef.current?.click()}><FolderOpen size={14}/> Add folder</button><button className="primary-button" onClick={()=>uploadRef.current?.click()}><Upload size={14}/> Upload files</button></div><div className="source-filters"><button className={scope==='All sources'?'active':''} onClick={()=>setScope('All sources')}>All sources <span>{files.length}</span></button>{(['iCloud Drive','OneDrive','Google Drive','Gemini Notebook','iCloud Notes','Local files'] as Source[]).map(s=><button className={scope===s?'active':''} key={s} onClick={()=>setScope(s)}>{s}</button>)}</div><div className="file-table"><div className="table-header"><span>NAME</span><span>LOCATION</span><span>TYPE</span><span>ADDED</span><span>SIZE</span></div>{visibleFiles.filter(file=>scope==='All sources'||file.source===scope).map(file=><div className="file-row" key={file.id}><span className="file-name"><span className="filetype-icon">{file.kind==='Archive'?<FileArchive size={15}/>:file.kind==='Notebook'?<BookOpen size={15}/>:file.kind==='Note'?<MessageSquareText size={15}/>:<File size={15}/>}</span><span><b>{file.name}</b><small>{file.folder || 'Root'}</small></span></span><span className="muted-cell"><span className={`provider-dot ${file.source.toLowerCase().replaceAll(' ','-')}`}>{file.source==='Gemini Notebook'?'✦':file.source==='iCloud Notes'?'✎':file.source==='Local files'?'◉':providerMeta[file.source as CloudService]?.glyph || '•'}</span>{file.source}</span><span className="muted-cell">{file.kind}</span><span className="muted-cell">{timeAgo(file.added)}</span><span className="muted-cell">{bytes(file.size)}</span></div>)}{visibleFiles.length===0&&<div className="empty-state"><FolderOpen size={24}/><b>No items found</b><span>Upload a folder or try a different search.</span></div>}</div><div className="drop-hint"><Upload size={14}/> Drag files or entire folders anywhere into this workspace. Your folder structure is kept.</div></section> : activeNav === 'notebooks' ? <section className="notes-layout"><div className="panel notes-panel"><div className="panel-heading"><div><div className="section-title"><BookOpen size={14}/> NOTEBOOKS & NOTES</div><div className="section-caption">Capture a thought or bring your notebooks into your brain.</div></div><button className="primary-button" onClick={()=>setDialog('notes')}><Plus size={14}/> New note</button></div><div className="import-cards"><button className="import-card gemini-card" onClick={()=>notebookRef.current?.click()}><span className="import-icon">✦</span><span><b>Import Gemini notebooks</b><small>Export notebook content as text, Markdown, or JSON.</small></span><ArrowUpRight size={15}/></button><button className="import-card apple-card" onClick={()=>noteImportRef.current?.click()}><span className="import-icon">✎</span><span><b>Import iCloud Notes</b><small>Bring in exported notes as text, HTML, Markdown, or JSON.</small></span><ArrowUpRight size={15}/></button></div><div className="note-list">{visibleNotes.map(note=><article className="note-card" key={note.id}><div className="note-topline"><span className={`note-kind ${note.kind.includes('Gemini')?'violet':note.kind.includes('iCloud')?'orange':''}`}>{note.kind}</span><small>{timeAgo(note.created)}</small></div><h3>{note.title}</h3><p>{note.body}</p><div className="note-bottom"><span><Link2 size={12}/> Personal memory</span><button onClick={()=>setToast(`“${note.title}” is already saved in your local archive.`)}>Open note <ArrowUpRight size={12}/></button></div></article>)}{visibleNotes.length===0&&<div className="empty-state"><BookOpen size={24}/><b>No notes match</b><span>Add your first note or import an export.</span></div>}</div></div><aside className="panel import-guide"><div className="section-title"><Zap size={14}/> IMPORT GUIDE</div><h3>Bring your whole thought-world.</h3><p>Deep folders can be selected in one pass. Their folder paths are preserved as each file is indexed in this workspace.</p><div className="guide-step"><b>01</b><span><strong>Gemini notebooks</strong><small>Use Gemini’s export/share flow, then select exported text files here. Direct Gemini API sync can be added with your own key.</small></span></div><div className="guide-step"><b>02</b><span><strong>iCloud Notes</strong><small>Export or share Notes to Files, then import the exported .txt, .html, .md, or .json files.</small></span></div><div className="guide-step"><b>03</b><span><strong>Cloud folders</strong><small>Pick a synced iCloud, OneDrive, or Drive folder from your Mac. For live sync, set up provider OAuth.</small></span></div><button className="outline-button wide" onClick={()=>folderRef.current?.click()}><FolderOpen size={14}/> Select a folder</button></aside></section> : activeNav === 'projects' ? <section className="projects-view">
        {selectedProject ? <div className="panel project-detail"><div className="project-detail-top"><button className="back-link" onClick={() => setSelectedProjectId(null)}>← All projects</button><button className="outline-button danger-button" onClick={() => deleteProject(selectedProject)}><Trash2 size={13}/> Delete project</button></div><div className="project-detail-title"><span className={`project-mark ${selectedProject.color}`}><BriefcaseBusiness size={20}/></span><div><h2>{selectedProject.name}</h2><p>{selectedProject.description || 'A focused space for your ideas and materials.'}</p></div></div><div className="project-detail-meta"><span>Created {new Date(selectedProject.created).toLocaleDateString()}</span><span>·</span><span>{selectedProject.fileIds.length} linked files</span></div><div className="project-files-heading"><div><b>Project files</b><small>Only files linked to this project appear here.</small></div><button className="primary-button" onClick={() => { setProjectFileSelection(selectedProject.fileIds); setDialog('projectFiles'); }}><Plus size={14}/> Link files</button></div><div className="project-linked-files">{files.filter(file => selectedProject.fileIds.includes(file.id)).map(file => <div className="project-linked-row" key={file.id}><FileText size={15}/><span><b>{file.name}</b><small>{file.folder || file.source}</small></span><span>{file.kind}</span></div>)}{!selectedProject.fileIds.length && <div className="empty-state"><FolderOpen size={24}/><b>No files linked yet</b><span>Link files from your library to keep project materials together.</span><button className="outline-button" onClick={() => { setProjectFileSelection([]); setDialog('projectFiles'); }}>Choose files</button></div>}</div></div> : <><div className="projects-toolbar"><div><div className="section-title"><BriefcaseBusiness size={14}/> YOUR PROJECT SPACES</div><p>Organize sources and ideas around the work that matters to you.</p></div><button className="primary-button" onClick={() => { setProjectName(''); setProjectDescription(''); setDialog('project'); }}><Plus size={14}/> Create project</button></div>{projects.length ? <div className="project-grid">{projects.map(project => <article className="project-card" key={project.id} onClick={() => setSelectedProjectId(project.id)}><div className="project-card-top"><span className={`project-mark ${project.color}`}><BriefcaseBusiness size={17}/></span><button className="project-delete" title={`Delete ${project.name}`} onClick={event => { event.stopPropagation(); deleteProject(project); }}><Trash2 size={14}/></button></div><h3>{project.name}</h3><p>{project.description || 'A focused space for your ideas and materials.'}</p><div className="project-card-bottom"><span><FileText size={12}/> {project.fileIds.length} linked files</span><span>Updated {timeAgo(project.updated)}</span></div><button className="project-open">Open project <ArrowUpRight size={13}/></button></article>)}</div> : <div className="panel projects-empty"><div className="empty-project-icon"><BriefcaseBusiness size={22}/></div><h2>Start with a project</h2><p>Create a dedicated space for a goal, research topic, or body of work. Then link relevant files from your library.</p><button className="primary-button" onClick={() => setDialog('project')}><Plus size={14}/> Create your first project</button></div>}</>}
      </section> : activeNav === 'settings' ? <section className="settings-layout"><div className="panel settings-card"><div className="section-title"><UserRound size={14}/> PROFILE</div><p className="settings-copy">Personalize how DAVIDIAN CORTEX greets you.</p><label className="field-label">DISPLAY NAME<input value={nameDraft} onChange={event => setNameDraft(event.target.value)} placeholder="Your name"/></label><div className="settings-actions"><span className="settings-hint">Saved only in this browser.</span><button className="primary-button" disabled={!nameDraft.trim()} onClick={() => { setProfileName(nameDraft.trim()); setToast('Profile settings saved'); }}><Check size={13}/> Save profile</button></div></div><div className="panel settings-card"><div className="section-title"><Settings2 size={14}/> PREFERENCES</div><p className="settings-copy">Adjust the workspace display.</p><div className="setting-row"><span><b>Compact library rows</b><small>Fit more items into your file and project lists.</small></span><button className={`switch ${compactMode ? 'on' : ''}`} role="switch" aria-checked={compactMode} aria-label="Compact library rows" onClick={() => setCompactMode(value => !value)}><i/></button></div><div className="setting-row"><span><b>Accent palette</b><small>Magenta, blue, and orange are part of your workspace theme.</small></span><span className="palette-dots"><i/><i/><i/></span></div></div><div className="panel settings-card"><div className="section-title"><ShieldCheck size={14}/> PRIVACY & LOCAL DATA</div><p className="settings-copy">Your current workspace is stored in this browser on this device.</p><div className="settings-stats"><span><b>{files.length + notes.length + projects.length}</b><small>items & projects</small></span><span><b>{bytes(totalBytes)}</b><small>indexed files</small></span><span><b>LOCAL</b><small>storage location</small></span></div><div className="settings-actions"><button className="outline-button" onClick={downloadArchive}><ArrowDownToLine size={13}/> Export workspace</button><button className="outline-button danger-button" onClick={clearLocalWorkspace}><Trash2 size={13}/> Clear local data</button></div><div className="settings-hint privacy-hint"><LockKeyhole size={12}/> Cloud account sync is not enabled until you configure provider OAuth.</div></div></section> : <section className="panel activity-panel"><div className="panel-heading"><div><div className="section-title"><Activity size={14}/> WORKSPACE STREAM</div><div className="section-caption">A chronological trace of the things you have brought into your mind.</div></div></div><div className="activity-timeline">{[...files.map(f=>({id:f.id,title:f.name,desc:`Added from ${f.source}${f.folder?` · ${f.folder}`:''}`,time:f.added,kind:f.kind})),...notes.map(n=>({id:n.id,title:n.title,desc:`Saved ${n.kind.toLowerCase()}`,time:n.created,kind:n.kind}))].sort((a,b)=>b.time-a.time).map(item=><div className="timeline-row" key={item.id}><span className="timeline-node"><Sparkles size={12}/></span><div><b>{item.title}</b><small>{item.desc}</small></div><time>{timeAgo(item.time)}</time></div>)}</div></section>}

      <div className="composer"><div className="composer-label"><span className="composer-spark"><Sparkles size={12}/></span> ASK YOUR CORTEX <span>Grounded in your personal archive</span></div><div className="composer-box"><input ref={promptRef} value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();askCortex();}}} placeholder="Ask a question, connect an idea, or capture a thought…"/><button className="composer-attach" onClick={()=>setDialog('sources')} title="Add a source"><Plus size={16}/></button><button className="send-button" onClick={askCortex} aria-label="Send prompt"><Send size={15}/><span>Ask</span></button></div><div className="composer-foot"><span><LockKeyhole size={11}/> Your archive stays yours</span><span>ENTER <kbd>↵</kbd> TO ASK</span></div></div>
    </main>

    <aside className="right-panel"><div className="right-tabs">{(['Council','Memory','Tools'] as const).map(tab=><button key={tab} className={activeTab===tab?'active':''} onClick={()=>setActiveTab(tab)}>{tab}<small>{tab==='Council'?'01':tab==='Memory'?files.length+notes.length:'06'}</small></button>)}</div>
      {activeTab==='Council'&&<div className="right-scroll"><div className="council-heading"><div className="council-avatar"><BrainCircuit size={16}/></div><span><b>Cortex council</b><small><i/> READY TO REASON</small></span><MoreHorizontal size={15}/></div><article className="council-card"><div className="card-title"><Sparkles size={12}/> LOCAL ARCHIVE MATCHER <span>READY</span></div><p>Questions are matched against text you imported on this device. Add more sources to give your answers richer personal context.</p><div className="card-tag">✦ ON-DEVICE · NO MODEL CONNECTED</div></article><article className="council-card magenta-card"><div className="card-title"><Network size={12}/> GRAPH OBSERVER <span>ACTIVE</span></div><p>Every imported note and file can become a bridge between the things you already know. The graph visual is a navigable overview, ready to grow with your archive.</p><div className="card-tag">✦ {graphEdges.length} VISIBLE CONNECTIONS</div></article><div className="conversation-label"><span>RECENT THREAD</span><button onClick={()=>setMessages(seedMessages)} title="Clear conversation"><X size={12}/></button></div><div className="thread-messages">{messages.slice(-6).map(message=><div className={`thread-message ${message.role}`} key={message.id}><div className="message-role">{message.role==='user'?'ISRAEL DAVID':'CORTEX'} <span>{message.time}</span></div><p>{message.text}</p></div>)}<div id="message-end"/></div><button className="reflect-button" onClick={()=>{setPrompt('What themes are emerging across my notes?');promptRef.current?.focus();}}><Sparkles size={13}/> Start a reflection</button></div>}
      {activeTab==='Memory'&&<div className="right-scroll memory-scroll"><div className="memory-header"><div className="section-title"><Layers3 size={13}/> PERSONAL MEMORY</div><p>Everything in the archive, in one place.</p></div><div className="memory-summary"><b>{files.length + notes.length}</b><span>indexed items</span><small>{bytes(totalBytes)} · this browser</small></div>{files.slice(0,8).map(file=><button className="memory-row" key={file.id} onClick={()=>{setActiveNav('library');setQuery(file.name);}}><FileText size={14}/><span><b>{file.name}</b><small>{file.source}</small></span><ArrowUpRight size={12}/></button>)}{notes.slice(0,4).map(note=><button className="memory-row" key={note.id} onClick={()=>setActiveNav('notebooks')}><MessageSquareText size={14}/><span><b>{note.title}</b><small>{note.kind}</small></span><ArrowUpRight size={12}/></button>)}<button className="outline-button wide" onClick={()=>setActiveNav('library')}>Browse all memory <ArrowUpRight size={13}/></button></div>}
      {activeTab==='Tools'&&<div className="right-scroll tools-scroll"><div className="section-title"><Settings2 size={13}/> PERSONAL TOOLKIT</div><p className="tools-intro">Shortcuts to grow and preserve your personal knowledge space.</p><button className="tool-action" onClick={()=>uploadRef.current?.click()}><span className="tool-icon blue"><Upload size={15}/></span><span><b>Upload files</b><small>Choose one or many</small></span><ArrowUpRight size={13}/></button><button className="tool-action" onClick={()=>folderRef.current?.click()}><span className="tool-icon orange"><FolderOpen size={15}/></span><span><b>Import a folder</b><small>Keep nested paths</small></span><ArrowUpRight size={13}/></button><button className="tool-action" onClick={()=>setDialog('notes')}><span className="tool-icon magenta"><Plus size={15}/></span><span><b>Capture a thought</b><small>Create a personal note</small></span><ArrowUpRight size={13}/></button><button className="tool-action" onClick={downloadArchive}><span className="tool-icon green"><ArrowDownToLine size={15}/></span><span><b>Export archive</b><small>Download your data</small></span><ArrowUpRight size={13}/></button><button className="tool-action" onClick={()=>setDialog('sources')}><span className="tool-icon violet"><Cloud size={15}/></span><span><b>Connect a source</b><small>Cloud & note providers</small></span><ArrowUpRight size={13}/></button><div className="integrity-box"><ShieldCheck size={15}/><span><b>Privacy by default</b><small>Cloud linking needs your consent and OAuth setup.</small></span></div></div>}
      <div className="right-footer"><span><span className="status-pulse"/> ALL SYSTEMS READY</span><button onClick={()=>setToast('DAVIDIAN CORTEX · Personal knowledge system for Israel David.')}>ABOUT</button></div>
    </aside>

    {dragging&&<div className="drop-overlay"><div><Upload size={30}/><b>Drop into your brain</b><span>Files and folders are welcome here</span></div></div>}
    {toast&&<div className="toast"><Check size={14}/>{toast}<button onClick={()=>setToast('')}><X size={13}/></button></div>}
    {dialog&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(null);}}><div className="modal-card">{dialog==='sources'&&<><div className="modal-heading"><span className="modal-icon"><Cloud size={17}/></span><div><h2>Add to your brain</h2><p>Bring files, folders, notes, or cloud libraries into one workspace.</p></div><button className="icon-button" onClick={()=>setDialog(null)}><X size={17}/></button></div><div className="modal-options"><button className="modal-option" onClick={()=>{setDialog(null);uploadRef.current?.click();}}><span className="option-icon blue"><Upload size={17}/></span><span><b>Upload files</b><small>Choose files from your Mac. Multi-select supported.</small></span><ArrowUpRight size={14}/></button><button className="modal-option" onClick={()=>{setDialog(null);folderRef.current?.click();}}><span className="option-icon orange"><FolderOpen size={17}/></span><span><b>Import an entire folder</b><small>Deep folders in one pass; file paths are preserved.</small></span><ArrowUpRight size={14}/></button><div className="modal-divider"><span>OR CHOOSE A SOURCE</span></div>{(['iCloud Drive','OneDrive','Google Drive'] as CloudService[]).map(service=><button className="modal-option compact" key={service} onClick={()=>{setConnectService(service);setDialog('connect');}}><span className={`provider-dot ${service.toLowerCase().replaceAll(' ','-')}`}>{providerMeta[service].glyph}</span><span><b>{service}</b><small>{providers[service]?'Connected':'Folder import available · OAuth setup for live sync'}</small></span>{providers[service]?<Check size={15}/>:<ArrowUpRight size={14}/>}</button>)}<button className="modal-option compact" onClick={()=>{setDialog(null);notebookRef.current?.click();}}><span className="option-icon violet"><BookOpen size={16}/></span><span><b>Gemini notebooks</b><small>Import an exported notebook file</small></span><ArrowUpRight size={14}/></button><button className="modal-option compact" onClick={()=>{setDialog(null);noteImportRef.current?.click();}}><span className="option-icon orange"><FileText size={16}/></span><span><b>iCloud Notes</b><small>Import notes exported from Apple Notes</small></span><ArrowUpRight size={14}/></button></div><div className="modal-privacy"><LockKeyhole size={12}/> Provider logins are never requested in this prototype. Your imported data remains in this browser.</div></>}
      {dialog==='connect'&&<><div className="modal-heading"><span className="modal-icon"><Cloud size={17}/></span><div><h2>{providers[connectService]?'Manage':'Connect'} {connectService}</h2><p>{providerMeta[connectService].description}</p></div><button className="icon-button" onClick={()=>setDialog(null)}><X size={17}/></button></div><div className="connect-notice"><ShieldCheck size={17}/><div><b>Secure account linking requires provider OAuth</b><p>To enable live sync, configure your own provider OAuth app and secure backend. Until then, choose a locally synced folder from your Mac to import its contents in one pass.</p></div></div><div className="connect-actions"><button className="outline-button" onClick={()=>setDialog('sources')}>Back</button><button className="primary-button" onClick={()=>{setDialog(null);folderRef.current?.click();}}><FolderOpen size={14}/> Import synced folder</button></div>{providers[connectService]&&<button className="disconnect-link" onClick={connect}>Disconnect this source</button>}</>}
      {dialog==='notes'&&<><div className="modal-heading"><span className="modal-icon"><MessageSquareText size={17}/></span><div><h2>Capture a thought</h2><p>A small note can become a useful connection later.</p></div><button className="icon-button" onClick={()=>setDialog(null)}><X size={17}/></button></div><label className="field-label">TITLE<input autoFocus value={noteTitle} onChange={e=>setNoteTitle(e.target.value)} placeholder="What’s on your mind?"/></label><label className="field-label">NOTE<textarea value={noteBody} onChange={e=>setNoteBody(e.target.value)} placeholder="Write a thought, insight, question, or connection…" rows={5}/></label><div className="connect-actions"><button className="outline-button" onClick={()=>setDialog(null)}>Cancel</button><button className="primary-button" disabled={!noteTitle.trim()||!noteBody.trim()} onClick={addNote}><Check size={14}/> Save to memory</button></div></>}
    {dialog==='project'&&<><div className="modal-heading"><span className="modal-icon"><BriefcaseBusiness size={17}/></span><div><h2>Create a project</h2><p>Start a dedicated space for a goal, topic, or body of work.</p></div><button className="icon-button" onClick={()=>setDialog(null)}><X size={17}/></button></div><label className="field-label">PROJECT NAME<input autoFocus value={projectName} onChange={event=>setProjectName(event.target.value)} placeholder="e.g. Studio launch, family archive, learning plan" maxLength={80}/></label><label className="field-label">DESCRIPTION <span className="optional-label">OPTIONAL</span><textarea value={projectDescription} onChange={event=>setProjectDescription(event.target.value)} placeholder="What is this project about?" rows={3} maxLength={240}/></label><div className="project-color-note"><span className="project-color-dot magenta"/><span className="project-color-dot blue"/><span className="project-color-dot orange"/><small>One of your accent colors will mark this project.</small></div><div className="connect-actions"><button className="outline-button" onClick={()=>setDialog(null)}>Cancel</button><button className="primary-button" disabled={!projectName.trim()} onClick={createProject}><Plus size={14}/> Create project</button></div></>}{dialog==='projectFiles'&&selectedProject&&<><div className="modal-heading"><span className="modal-icon"><FolderOpen size={17}/></span><div><h2>Link library files</h2><p>Choose materials to group under {selectedProject.name}.</p></div><button className="icon-button" onClick={()=>setDialog(null)}><X size={17}/></button></div><div className="project-file-picker">{files.map(file=><label className="project-file-option" key={file.id}><input type="checkbox" checked={projectFileSelection.includes(file.id)} onChange={event=>setProjectFileSelection(old=>event.target.checked?[...old,file.id]:old.filter(id=>id!==file.id))}/><FileText size={14}/><span><b>{file.name}</b><small>{file.folder||file.source}</small></span></label>)}{!files.length&&<div className="empty-state"><FolderOpen size={22}/><b>Your library is empty</b><span>Add files first, then link them to this project.</span></div>}</div><div className="connect-actions"><button className="outline-button" onClick={()=>setDialog(null)}>Cancel</button><button className="primary-button" onClick={saveProjectFiles}><Check size={14}/> Save {projectFileSelection.length} file{projectFileSelection.length===1?'':'s'}</button></div></>}
    </div></div>}
  </div>;
}
