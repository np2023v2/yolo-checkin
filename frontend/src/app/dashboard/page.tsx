'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/Card';
import { datasetsApi, modelsApi, trainingApi } from '@/lib/api';
import { Database, Box, Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalDatasets: 0,
    totalModels: 0,
    totalTrainingJobs: 0,
    activeTrainingJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const [datasets, models, trainingJobs] = await Promise.all([
        datasetsApi.list(),
        modelsApi.list(),
        trainingApi.list(),
      ]);

      setStats({
        totalDatasets: datasets.length,
        totalModels: models.length,
        totalTrainingJobs: trainingJobs.length,
        activeTrainingJobs: trainingJobs.filter(j => j.status === 'running' || j.status === 'pending').length,
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user.username}!</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Datasets</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalDatasets}</p>
                  </div>
                  <Database className="text-blue-500" size={32} />
                </div>
                <Link href="/datasets" className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block">
                  Manage datasets →
                </Link>
              </Card>

              <Card className="border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Models</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalModels}</p>
                  </div>
                  <Box className="text-green-500" size={32} />
                </div>
                <Link href="/models" className="text-sm text-green-600 hover:text-green-700 mt-4 inline-block">
                  View models →
                </Link>
              </Card>

              <Card className="border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Training Jobs</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalTrainingJobs}</p>
                  </div>
                  <Zap className="text-purple-500" size={32} />
                </div>
                <Link href="/training" className="text-sm text-purple-600 hover:text-purple-700 mt-4 inline-block">
                  View training →
                </Link>
              </Card>

              <Card className="border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Active Jobs</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeTrainingJobs}</p>
                  </div>
                  <CheckCircle className="text-orange-500" size={32} />
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card title="Quick Actions">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/datasets"
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Database className="text-blue-500 mb-2" size={24} />
                  <h3 className="font-semibold text-gray-900">Create Dataset</h3>
                  <p className="text-sm text-gray-600 mt-1">Start a new dataset for training</p>
                </Link>

                <Link
                  href="/labeling"
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Database className="text-blue-500 mb-2" size={24} />
                  <h3 className="font-semibold text-gray-900">Label Images</h3>
                  <p className="text-sm text-gray-600 mt-1">Annotate images for training</p>
                </Link>

                <Link
                  href="/training"
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Zap className="text-blue-500 mb-2" size={24} />
                  <h3 className="font-semibold text-gray-900">Start Training</h3>
                  <p className="text-sm text-gray-600 mt-1">Train a new YOLO model</p>
                </Link>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
