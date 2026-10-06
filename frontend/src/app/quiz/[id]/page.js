'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

export default function QuizPage() {
  const params = useParams();
  const id = params.id;

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api(`/training/quizzes/module/${id}`);
        setQuiz(data.quiz);
      } catch (err) {
        setError(err.message || 'Unable to load quiz');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  function selectAnswer(questionId, option) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!quiz) return;
    if (Object.keys(answers).length !== quiz.questions.length) {
      alert('Please answer every question before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      const data = await api('/training/quizzes/submit', {
        method: 'POST',
        body: { quizId: quiz.quiz_id, answers },
      });
      setResult(data.result);
    } catch (err) {
      alert(err.message || 'Quiz submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-8 max-w-4xl mx-auto">
          <Link
            href={`/training/${id}`}
            className="text-sm text-blue-700 hover:underline"
          >
            ← Back to Training
          </Link>

          {loading && <div className="mt-6">Loading quiz...</div>}
          {error && (
            <div className="mt-6 rounded border border-red-300 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-8 bg-white border rounded-xl p-10 text-center">
              <div
                className={`inline-block px-5 py-2 rounded-full font-bold ${
                  result.passed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {result.passed ? 'PASSED' : 'NOT PASSED'}
              </div>
              <h1 className="text-3xl font-bold mt-6">Quiz Result</h1>
              <p
                className={`text-5xl font-bold mt-4 ${
                  result.passed ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {result.score}%
              </p>
              <p className="mt-4 text-slate-700">
                {result.correctAnswers} / {result.totalQuestions} correct
              </p>
              <p className="text-slate-500 mt-1">
                Pass mark: {result.passPercentage}%
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                {!result.passed && (
                  <button
                    onClick={() => {
                      setAnswers({});
                      setResult(null);
                    }}
                    className="bg-blue-700 text-white px-6 py-2.5 rounded-lg"
                  >
                    Try Again
                  </button>
                )}
                <Link
                  href={`/training/${id}`}
                  className="bg-slate-200 px-6 py-2.5 rounded-lg"
                >
                  Back to Training
                </Link>
                <Link
                  href="/training"
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-lg"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          )}

          {quiz && !result && (
            <div className="mt-6">
              <h1 className="text-3xl font-bold">{quiz.title}</h1>
              <p className="text-slate-600 mt-2">
                Answer all {quiz.questions.length} questions. Pass mark:{' '}
                {quiz.pass_percentage}%
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {quiz.questions.map((q, index) => (
                  <div key={q.question_id} className="bg-white border rounded-xl p-6">
                    <p className="text-sm text-slate-500 mb-2">
                      Question {index + 1} of {quiz.questions.length}
                    </p>
                    <h2 className="text-lg font-bold mb-4">{q.question_text}</h2>
                    <div className="space-y-3">
                      {[
                        ['A', q.option_a],
                        ['B', q.option_b],
                        ['C', q.option_c],
                        ['D', q.option_d],
                      ].map(([letter, text]) => {
                        const selected = answers[q.question_id] === letter;
                        return (
                          <label
                            key={letter}
                            className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer ${
                              selected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${q.question_id}`}
                              checked={selected}
                              onChange={() => selectAnswer(q.question_id, letter)}
                            />
                            <span>
                              <strong>{letter}.</strong> {text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <p className="text-center text-slate-500">
                  Answered {Object.keys(answers).length} of {quiz.questions.length}
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </form>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}