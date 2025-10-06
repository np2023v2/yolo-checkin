'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { predictionsApi, modelsApi } from '@/lib/api';
import { Model, PredictionResult } from '@/types';
import { Upload, TestTube } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function TestingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number>(0);
  const [confidence, setConfidence] = useState(0.25);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const loadModels = async () => {
    try {
      const data = await modelsApi.list();
      const deployedModels = data.filter(m => m.is_deployed);
      setModels(deployedModels);
      if (deployedModels.length > 0) {
        setSelectedModelId(deployedModels[0].id);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setPredictions(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.bmp']
    },
    multiple: false,
  });

  const handlePredict = async () => {
    if (!imageFile || !selectedModelId) return;

    setPredicting(true);
    try {
      const result = await predictionsApi.predict(imageFile, selectedModelId, confidence);
      setPredictions(result);
      drawPredictions(result);
    } catch (error) {
      console.error('Failed to run prediction:', error);
      alert('Failed to run prediction');
    } finally {
      setPredicting(false);
    }
  };

  const drawPredictions = (result: PredictionResult) => {
    if (!canvasRef.current || !imagePreview) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Draw bounding boxes
      result.predictions.forEach((pred, idx) => {
        const colors = [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
          '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A569BD'
        ];
        const color = colors[pred.class_id % colors.length];

        // Draw rectangle
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(
          pred.x_min,
          pred.y_min,
          pred.x_max - pred.x_min,
          pred.y_max - pred.y_min
        );

        // Draw label background
        const label = `${pred.class_name} ${(pred.confidence * 100).toFixed(1)}%`;
        ctx.font = '16px Arial';
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = color;
        ctx.fillRect(pred.x_min, pred.y_min - 25, textWidth + 10, 25);

        // Draw label text
        ctx.fillStyle = 'white';
        ctx.fillText(label, pred.x_min + 5, pred.y_min - 7);
      });
    };
    img.src = imagePreview;
  };

  const handleExport = () => {
    if (!predictions) return;

    const dataStr = JSON.stringify(predictions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'predictions.json';
    link.click();
    URL.revokeObjectURL(url);
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
          <h1 className="text-3xl font-bold text-gray-900">Model Testing</h1>
          <p className="mt-2 text-gray-600">Test your models with new images</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading models...</p>
          </div>
        ) : models.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <TestTube className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No deployed models</h3>
              <p className="text-gray-600 mb-4">Deploy a model first to start testing</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-6">
              <Card title="Configuration">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Model
                    </label>
                    <select
                      value={selectedModelId}
                      onChange={(e) => setSelectedModelId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confidence Threshold: {(confidence * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={confidence}
                      onChange={(e) => setConfidence(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <Button
                    onClick={handlePredict}
                    disabled={!imageFile || predicting}
                    className="w-full"
                  >
                    {predicting ? 'Running Inference...' : 'Run Prediction'}
                  </Button>

                  {predictions && (
                    <Button
                      variant="secondary"
                      onClick={handleExport}
                      className="w-full"
                    >
                      Export Results
                    </Button>
                  )}
                </div>
              </Card>

              {/* Results */}
              {predictions && (
                <Card title="Predictions">
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Inference Time:</span>{' '}
                      <span className="font-semibold text-gray-900">
                        {predictions.inference_time.toFixed(3)}s
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Objects Found:</span>{' '}
                      <span className="font-semibold text-gray-900">
                        {predictions.predictions.length}
                      </span>
                    </div>
                    
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Detections</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {predictions.predictions.map((pred, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-gray-50 rounded-lg text-sm"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900">
                                {pred.class_name}
                              </span>
                              <span className="text-gray-600">
                                {(pred.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Box: [{pred.x_min.toFixed(0)}, {pred.y_min.toFixed(0)}, {pred.x_max.toFixed(0)}, {pred.y_max.toFixed(0)}]
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Image Display */}
            <div className="lg:col-span-2">
              <Card title="Image">
                {!imagePreview ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                    {isDragActive ? (
                      <p className="text-gray-600">Drop the image here...</p>
                    ) : (
                      <>
                        <p className="text-gray-600 mb-2">
                          Drag & drop an image here, or click to select
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports: JPG, JPEG, PNG, BMP
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      {predictions ? (
                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                          <canvas
                            ref={canvasRef}
                            className="w-full h-auto"
                          />
                        </div>
                      ) : (
                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-auto"
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setPredictions(null);
                      }}
                      className="w-full"
                    >
                      Upload New Image
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
