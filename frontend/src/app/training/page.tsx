'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { trainingApi, datasetsApi } from '@/lib/api';
import { TrainingJob, Dataset } from '@/types';
import { Plus, Zap, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function TrainingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number>(0);
  const [modelType, setModelType] = useState('yolov8n');
  const [epochs, setEpochs] = useState('100');
  const [batchSize, setBatchSize] = useState('16');
  const [imgSize, setImgSize] = useState('640');
  const [learningRate, setLearningRate] = useState('0.01');
  const [patience, setPatience] = useState('50');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadTrainingJobs();
      loadDatasets();
    }
  }, [user]);

  const loadTrainingJobs = async () => {
    try {
      const data = await trainingApi.list();
      setTrainingJobs(data.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error('Failed to load training jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDatasets = async () => {
    try {
      const data = await datasetsApi.list();
      setDatasets(data);
      if (data.length > 0) {
        setSelectedDatasetId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  };

  const handleCreateJob = async () => {
    if (!selectedDatasetId) {
      setError('Please select a dataset');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await trainingApi.create({
        dataset_id: selectedDatasetId,
        model_type: modelType,
        epochs: parseInt(epochs),
        batch_size: parseInt(batchSize),
        img_size: parseInt(imgSize),
        learning_rate: parseFloat(learningRate),
        patience: parseInt(patience),
      });
      setShowCreateModal(false);
      loadTrainingJobs();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create training job');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelJob = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this training job?')) {
      return;
    }

    try {
      await trainingApi.cancel(id);
      loadTrainingJobs();
    } catch (error) {
      console.error('Failed to cancel job:', error);
      alert('Failed to cancel job');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />;
      case 'running':
        return <Loader className="text-blue-500 animate-spin" size={20} />;
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training Jobs</h1>
            <p className="mt-2 text-gray-600">Manage and monitor your model training</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>New Training Job</span>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading training jobs...</p>
          </div>
        ) : trainingJobs.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Zap className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No training jobs yet</h3>
              <p className="text-gray-600 mb-4">Create your first training job to get started</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Training Job
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {trainingJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {getStatusIcon(job.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Job #{job.id}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-600">Model Type</p>
                          <p className="text-sm font-semibold text-gray-900">{job.model_id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Epochs</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {job.current_epoch} / {job.epochs}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Batch Size</p>
                          <p className="text-sm font-semibold text-gray-900">{job.batch_size}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Image Size</p>
                          <p className="text-sm font-semibold text-gray-900">{job.img_size}</p>
                        </div>
                      </div>
                      
                      {job.best_map !== null && job.best_map !== undefined && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-600">Best mAP</p>
                          <p className="text-sm font-semibold text-green-600">
                            {(job.best_map * 100).toFixed(2)}%
                          </p>
                        </div>
                      )}
                      
                      {job.status === 'running' && (
                        <div className="mb-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(job.current_epoch / job.epochs) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {job.error_message && (
                        <div className="mt-2 text-sm text-red-600">
                          Error: {job.error_message}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {format(new Date(job.created_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link href={`/training/${job.id}`}>
                      <Button size="sm" variant="secondary">
                        View Logs
                      </Button>
                    </Link>
                    {(job.status === 'pending' || job.status === 'running') && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleCancelJob(job.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Training Job Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setError('');
          }}
          title="Create Training Job"
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateJob}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Start Training'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dataset
              </label>
              <select
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.num_images} images)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model Type
              </label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="yolov8n">YOLOv8 Nano (fastest)</option>
                <option value="yolov8s">YOLOv8 Small</option>
                <option value="yolov8m">YOLOv8 Medium</option>
                <option value="yolov8l">YOLOv8 Large</option>
                <option value="yolov8x">YOLOv8 XLarge (most accurate)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Epochs"
                type="number"
                value={epochs}
                onChange={(e) => setEpochs(e.target.value)}
                min="1"
              />
              <Input
                label="Batch Size"
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                min="1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Image Size"
                type="number"
                value={imgSize}
                onChange={(e) => setImgSize(e.target.value)}
                min="32"
                step="32"
              />
              <Input
                label="Learning Rate"
                type="number"
                value={learningRate}
                onChange={(e) => setLearningRate(e.target.value)}
                min="0.0001"
                max="1"
                step="0.001"
              />
            </div>

            <Input
              label="Patience (early stopping)"
              type="number"
              value={patience}
              onChange={(e) => setPatience(e.target.value)}
              min="1"
            />
          </div>
        </Modal>
      </main>
    </div>
  );
}
