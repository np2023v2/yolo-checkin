'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { trainingApi } from '@/lib/api';
import { TrainingJob } from '@/types';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function TrainingDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = parseInt(params.id as string);

  const [job, setJob] = useState<TrainingJob | null>(null);
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && jobId) {
      loadJobDetails();
      loadLogs();
      
      // Auto-refresh for running jobs
      const interval = setInterval(() => {
        if (job?.status === 'running' || job?.status === 'pending') {
          loadJobDetails();
          loadLogs();
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [user, jobId, job?.status]);

  const loadJobDetails = async () => {
    try {
      const data = await trainingApi.get(jobId);
      setJob(data);
    } catch (error) {
      console.error('Failed to load job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await trainingApi.getLogs(jobId);
      setLogs(data.logs || 'No logs available yet');
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobDetails();
    await loadLogs();
    setRefreshing(false);
  };

  if (authLoading || loading || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/training" className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 mb-4">
            <ChevronLeft size={20} />
            <span>Back to Training</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Training Job #{job.id}</h1>
              <p className="mt-2 text-gray-600">
                Status: <span className="font-semibold">{job.status.toUpperCase()}</span>
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <p className="text-sm text-gray-600 font-medium">Progress</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {job.current_epoch} / {job.epochs}
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(job.current_epoch / job.epochs) * 100}%` }}
              />
            </div>
          </Card>

          <Card>
            <p className="text-sm text-gray-600 font-medium">Best mAP</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {job.best_map !== null && job.best_map !== undefined
                ? `${(job.best_map * 100).toFixed(2)}%`
                : 'N/A'}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-gray-600 font-medium">Training Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {job.training_time !== null && job.training_time !== undefined
                ? `${Math.round(job.training_time)}s`
                : 'In progress...'}
            </p>
          </Card>
        </div>

        {/* Parameters */}
        <Card className="mb-8" title="Training Parameters">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Dataset ID</p>
              <p className="text-lg font-semibold text-gray-900">{job.dataset_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Model ID</p>
              <p className="text-lg font-semibold text-gray-900">{job.model_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Batch Size</p>
              <p className="text-lg font-semibold text-gray-900">{job.batch_size}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Image Size</p>
              <p className="text-lg font-semibold text-gray-900">{job.img_size}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Learning Rate</p>
              <p className="text-lg font-semibold text-gray-900">{job.learning_rate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Patience</p>
              <p className="text-lg font-semibold text-gray-900">{job.patience}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(job.created_at), 'MMM d, HH:mm')}
              </p>
            </div>
            {job.completed_at && (
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(new Date(job.completed_at), 'MMM d, HH:mm')}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Error Message */}
        {job.error_message && (
          <Card className="mb-8">
            <h3 className="text-lg font-semibold text-red-600 mb-3">Error</h3>
            <pre className="text-sm text-red-700 bg-red-50 p-4 rounded-lg overflow-auto">
              {job.error_message}
            </pre>
          </Card>
        )}

        {/* Training Logs */}
        <Card title="Training Logs">
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
            <pre>{logs}</pre>
          </div>
        </Card>
      </main>
    </div>
  );
}
