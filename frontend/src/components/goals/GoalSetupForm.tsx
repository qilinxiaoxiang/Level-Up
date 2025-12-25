import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoals } from '../../hooks/useGoals';
import type { GoalType } from '../../types';

interface GoalFormData {
  description: string;
}

const GOAL_CONFIG = {
  '3year': {
    label: '3-Year Goal',
    emoji: '🎯',
    description: 'Where do you want to be in 3 years?',
    placeholder: 'e.g., Become a technical lead at a top tech company',
    color: 'from-blue-600 to-cyan-600',
  },
  '1year': {
    label: '1-Year Goal',
    emoji: '📅',
    description: 'What milestone will you reach in 1 year?',
    placeholder: 'e.g., Master system design and lead 2 major projects',
    color: 'from-purple-600 to-pink-600',
  },
  '1month': {
    label: '1-Month Goal',
    emoji: '🚀',
    description: 'What will you accomplish this month?',
    placeholder: 'e.g., Complete advanced algorithms course and solve 50 LeetCode problems',
    color: 'from-green-600 to-emerald-600',
  },
};

export default function GoalSetupForm() {
  const navigate = useNavigate();
  const { createGoal, loading } = useGoals();
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);
  const [goals, setGoals] = useState<Record<GoalType, GoalFormData>>({
    '3year': { description: '' },
    '1year': { description: '' },
    '1month': { description: '' },
  });
  const [error, setError] = useState<string | null>(null);

  const goalTypes: GoalType[] = ['3year', '1year', '1month'];
  const currentGoalType = goalTypes[currentStep];
  const config = GOAL_CONFIG[currentGoalType];

  const handleInputChange = (value: string) => {
    setGoals((prev) => ({
      ...prev,
      [currentGoalType]: {
        ...prev[currentGoalType],
        description: value,
      },
    }));
    setError(null);
  };

  const handleNext = () => {
    if (!goals[currentGoalType].description.trim()) {
      setError('Please describe your goal');
      return;
    }

    if (currentStep < 2) {
      setCurrentStep((prev) => (prev + 1) as 0 | 1 | 2);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => (prev - 1) as 0 | 1 | 2);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!goals[currentGoalType].description.trim()) {
      setError('Please describe your goal');
      return;
    }

    setError(null);

    try {
      // Create all three goals
      for (const goalType of goalTypes) {
        await createGoal(
          goalType,
          goals[goalType].description
        );
      }

      // Navigate to dashboard after successful creation
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Failed to create goals');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="relative max-w-md mx-auto">
          <div className="absolute left-0 right-0 top-6 px-6">
            <div className="relative h-1 rounded-full bg-slate-700">
              <div
                className="absolute left-0 top-0 h-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 transition-all"
                style={{
                  width: `${(currentStep / (goalTypes.length - 1)) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            {goalTypes.map((type, index) => (
              <div
                key={type}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  index <= currentStep
                    ? 'bg-gradient-to-r ' + GOAL_CONFIG[type].color + ' text-white shadow-lg'
                    : 'bg-slate-700 text-gray-400'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between max-w-md mx-auto text-xs text-gray-400">
          <span>3-Year</span>
          <span>1-Year</span>
          <span>1-Month</span>
        </div>
      </div>

      {/* Goal Form Card */}
      <div className="bg-slate-800 rounded-lg p-8 border border-purple-500/20 shadow-lg">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{config.emoji}</div>
          <h2 className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${config.color} mb-2`}>
            {config.label}
          </h2>
          <p className="text-gray-400">{config.description}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Goal <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              value={goals[currentGoalType].description}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={config.placeholder}
              rows={4}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            Back
          </button>

          {currentStep < 2 ? (
            <button
              type="button"
              onClick={handleNext}
              className={`px-6 py-2 bg-gradient-to-r ${config.color} hover:opacity-90 text-white font-semibold rounded-lg transition-all`}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`px-6 py-2 bg-gradient-to-r ${config.color} hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed`}
            >
              {loading ? 'Creating Goals...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>

      {/* Helper Text */}
      <div className="mt-6 text-center text-sm text-gray-400">
        <p>Step {currentStep + 1} of 3 • All fields marked with * are required</p>
      </div>
    </div>
  );
}
