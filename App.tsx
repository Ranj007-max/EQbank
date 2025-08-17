import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import BankDashboard from './pages/BankDashboard';
import AddQuestions from './pages/AddQuestions';
import BatchReview from './pages/BatchReview';
import StudySession from './pages/StudySession';
import ExamSetup from './pages/ExamSetup';
import ExamSession from './pages/ExamSession';
import ExamResults from './pages/ExamResults';
import SrsReviewSession from './pages/SrsReviewSession';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bank" element={<BankDashboard />} />
        <Route path="/bank/add" element={<AddQuestions />} />
        <Route path="/bank/batch/:batchId" element={<BatchReview />} />
        <Route path="/study" element={<StudySession />} />
        <Route path="/review" element={<SrsReviewSession />} />
        <Route path="/exams" element={<ExamSetup />} />
        <Route path="/exam/session" element={<ExamSession />} />
        <Route path="/exam/results/:sessionId" element={<ExamResults />} />
      </Routes>
    </Layout>
  );
}

export default App;