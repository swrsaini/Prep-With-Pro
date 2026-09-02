import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

const initialProgress = {
  bookmarks: [],
  wrongQuestions: [],
  reviewLater: [],
  attempts: [],
  streak: 0,
  xp: 0,
  settings: {},
  history: [],
};

function AppProvider({ children }) {
  const { token } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState(initialProgress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setQuestions([]);
      setProgress(initialProgress);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(async ([questionsResponse, progressResponse]) => {
        const [questionData, progressData] = await Promise.all([
          questionsResponse.json(),
          progressResponse.json(),
        ]);
        if (!questionsResponse.ok || !progressResponse.ok) {
          throw new Error(questionData.message || progressData.message || 'Unable to load your workspace.');
        }
        if (active) {
          setQuestions(questionData);
          setProgress({ ...initialProgress, ...progressData });
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const value = {
    questions,
    setQuestions,
    progress,
    setProgress,
    loading,
    error,
    xp: progress.xp || 0,
    bookmarkCount: progress.bookmarks.length,
    wrongQuestionCount: progress.wrongQuestions.length,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside an AppProvider.');
  }
  return context;
}

export { AppProvider, useApp };
