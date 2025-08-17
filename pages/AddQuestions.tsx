import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAnalytics } from '../context/AnalyticsContext';
import { MBBS_SUBJECTS, PLATFORMS } from '../data/constants';
import { Batch, ParsedMCQ, MCQ } from '../types';
import { ArrowLeft, LoaderCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';

const AddQuestions: React.FC = () => {
  const navigate = useNavigate();
  const { addBatch } = useAnalytics();

  const [rawText, setRawText] = useState('');
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
    if (!parsedMCQs) return;

    const newBatch: Batch = {
      id: uuidv4(),
      name: `${subject} - ${chapter}`,
      subject,
      chapter,
      platform,
      createdAt: new Date().toISOString(),
      questions: parsedMCQs.map((mcq): MCQ => ({
        id: uuidv4(),
        ...mcq,
        tags: { bookmarked: false, hard: false, revise: false },
        lastAttemptCorrect: null,
        srsLevel: 0,
        nextReviewDate: new Date().toISOString(),
      })),
    };

    addBatch(newBatch);
    navigate('/bank');
  };
  
  const renderPreview = () => {
    if (!parsedMCQs) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Preview ({parsedMCQs.length} questions)</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto p-4 bg-muted/50 rounded-lg border">
                {parsedMCQs.map((mcq, index) => (
                    <Card key={index} className="p-4 bg-background">
                    <p className="font-semibold text-foreground">{index + 1}. {mcq.question}</p>
                    <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground">
                        {mcq.options.map((opt, i) => (
                        <li key={i} className={opt === mcq.answer ? 'font-bold text-green-600 dark:text-green-400' : ''}>{opt}</li>
                        ))}
                    </ul>
                    <p className="mt-2 text-sm text-foreground bg-muted p-2 rounded"><span className="font-semibold">Explanation:</span> {mcq.explanation}</p>
                    </Card>
                ))}
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
             <Button variant="outline" onClick={() => setParsedMCQs(null)}>Back to Edit</Button>
            <Button onClick={handleSaveBatch} className="bg-green-600 hover:bg-green-700">
                <CheckCircle size={20} className="mr-2"/>
                Confirm and Save Batch
            </Button>
        </CardFooter>
      </Card>
    );
  };
  
  const renderForm = () => (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger id="subject"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {MBBS_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="chapter">Chapter Name</Label>
                <Input id="chapter" value={chapter} onChange={e => setChapter(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                 <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger id="platform"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="space-y-2">
            <Label htmlFor="raw-text">MCQ Content</Label>
            <Textarea
            id="raw-text"
            rows={15}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="Paste your block of questions, options, answers, and explanations here..."
            className="font-mono"
            />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
      <CardFooter className="flex justify-end">
         <Button
          onClick={handleProcess}
          disabled={isLoading}
          className="w-48"
        >
          {isLoading ? <LoaderCircle className="animate-spin" size={20} /> : 'Process and Import'}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
        <div>
            <Button variant="ghost" onClick={() => navigate('/bank')} className="flex items-center gap-2 text-sm mb-4">
                <ArrowLeft size={16} />
                Back to Bank
            </Button>
            <h1 className="text-5xl font-bold gradient-text">Add New Questions</h1>
            <p className="text-muted-foreground mt-2">Paste your unstructured MCQ text below and let the AI parse it for you.</p>
        </div>
      
      {parsedMCQs ? renderPreview() : renderForm()}
    </div>
  );
};

export default AddQuestions;