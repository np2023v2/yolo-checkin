'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { modelsApi } from '@/lib/api';
import { Model } from '@/types';
import { Plus, Box, Search, Download, Trash2, PlayCircle, StopCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ModelsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelDescription, setNewModelDescription] = useState('');
  const [modelType, setModelType] = useState('yolov8n');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadModels();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = models.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredModels(filtered);
    } else {
      setFilteredModels(models);
    }
  }, [searchQuery, models]);

  const loadModels = async () => {
    try {
      const data = await modelsApi.list();
      setModels(data);
      setFilteredModels(data);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModel = async () => {
    if (!newModelName.trim()) {
      setError('Model name is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await modelsApi.create({
        name: newModelName,
        description: newModelDescription || undefined,
        model_type: modelType,
      });
      setShowCreateModal(false);
      setNewModelName('');
      setNewModelDescription('');
      setModelType('yolov8n');
      loadModels();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create model');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteModel = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await modelsApi.delete(id);
      loadModels();
    } catch (error) {
      console.error('Failed to delete model:', error);
      alert('Failed to delete model');
    }
  };

  const handleDeploy = async (id: number) => {
    try {
      await modelsApi.deploy(id);
      loadModels();
      alert('Model deployed successfully!');
    } catch (error) {
      console.error('Failed to deploy model:', error);
      alert('Failed to deploy model');
    }
  };

  const handleUndeploy = async (id: number) => {
    try {
      await modelsApi.undeploy(id);
      loadModels();
      alert('Model undeployed successfully!');
    } catch (error) {
      console.error('Failed to undeploy model:', error);
      alert('Failed to undeploy model');
    }
  };

  const handleDownload = async (id: number, name: string) => {
    try {
      const blob = await modelsApi.download(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.pt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download model:', error);
      alert('Failed to download model');
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
            <h1 className="text-3xl font-bold text-gray-900">Models</h1>
            <p className="mt-2 text-gray-600">Manage your trained YOLO models</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Model</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading models...</p>
          </div>
        ) : filteredModels.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Box className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No models found' : 'No models yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Try a different search term' : 'Create your first model to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateModal(true)}>
                  Create Model
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model) => (
              <Card key={model.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Box className="text-blue-500" size={24} />
                    <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                  </div>
                  <button
                    onClick={() => handleDeleteModel(model.id, model.name)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {model.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {model.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-semibold text-gray-900">{model.model_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold ${model.is_deployed ? 'text-green-600' : 'text-gray-500'}`}>
                      {model.is_deployed ? 'Deployed' : 'Not Deployed'}
                    </span>
                  </div>
                  {model.num_classes && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Classes:</span>
                      <span className="font-semibold text-gray-900">{model.num_classes}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-semibold text-gray-900">
                      {format(new Date(model.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <Link href={`/models/${model.id}`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  
                  <div className="flex space-x-2">
                    {model.file_path && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 flex items-center justify-center space-x-1"
                        onClick={() => handleDownload(model.id, model.name)}
                      >
                        <Download size={16} />
                        <span>Download</span>
                      </Button>
                    )}
                    
                    {model.is_deployed ? (
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1 flex items-center justify-center space-x-1"
                        onClick={() => handleUndeploy(model.id)}
                      >
                        <StopCircle size={16} />
                        <span>Undeploy</span>
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 flex items-center justify-center space-x-1"
                        onClick={() => handleDeploy(model.id)}
                        disabled={!model.file_path}
                      >
                        <PlayCircle size={16} />
                        <span>Deploy</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Model Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setError('');
          }}
          title="Create New Model"
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
                onClick={handleCreateModel}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create'}
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

            <Input
              label="Model Name"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="e.g., Vehicle Detector v1"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={newModelDescription}
                onChange={(e) => setNewModelDescription(e.target.value)}
                placeholder="Describe your model..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                <option value="yolov8n">YOLOv8 Nano</option>
                <option value="yolov8s">YOLOv8 Small</option>
                <option value="yolov8m">YOLOv8 Medium</option>
                <option value="yolov8l">YOLOv8 Large</option>
                <option value="yolov8x">YOLOv8 XLarge</option>
              </select>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
