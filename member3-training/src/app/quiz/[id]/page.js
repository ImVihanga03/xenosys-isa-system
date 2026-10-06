"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function QuizPage({ params }) {
  const { id } = use(params);

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD QUIZ FROM DATABASE
  // =========================================================
  useEffect(() => {
    async function loadQuiz() {
      try {
        const response = await fetch(`/api/quizzes/module/${id}`);

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load quiz.");
        }

        setQuiz(data.quiz);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [id]);

  // =========================================================
  // SELECT AN ANSWER
  // =========================================================
  function selectAnswer(questionId, option) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: option,
    }));
  }

  // =========================================================
  // SUBMIT QUIZ
  // =========================================================
  async function handleSubmit(event) {
    event.preventDefault();

    if (!quiz) {
      return;
    }

    // Make sure every question has been answered
    if (Object.keys(answers).length !== quiz.questions.length) {
      alert("Please answer every question before submitting.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/quizzes/submit", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          quizId: quiz.quiz_id,
          answers: answers,

          // Temporary user until login system is connected
          userId: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Quiz submission failed.");
      }

      setResult(data.result);
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // =========================================================
  // TRY QUIZ AGAIN
  // =========================================================
  function handleTryAgain() {
    setAnswers({});
    setResult(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =========================================================
  // LOADING SCREEN
  // =========================================================
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Loading Quiz...
          </h1>

          <p className="text-slate-500 mt-2">
            Please wait while we load your questions.
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // ERROR SCREEN
  // =========================================================
  if (error || !quiz) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white border rounded-2xl p-10 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Quiz Unavailable
          </h1>

          <p className="mt-3 text-slate-600">
            {error || "The quiz could not be loaded."}
          </p>

          <Link
            href="/"
            className="inline-block mt-6 bg-slate-900 text-white px-6 py-3 rounded-lg"
          >
            Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // =========================================================
  // RESULT SCREEN
  // =========================================================
  if (result) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-6 py-5">
            Security Awareness Training
          </div>
        </header>

        <section className="max-w-2xl mx-auto px-6 py-20">
          <div className="bg-white border rounded-2xl p-10 text-center shadow-sm">

            {/* PASS / FAIL BADGE */}
            <div
              className={`inline-block px-5 py-2 rounded-full font-bold ${
                result.passed
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {result.passed ? "PASSED" : "NOT PASSED"}
            </div>

            <h1 className="text-4xl font-bold text-slate-900 mt-6">
              Quiz Result
            </h1>

            {/* SCORE */}
            <p
              className={`text-6xl font-bold mt-6 ${
                result.passed
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {result.score}%
            </p>

            {/* CORRECT ANSWERS */}
            <p className="text-slate-700 mt-5 text-lg">
              You answered{" "}
              <strong>{result.correctAnswers}</strong> out of{" "}
              <strong>{result.totalQuestions}</strong> questions correctly.
            </p>

            {/* PASS MARK */}
            <p className="text-slate-500 mt-2">
              Required pass mark:{" "}
              <strong>{result.passPercentage}%</strong>
            </p>

            {/* SUCCESS MESSAGE */}
            {result.passed ? (
              <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-5">
                <h2 className="font-bold text-green-800 text-lg">
                  Training Completed
                </h2>

                <p className="text-green-700 mt-1">
                  Congratulations! You successfully passed this training
                  module.
                </p>
              </div>
            ) : (
              <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-5">
                <h2 className="font-bold text-red-800 text-lg">
                  Keep Learning
                </h2>

                <p className="text-red-700 mt-1">
                  You did not reach the required pass mark. Review the
                  training material and try again.
                </p>
              </div>
            )}

            {/* BUTTONS */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">

              {!result.passed && (
                <button
                  onClick={handleTryAgain}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium cursor-pointer"
                >
                  Try Again
                </button>
              )}

              <Link
                href={`/training/${id}`}
                className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-lg font-medium"
              >
                Back to Training
              </Link>

              <Link
                href="/"
                className="bg-slate-900 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Dashboard
              </Link>

            </div>
          </div>
        </section>
      </main>
    );
  }

  // =========================================================
  // QUIZ SCREEN
  // =========================================================
  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-5">

          <Link
            href={`/training/${id}`}
            className="text-slate-300 hover:text-white"
          >
            ← Back to Training
          </Link>

        </div>
      </header>

      {/* QUIZ CONTENT */}
      <section className="max-w-4xl mx-auto px-6 py-10">

        {/* QUIZ HEADER */}
        <div className="mb-8">

          <p className="text-blue-600 font-semibold text-sm">
            KNOWLEDGE CHECK
          </p>

          <h1 className="text-4xl font-bold text-slate-900 mt-2">
            {quiz.title}
          </h1>

          <p className="text-slate-600 mt-3">
            Answer all {quiz.questions.length} questions.
          </p>

          <p className="text-slate-600 mt-1">
            You need{" "}
            <strong>{quiz.pass_percentage}%</strong>{" "}
            to pass this quiz.
          </p>

        </div>

        {/* QUIZ FORM */}
        <form onSubmit={handleSubmit}>

          <div className="space-y-6">

            {quiz.questions.map((question, index) => (

              <div
                key={question.question_id}
                className="bg-white border rounded-xl p-6 shadow-sm"
              >

                {/* QUESTION NUMBER */}
                <p className="text-sm text-slate-500 mb-2">
                  Question {index + 1} of {quiz.questions.length}
                </p>

                {/* QUESTION */}
                <h2 className="text-xl font-bold text-slate-900 mb-5">
                  {question.question_text}
                </h2>

                {/* ANSWERS */}
                <div className="space-y-3">

                  {[
                    ["A", question.option_a],
                    ["B", question.option_b],
                    ["C", question.option_c],
                    ["D", question.option_d],
                  ].map(([letter, text]) => {

                    const selected =
                      answers[question.question_id] === letter;

                    return (
                      <label
                        key={letter}
                        className={`flex items-center gap-4 border rounded-lg p-4 cursor-pointer transition ${
                          selected
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >

                        <input
                          type="radio"
                          name={`question-${question.question_id}`}
                          value={letter}
                          checked={selected}
                          onChange={() =>
                            selectAnswer(
                              question.question_id,
                              letter
                            )
                          }
                          className="w-4 h-4"
                        />

                        <span className="text-slate-800">
                          <strong>{letter}.</strong>{" "}
                          {text}
                        </span>

                      </label>
                    );
                  })}

                </div>

              </div>
            ))}

          </div>

          {/* ANSWER COUNTER */}
          <div className="mt-8 text-center text-slate-500">

            Answered{" "}
            <strong>
              {Object.keys(answers).length}
            </strong>{" "}
            of{" "}
            <strong>
              {quiz.questions.length}
            </strong>{" "}
            questions

          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            className={`mt-5 w-full py-4 rounded-xl font-bold text-white transition ${
              submitting
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-800 cursor-pointer"
            }`}
          >
            {submitting
              ? "Submitting..."
              : "Submit Quiz"}
          </button>

        </form>

      </section>

    </main>
  );
}