import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useBatches } from '../context/BatchContext';
import { MBBS_SUBJECTS, PLATFORMS } from '../data/constants';
import { Batch, ParsedMCQ, MCQ } from '../types';
import { ArrowLeft, LoaderCircle, CheckCircle, Wand, Edit, PlusCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { cn } from '../lib/utils';

const AddQuestions: React.FC = () => {
  const navigate = useNavigate();
  const { addBatch } = useBatches();

  const [addMode, setAddMode] = useState<'ai' | 'manual'>('ai');

  // AI Mode State
  const [rawText, setRawText] = useState('');

  // Manual Mode State
  const [manualMCQs, setManualMCQs] = useState<ParsedMCQ[]>([]);
  const [currentMCQ, setCurrentMCQ] = useState<ParsedMCQ>({ question: '', options: ['', '', '', ''], answer: '', explanation: '' });
  const [manualError, setManualError] = useState<string | null>(null);

  // Common State
  const [subject, setSubject] = useState(MBBS_SUBJECTS[0]);
  const [chapter, setChapter] = useState('');
  const [platform, setPlatform] = useState(PLATFORMS[0]);

  const [parsedMCQs, setParsedMCQs] = useState<ParsedMCQ[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!rawText.trim() || !chapter.trim()) {
      setError('Please fill in the text area and chapter name.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setParsedMCQs(null);
    try {
      const response = await fetch('/api/parse-mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ParsedMCQ[] = await response.json();
      setParsedMCQs(data);
    } catch (e: any) {
      let userMessage = 'An unexpected error occurred. Please check the format of your text and try again.';
      if (e instanceof Error) {
        if (e.message.toLowerCase().includes('json')) {
            userMessage = 'The AI returned an invalid format. This can happen with very complex or malformed input text. Please try simplifying the text.';
        } else if (e.message.toLowerCase().includes('api key')) {
            userMessage = 'There is an issue with the application configuration (API key). Please contact support.';
        } else if (e.message.includes('http')) {
            userMessage = 'A network error occurred. Please check your connection and try again.'
        }
      }
      setError(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBatch = () => {
    const questionsToSave = addMode === 'ai' ? parsedMCQs : manualMCQs;
    if (!questionsToSave || questionsToSave.length === 0) return;

    const batchData: Omit<Batch, 'id' | 'createdAt'> = {
      name: `${subject} - ${chapter}`,
      subject,
      chapter,
      platform,
      questions: questionsToSave.map((mcq): MCQ => ({
        id: uuidv4(),
        batchId: '', // This will be replaced by the actual batch id in the context
        ...mcq,
        difficulty: 'Medium',
        questionType: 'MCQ',
        tags: {
            bookmarked: false,
            hard: false,
            revise: false,
            mistaked: false,
            highYield: false,
            caseBased: false,
            pyq: false
        },
        lastAttemptCorrect: null,
        srsLevel: 0,
        nextReviewDate: new Date().toISOString(),
      })),
    };

    addBatch(batchData);
    navigate('/bank');
  };

  const handleAddManualMCQ = () => {
    setManualError(null);
    if (!currentMCQ.question.trim() || !currentMCQ.explanation.trim() || currentMCQ.options.some(o => !o.trim()) || !currentMCQ.answer.trim()) {
      setManualError('Please fill all fields for the question.');
      return;
    }
    setManualMCQs(prev => [...prev, currentMCQ]);
    setCurrentMCQ({ question: '', options: ['', '', '', ''], answer: '', explanation: '' });
  };

  const renderPreview = () => {
    const questionsToPreview = addMode === 'ai' ? parsedMCQs : manualMCQs;
    if (!questionsToPreview || questionsToPreview.length === 0) return null;

    return (
      <Card className="glass-card glow-border">
        <CardHeader>
          <CardTitle className="text-2xl">Import Preview ({questionsToPreview.length} questions)</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4 bg-black/20 rounded-lg border border-white/10">
                {questionsToPreview.map((mcq, index) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="font-semibold text-foreground">{index + 1}. {mcq.question}</p>
                      <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground">
                          {mcq.options.map((opt, i) => (
                          <li key={i} className={cn(opt === mcq.answer ? 'font-bold text-secondary' : '')}>{opt}</li>
                          ))}
                      </ul>
                      <p className="mt-3 text-sm text-foreground bg-black/20 p-3 rounded"><span className="font-semibold text-secondary">Explanation:</span> {mcq.explanation}</p>
                    </div>
                ))}
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
             <Button variant="outline" className="glass-card" onClick={() => addMode === 'ai' ? setParsedMCQs(null) : setManualMCQs([])}>
                <Edit size={16} className="mr-2"/>
                Back to Edit
             </Button>
            <Button onClick={handleSaveBatch} className="btn-gradient">
                <CheckCircle size={20} className="mr-2"/>
                Confirm and Save Batch
            </Button>
        </CardFooter>
      </Card>
    );
  };
  
  const renderAiForm = () => (
    <Card className="glass-card glow-border">
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
            <Label htmlFor="raw-text" className="text-lg">Paste MCQ Content</Label>
            <Textarea
              id="raw-text"
              rows={15}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Paste your block of questions, options, answers, and explanations here... The AI will do the rest."
              className="font-mono bg-black/20 border-white/10 focus:border-primary"
            />
        </div>

        {error && <p className="text-sm text-destructive bg-destructive/20 p-3 rounded-md">{error}</p>}
      </CardContent>
      <CardFooter className="flex justify-end">
         <Button
          onClick={handleProcess}
          disabled={isLoading}
          className="btn-gradient w-48"
        >
          {isLoading ? <LoaderCircle className="animate-spin" size={20} /> : <><Wand size={18} className="mr-2"/> Process with AI</>}
        </Button>
      </CardFooter>
    </Card>
  );

  const renderManualForm = () => (
    <Card className="glass-card glow-border">
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="question" className="text-lg">Question</Label>
          <Textarea id="question" value={currentMCQ.question} onChange={e => setCurrentMCQ(p => ({ ...p, question: e.target.value }))} className="bg-black/20 border-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div className="space-y-2" key={i}>
                  <Label>Option {String.fromCharCode(65 + i)}</Label>
                  <Input value={currentMCQ.options[i]} onChange={e => { const o = [...currentMCQ.options]; o[i] = e.target.value; setCurrentMCQ(p => ({...p, options: o})) }} className="bg-black/20 border-white/10" />
              </div>
            ))}
        </div>
        <div className="space-y-2">
            <Label>Correct Answer</Label>
            <Select value={currentMCQ.answer} onValueChange={value => setCurrentMCQ(p => ({...p, answer: value}))}>
                <SelectTrigger className="bg-black/20 border-white/10"><SelectValue placeholder="Select the correct answer" /></SelectTrigger>
                <SelectContent>
                    {currentMCQ.options.filter(o => o.trim() !== '').map((opt, i) => (
                        <SelectItem key={i} value={opt}>{opt}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="explanation" className="text-lg">Explanation</Label>
          <Textarea id="explanation" value={currentMCQ.explanation} onChange={e => setCurrentMCQ(p => ({ ...p, explanation: e.target.value }))} className="bg-black/20 border-white/10" />
        </div>
        {manualError && <p className="text-sm text-destructive bg-destructive/20 p-3 rounded-md">{manualError}</p>}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{manualMCQs.length} question(s) added to batch</div>
        <Button onClick={handleAddManualMCQ} variant="outline" className="glass-card">
          <PlusCircle size={16} className="mr-2" />
          Add Question to Batch
        </Button>
      </CardFooter>
    </Card>
  );

  const renderTopForm = () => (
    <Card className="glass-card glow-border">
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
             <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger id="subject" className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {MBBS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="chapter">Chapter Name</Label>
                <Input id="chapter" value={chapter} onChange={e => setChapter(e.target.value)} placeholder="e.g., Embryology" className="bg-black/20 border-white/10"/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                 <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger id="platform" className="bg-black/20 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
    </Card>
  )

  const showPreview = (addMode === 'ai' && parsedMCQs && parsedMCQs.length > 0) || (addMode === 'manual' && manualMCQs.length > 0);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8 pb-12">
        <div>
            <Button variant="ghost" onClick={() => navigate('/bank')} className="flex items-center gap-2 text-sm mb-4 hover:bg-white/10">
                <ArrowLeft size={16} />
                Back to Bank
            </Button>
            <h1 className="text-5xl font-bold gradient-text">Add New Questions</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Use the AI Paste for rapid import, or enter questions one-by-one with Manual Entry.
            </p>
        </div>

        <div className="flex gap-2 p-1 rounded-full bg-black/20 border border-white/10 w-full max-w-sm mx-auto">
            <Button 
              onClick={() => setAddMode('ai')} 
              className={cn(
                "w-full rounded-full transition-all duration-300",
                addMode === 'ai' ? 'btn-gradient' : 'bg-transparent text-muted-foreground hover:bg-white/10'
              )}
            >
                <Wand size={16} className="mr-2" />
                AI Paste
            </Button>
            <Button 
              onClick={() => setAddMode('manual')} 
              className={cn(
                "w-full rounded-full transition-all duration-300",
                addMode === 'manual' ? 'btn-gradient' : 'bg-transparent text-muted-foreground hover:bg-white/10'
              )}
            >
                <Edit size={16} className="mr-2" />
                Manual Entry
            </Button>
        </div>
      
        {showPreview ? renderPreview() : (
            <div className="space-y-6">
                {renderTopForm()}
                {addMode === 'ai' ? renderAiForm() : renderManualForm()}
            </div>
        )}
    </div>
  );
};

export default AddQuestions 