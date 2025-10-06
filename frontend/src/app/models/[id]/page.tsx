'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { modelsApi } from '@/lib/api';
import { Model } from '@/types';
import { ChevronLeft, Upload, Download, PlayCircle, StopCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ModelDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const modelId = parseInt(params.id as string);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && modelId) {
      loadModel();
    }
  }, [user, modelId]);

  const loadModel = async () => {
    try {
      const data = await modelsApi.get(modelId);
      setModel(data);
    } catch (error) {
      console.error('Failed to load model:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pt') && !file.name.endsWith('.pth')) {
      alert('Please upload a .pt or .pth file');
      return;
    }

    setUploading(true);
    try {
      await modelsApi.upload(modelId, file);
      alert('Model file uploaded successfully!');
      loadModel();
    } catch (error) {
      console.error('Failed to upload model:', error);
      alert('Failed to upload model file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!model) return;
    
    try {
      const blob = await modelsApi.download(modelId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${model.name}.pt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download model:', error);
      alert('Failed to download model');
    }
  };

  const handleDeploy = async () => {
    try {
      await modelsApi.deploy(modelId);
      loadModel();
      alert('Model deployed successfully!');
    } catch (error) {
      console.error('Failed to deploy model:', error);
      alert('Failed to deploy model');
    }
  };

  const handleUndeploy = async () => {
    try {
      await modelsApi.undeploy(modelId);
      loadModel();
      alert('Model undeployed successfully!');
    } catch (error) {
      console.error('Failed to undeploy model:', error);
      alert('Failed to undeploy model');
    }
  };

  if (authLoading || loading || !model) {
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
          <Link href="/models" className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 mb-4">
            <ChevronLeft size={20} />
            <span>Back to Models</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{model.name}</h1>
              {model.description && (
                <p className="mt-2 text-gray-600">{model.description}</p>
              )}
            </div>
            <div className="flex space-x-2">
              {model.is_deployed ? (
                <Button
                  variant="danger"
                  className="flex items-center space-x-2"
                  onClick={handleUndeploy}
                >
                  <StopCircle size={20} />
                  <span>Undeploy</span>
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="flex items-center space-x-2"
                  onClick={handleDeploy}
                  disabled={!model.file_path}
                >
                  <PlayCircle size={20} />
                  <span>Deploy</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <p className="text-sm text-gray-600 font-medium">Status</p>
            <p className={`text-2xl font-bold mt-1 ${model.is_deployed ? 'text-green-600' : 'text-gray-500'}`}>
              {model.is_deployed ? 'Deployed' : 'Not Deployed'}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-gray-600 font-medium">Model Type</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{model.model_type}</p>
          </Card>

          <Card>
            <p className="text-sm text-gray-600 font-medium">Classes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {model.num_classes || 'N/A'}
            </p>
          </Card>

          <Card>
            <p className="text-sm text-gray-600 font-medium">File Status</p>
            <p className={`text-2xl font-bold mt-1 ${model.file_path ? 'text-green-600' : 'text-orange-600'}`}>
              {model.file_path ? 'Uploaded' : 'No File'}
            </p>
          </Card>
        </div>

        {/* Model Information */}
        <Card className="mb-8" title="Model Information">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(model.created_at), 'MMM d, yyyy HH:mm')}
              </p>
            </div>
            {model.updated_at && (
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(new Date(model.updated_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Owner ID</p>
              <p className="text-lg font-semibold text-gray-900">{model.owner_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Public</p>
              <p className="text-lg font-semibold text-gray-900">
                {model.is_public ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </Card>

        {/* Class Names */}
        {model.class_names && model.class_names.length > 0 && (
          <Card className="mb-8" title="Classes">
            <div className="flex flex-wrap gap-2">
              {model.class_names.map((className, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {className}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Metrics */}
        {model.metrics && (
          <Card className="mb-8" title="Performance Metrics">
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-800 overflow-auto">
                {JSON.stringify(model.metrics, null, 2)}
              </pre>
            </div>
          </Card>
        )}

        {/* File Management */}
        <Card title="Model File">
          <div className="space-y-4">
            {model.file_path ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">Model file uploaded</p>
                  <p className="text-xs text-green-700 mt-1">{model.file_path}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={handleDownload}
                >
                  <Download size={16} />
                  <span>Download</span>
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-900">No model file uploaded</p>
                <p className="text-xs text-orange-700 mt-1">
                  Upload a trained model file (.pt or .pth) to deploy this model
                </p>
              </div>
            )}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pt,.pth"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="primary"
                className="flex items-center space-x-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload size={20} />
                <span>{uploading ? 'Uploading...' : 'Upload Model File'}</span>
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: .pt, .pth (PyTorch model files)
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
