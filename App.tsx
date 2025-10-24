import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Flashcard, FileData, FlashcardSet, User, AppState, View, AuthMode, StudyMode } from './types';
import { generateFlashcards } from './services/geminiService';
import Loader from './components/Loader';
import FlashcardComponent from './components/Flashcard';
import TestMode from './components/TestMode';
import MatchMode from './components/MatchMode';
import { 
  ArrowLeftIcon, ArrowRightIcon, UploadIcon, StudyIcon, TestIcon, MatchIcon, 
  PlusIcon, SunIcon, MoonIcon, GoogleIcon, LogoutIcon, SaveIcon, EditIcon, 
  ShareIcon, ImportIcon, EyeIcon, EyeOffIcon, CloseIcon
} from './components/IconComponents';

// For using pdf.js and xlsx from CDN
declare const pdfjsLib: any;
declare const XLSX: any;


// --- Main App Component ---
const App: React.FC = () => {
    // --- State Management ---
    const [state, setState] = useState<AppState>({
        view: 'auth',
        theme: 'dark',
        users: [],
        currentUser: null,
        activeFlashcards: [],
        editingSet: null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Effects ---
    // Load state from localStorage on initial render
    useEffect(() => {
        try {
            const savedState = localStorage.getItem('aiFlashcardApp');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                setState(parsedState);
                // Apply theme
                document.documentElement.className = parsedState.theme;
            } else {
                 document.documentElement.className = 'dark';
            }
        } catch (e) {
            console.error("Failed to load state from localStorage", e);
        }
    }, []);

    // Save state to localStorage whenever it changes
    const saveData = useCallback((newState: AppState) => {
        try {
            localStorage.setItem('aiFlashcardApp', JSON.stringify(newState));
            setState(newState);
        } catch (e) {
            console.error("Failed to save state to localStorage", e);
        }
    }, []);

    // --- Utility Functions ---
    const updateState = (updates: Partial<AppState>) => {
        saveData({ ...state, ...updates });
    };

    const extractTextFromFile = async (file: File): Promise<FileData> => {
        const fileType = file.type;
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (fileType.startsWith('image/')) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({ content: (reader.result as string).split(',')[1], mimeType: fileType });
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
        
        if (extension === 'pdf') {
             return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const pdf = await pdfjsLib.getDocument(event.target.result).promise;
                        let textContent = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const text = await page.getTextContent();
                            textContent += text.items.map((s: any) => s.str).join(' ');
                        }
                        resolve({ content: textContent, mimeType: 'text/plain' });
                    } catch (e) { reject(e); }
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
             });
        }
        
        if (extension === 'xlsx' || extension === 'xls') {
             return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const workbook = XLSX.read(event.target.result, { type: 'binary' });
                        let textContent = '';
                        workbook.SheetNames.forEach((sheetName: string) => {
                            const worksheet = workbook.Sheets[sheetName];
                            textContent += XLSX.utils.sheet_to_txt(worksheet);
                        });
                        resolve({ content: textContent, mimeType: 'text/plain' });
                    } catch (e) { reject(e); }
                };
                reader.onerror = reject;
                reader.readAsBinaryString(file);
             });
        }

        // Default to plain text
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ content: reader.result as string, mimeType: 'text/plain' });
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    // --- Event Handlers ---
    const handleLogout = () => {
        updateState({ currentUser: null, view: 'auth' });
    };

    const toggleTheme = () => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.className = newTheme;
        updateState({ theme: newTheme });
    };

    const createNewSet = () => {
        updateState({ activeFlashcards: [], editingSet: null, view: 'upload' });
    };
    
    const handleFileProcess = async (file: File | null) => {
        if (!file) return;

        setIsLoading(true);
        setError(null);
        updateState({ activeFlashcards: [] });

        try {
            const fileData = await extractTextFromFile(file);
            const maxCards = parseInt((document.getElementById('maxCards') as HTMLInputElement)?.value || '10', 10);
            const generatedCards = await generateFlashcards(fileData, maxCards);
            
            if (generatedCards.length === 0) {
                setError("The AI couldn't generate any flashcards from the provided content. Please try different content or a different file.");
            } else {
                updateState({ activeFlashcards: generatedCards, view: 'flashcards' });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during file processing.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveSet = (setName: string) => {
        if (!state.currentUser || state.activeFlashcards.length === 0) return;

        const updatedUsers = state.users.map(user => {
            if (user.email === state.currentUser!.email) {
                const newSet: FlashcardSet = {
                    id: Date.now().toString(),
                    name: setName,
                    flashcards: state.activeFlashcards,
                    createdAt: new Date().toISOString()
                };
                return { ...user, sets: [...user.sets, newSet] };
            }
            return user;
        });

        const updatedCurrentUser = updatedUsers.find(u => u.email === state.currentUser!.email);
        updateState({ users: updatedUsers, currentUser: updatedCurrentUser || null, view: 'mySets' });
    };

    // --- Render Methods ---
    const renderApp = () => {
        if (!state.currentUser || state.view === 'auth') {
            return <AuthView users={state.users} onAuthSuccess={(user) => updateState({ currentUser: user, view: 'upload' })} onUsersUpdate={(users) => updateState({ users })} />;
        }

        return (
            <div className="w-full h-full flex flex-col">
                <Header user={state.currentUser} onLogout={handleLogout} onToggleTheme={toggleTheme} theme={state.theme} onShowMySets={() => updateState({ view: 'mySets' })} />
                <main className="flex-grow p-4 sm:p-8 flex flex-col items-center justify-center">
                    {
                        {
                            'upload': <UploadView onFileProcess={handleFileProcess} error={error} isLoading={isLoading} />,
                            'flashcards': <FlashcardsView flashcards={state.activeFlashcards} onSaveSet={handleSaveSet} onUpdateCards={(cards) => updateState({activeFlashcards: cards})} onCreateNew={createNewSet}/>,
                            'mySets': <MySetsView 
                                user={state.currentUser} 
                                onStudySet={(set) => updateState({ activeFlashcards: set.flashcards, editingSet: set, view: 'flashcards' })}
                                onCreateNew={createNewSet}
                                onUsersUpdate={(users) => {
                                    const updatedCurrentUser = users.find(u => u.email === state.currentUser!.email);
                                    updateState({ users, currentUser: updatedCurrentUser || null });
                                }}
                                users={state.users}
                             />,
                        }[state.view]
                    }
                </main>
            </div>
        );
    };

    return (
        <div className={`min-h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300`}>
            {isLoading ? <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"><Loader /></div> : renderApp()}
        </div>
    );
};


// --- Sub-Components for Views ---

// ... (AuthView, Header, UploadView, FlashcardsView, MySetsView will be defined here)
// For brevity and focus, I will create them as functional components inside App.tsx scope

// --- AUTH VIEW ---
const AuthView: React.FC<{ users: User[], onAuthSuccess: (user: User) => void, onUsersUpdate: (users: User[]) => void }> = ({ users, onAuthSuccess, onUsersUpdate }) => {
  // ... full auth component logic ...
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthAction = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'signup') {
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (users.find(u => u.email === email)) {
            setError("An account with this email already exists.");
            return;
        }
        // Simple "hash" for demo purposes
        const newUser: User = { email, passwordHash: `hashed_${password}`, sets: [] };
        const newUsers = [...users, newUser];
        onUsersUpdate(newUsers);
        onAuthSuccess(newUser);
    } else if (mode === 'signin') {
        const user = users.find(u => u.email === email);
        if (user && user.passwordHash === `hashed_${password}`) {
            onAuthSuccess(user);
        } else {
            setError("Invalid email or password.");
        }
    } else if (mode === 'forgot') {
        const user = users.find(u => u.email === email);
        if(user) {
            setMessage(`Password reset instructions sent to ${email}. (This is a simulation).`);
        } else {
            setError("No account found with that email address.");
        }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-purple-900/50 p-4">
       <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-black/20 p-8 rounded-2xl backdrop-blur-lg border border-gray-300 dark:border-white/20 shadow-2xl">
            <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">
                {mode === 'signin' && 'Welcome Back'}
                {mode === 'signup' && 'Create an Account'}
                {mode ==='forgot' && 'Reset Password'}
            </h1>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
              {mode === 'signin' && 'Sign in to access your flashcard sets.'}
              {mode === 'signup' && 'Let\'s get you started!'}
              {mode ==='forgot' && 'We\'ll help you get back into your account.'}
            </p>

            {error && <p className="bg-red-500/20 text-red-500 dark:text-red-400 p-3 rounded-md mb-4 text-center">{error}</p>}
            {message && <p className="bg-green-500/20 text-green-600 dark:text-green-400 p-3 rounded-md mb-4 text-center">{message}</p>}

            <form onSubmit={handleAuthAction} className="space-y-6">
                <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                {mode !== 'forgot' && (
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-4 text-gray-500 dark:text-gray-400">
                        {showPassword ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                    </button>
                  </div>
                )}
                {mode === 'signup' && <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />}
                <button type="submit" className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors">
                    {mode === 'signin' && 'Sign In'}
                    {mode === 'signup' && 'Sign Up'}
                    {mode ==='forgot' && 'Send Reset Link'}
                </button>
            </form>
            <div className="text-center mt-6">
                 <button onClick={() => setMode(mode === 'signin' ? 'forgot' : 'signin')} className="text-sm text-cyan-500 hover:underline">
                    {mode === 'signin' ? 'Forgot Password?' : 'Back to Sign In'}
                </button>
            </div>
             <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">OR</span>
              </div>
            </div>
            <button className="w-full py-3 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => alert('Google Sign-In is a demo feature. Please use the email/password sign up.')}>
                <GoogleIcon />
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {mode === 'signin' ? 'Sign In with Google' : 'Sign Up with Google'}
                </span>
            </button>
             <div className="text-center mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="font-semibold text-cyan-500 hover:underline ml-1">
                        {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
       </div>
    </div>
  );
};

// --- HEADER ---
const Header: React.FC<{ user: User, onLogout: () => void, onToggleTheme: () => void, theme: 'light' | 'dark', onShowMySets: () => void }> = ({ user, onLogout, onToggleTheme, theme, onShowMySets }) => (
    <header className="w-full p-4 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-lg border-b border-gray-300 dark:border-white/10">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">AI Flashcards</h1>
        <div className="flex items-center gap-4">
             <button onClick={onShowMySets} className="font-semibold text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400">My Sets</button>
            <span className="text-gray-600 dark:text-gray-400 hidden sm:inline">Welcome, {user.email}!</span>
            <button onClick={onToggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/20">
                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
            <button onClick={onLogout} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/20">
                <LogoutIcon className="w-5 h-5 text-red-500"/>
            </button>
        </div>
    </header>
);

// --- UPLOAD VIEW ---
const UploadView: React.FC<{ onFileProcess: (file: File) => void, error: string | null, isLoading: boolean }> = ({ onFileProcess, error, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileProcess(file);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto text-center" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Create Flashcards with AI</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Upload a document or image to get started.</p>
      <div className={`bg-white dark:bg-black/20 p-8 rounded-2xl backdrop-blur-lg border border-gray-300 dark:border-white/20 shadow-lg ${isDragging ? 'ring-2 ring-cyan-400' : ''}`}>
        <div className="mb-6">
          <label htmlFor="maxCards" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Maximum number of flashcards:</label>
          <input type="number" id="maxCards" defaultValue={10} min="1" max="100" className="w-full p-2 bg-gray-200 dark:bg-gray-800 rounded-md text-center focus:ring-2 focus:ring-cyan-400 outline-none" />
        </div>
        <label htmlFor="file-upload" className="w-full flex flex-col items-center justify-center px-6 py-10 border-2 border-dashed border-gray-400 dark:border-gray-500 rounded-lg cursor-pointer hover:border-cyan-400 hover:bg-gray-200/50 dark:hover:bg-black/10 transition-colors">
          <UploadIcon className="w-10 h-10 text-gray-500 dark:text-gray-400 mb-3" />
          <span className="font-semibold">Click or drag file to upload</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">PDF, TXT, XLSX, PNG, JPG...</span>
          <input id="file-upload" type="file" className="hidden" onChange={(e) => onFileProcess(e.target.files?.[0])} />
        </label>
        {error && <p className="text-red-500 dark:text-red-400 mt-4">{error}</p>}
      </div>
    </div>
  );
};


// --- FLASHCARDS VIEW ---
const FlashcardsView: React.FC<{ flashcards: Flashcard[], onSaveSet: (name: string) => void, onUpdateCards: (cards: Flashcard[]) => void, onCreateNew: () => void }> = ({ flashcards, onSaveSet, onUpdateCards, onCreateNew }) => {
    // ... flashcard view logic ...
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [studyMode, setStudyMode] = useState<StudyMode>('study');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [setName, setSetName] = useState('');

  const currentCard = useMemo(() => flashcards[currentCardIndex], [flashcards, currentCardIndex]);

  const handleUpdateCard = (updatedCard: Flashcard) => {
    onUpdateCards(flashcards.map((card, index) => (index === currentCardIndex ? updatedCard : card)));
  };

  const goToNextCard = () => setCurrentCardIndex(prev => Math.min(prev + 1, flashcards.length - 1));
  const goToPrevCard = () => setCurrentCardIndex(prev => Math.max(prev - 1, 0));
  
  const handleSaveClick = () => {
    onSaveSet(setName);
    setShowSaveModal(false);
    setSetName('');
  }

  if (flashcards.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center h-full">
        {/* Header */}
        <div className="w-full max-w-4xl flex justify-between items-center mb-4 px-4">
             <button onClick={onCreateNew} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 font-semibold rounded-lg transition-colors">
                <PlusIcon className="w-5 h-5" />
                New Set
            </button>
            <div className="flex gap-2 p-1 bg-gray-200 dark:bg-black/20 rounded-lg">
                <button onClick={() => setStudyMode('study')} className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 ${studyMode === 'study' ? 'bg-purple-600 text-white' : 'hover:bg-gray-300 dark:hover:bg-white/10'}`}><StudyIcon className="w-4 h-4" /> Study</button>
                <button onClick={() => setStudyMode('test')} className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 ${studyMode === 'test' ? 'bg-purple-600 text-white' : 'hover:bg-gray-300 dark:hover:bg-white/10'}`}><TestIcon className="w-4 h-4" /> Test</button>
                <button onClick={() => setStudyMode('match')} className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 ${studyMode === 'match' ? 'bg-purple-600 text-white' : 'hover:bg-gray-300 dark:hover:bg-white/10'}`}><MatchIcon className="w-4 h-4" /> Match</button>
            </div>
            <button onClick={() => setShowSaveModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors">
                <SaveIcon className="w-5 h-5" />
                Save Set
            </button>
        </div>

        {/* Study Mode Content */}
        {studyMode === 'study' && currentCard && (
         <div className="w-full max-w-2xl h-[400px] flex-grow flex flex-col items-center justify-center">
             <div className="w-full h-full mb-4">
                <FlashcardComponent card={currentCard} onUpdate={handleUpdateCard} />
             </div>
             <div className="flex items-center justify-between w-full max-w-sm">
                <button onClick={goToPrevCard} disabled={currentCardIndex === 0} className="p-3 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ArrowLeftIcon />
                </button>
                <span className="font-semibold">{currentCardIndex + 1} / {flashcards.length}</span>
                <button onClick={goToNextCard} disabled={currentCardIndex === flashcards.length - 1} className="p-3 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ArrowRightIcon />
                </button>
             </div>
         </div>
        )}
        {studyMode === 'test' && <TestMode cards={flashcards} />}
        {studyMode === 'match' && <MatchMode cards={flashcards} />}

        {/* Save Set Modal */}
        {showSaveModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
                    <h2 className="text-xl font-bold mb-4">Save Flashcard Set</h2>
                    <input type="text" value={setName} onChange={e => setSetName(e.target.value)} placeholder="Enter set name..." className="w-full p-2 bg-gray-200 dark:bg-gray-700 rounded-md mb-4 focus:ring-2 focus:ring-cyan-400 outline-none" />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500">Cancel</button>
                        <button onClick={handleSaveClick} disabled={!setName.trim()} className="px-4 py-2 rounded-md bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50">Save</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};


// --- MY SETS VIEW ---
const MySetsView: React.FC<{ user: User, users: User[], onStudySet: (set: FlashcardSet) => void, onCreateNew: () => void, onUsersUpdate: (users: User[]) => void }> = ({ user, users, onStudySet, onCreateNew, onUsersUpdate }) => {
    // ... my sets logic ...
    const [modal, setModal] = useState<'share' | 'import' | null>(null);
    const [shareContent, setShareContent] = useState('');
    const [importContent, setImportContent] = useState('');
    const [importError, setImportError] = useState('');

    const handleDeleteSet = (setId: string) => {
        const updatedUsers = users.map(u => {
            if (u.email === user.email) {
                return { ...u, sets: u.sets.filter(s => s.id !== setId) };
            }
            return u;
        });
        onUsersUpdate(updatedUsers);
    };
    
    const handleShareSet = (set: FlashcardSet) => {
        setShareContent(JSON.stringify(set));
        setModal('share');
    };

    const handleImportSet = () => {
        setImportError('');
        try {
            const parsedSet: FlashcardSet = JSON.parse(importContent);
            // Basic validation
            if (!parsedSet.id || !parsedSet.name || !Array.isArray(parsedSet.flashcards)) {
                throw new Error("Invalid format.");
            }

            const updatedUsers = users.map(u => {
                if (u.email === user.email) {
                    // Avoid duplicate IDs
                    if (u.sets.some(s => s.id === parsedSet.id)) {
                        parsedSet.id = Date.now().toString();
                    }
                    return { ...u, sets: [...u.sets, parsedSet] };
                }
                return u;
            });
            onUsersUpdate(updatedUsers);
            setModal(null);
            setImportContent('');
        } catch (e) {
            setImportError("Invalid flashcard set data. Please check the format and try again.");
        }
    };
    

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Flashcard Sets</h1>
                <div className="flex gap-2">
                    <button onClick={() => setModal('import')} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 font-semibold rounded-lg transition-colors"><ImportIcon className="w-5 h-5" /> Import Set</button>
                    <button onClick={onCreateNew} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"><PlusIcon className="w-5 h-5" /> Create New Set</button>
                </div>
            </div>
            
            {user.sets.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-10">You haven't saved any sets yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.sets.map(set => (
                        <div key={set.id} className="bg-white dark:bg-black/20 p-4 rounded-lg shadow-md flex flex-col justify-between">
                            <div>
                                <h2 className="font-bold text-lg truncate">{set.name}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{set.flashcards.length} cards</p>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => onStudySet(set)} className="flex-1 px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700">Study</button>
                                <button onClick={() => handleShareSet(set)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-white/20"><ShareIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteSet(set.id)} className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500"><CloseIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Modals */}
             {(modal === 'share' || modal === 'import') && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">{modal === 'share' ? 'Share Set' : 'Import Set'}</h2>
                        <textarea 
                          readOnly={modal==='share'}
                          value={modal === 'share' ? shareContent : importContent}
                          onChange={(e) => modal==='import' && setImportContent(e.target.value)}
                          className="w-full h-40 p-2 bg-gray-200 dark:bg-gray-700 rounded-md mb-2 resize-none"
                          placeholder={modal === 'import' ? 'Paste flashcard set data here...' : ''}
                        />
                        {modal === 'share' && <button onClick={() => navigator.clipboard.writeText(shareContent)} className="w-full py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600">Copy to Clipboard</button>}
                        {modal === 'import' && (
                          <>
                            {importError && <p className="text-red-500 text-sm mb-2">{importError}</p>}
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setModal(null)} className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500">Cancel</button>
                                <button onClick={handleImportSet} className="px-4 py-2 rounded-md bg-cyan-500 text-white hover:bg-cyan-600">Import</button>
                            </div>
                          </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


export default App;