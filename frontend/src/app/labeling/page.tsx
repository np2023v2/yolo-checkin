'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { datasetsApi } from '@/lib/api';
import { Dataset, DatasetImage, Annotation } from '@/types';
import { Stage, Layer, Image as KonvaImage, Rect, Text } from 'react-konva';
import { ChevronLeft, ChevronRight, Save, Trash2 } from 'lucide-react';
import useImage from 'use-image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface BBox {
  id?: number;
  classId: number;
  className: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function ImageCanvas({ 
  imageUrl, 
  boxes, 
  onBoxAdd, 
  onBoxDelete,
  selectedClassId,
  selectedClassName,
}: { 
  imageUrl: string;
  boxes: BBox[];
  onBoxAdd: (box: BBox) => void;
  onBoxDelete: (index: number) => void;
  selectedClassId: number;
  selectedClassName: string;
}) {
  const [image] = useImage(imageUrl);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newBox, setNewBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const stageRef = useRef<any>(null);
  
  const canvasWidth = 800;
  const canvasHeight = 600;
  
  const scale = image ? Math.min(canvasWidth / image.width, canvasHeight / image.height) : 1;
  const scaledWidth = image ? image.width * scale : canvasWidth;
  const scaledHeight = image ? image.height * scale : canvasHeight;

  const handleMouseDown = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    setIsDrawing(true);
    setNewBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !newBox) return;
    
    const pos = e.target.getStage().getPointerPosition();
    setNewBox({
      ...newBox,
      width: pos.x - newBox.x,
      height: pos.y - newBox.y,
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !newBox || !image) return;
    
    if (Math.abs(newBox.width) > 10 && Math.abs(newBox.height) > 10) {
      // Normalize box (handle negative width/height)
      const x = newBox.width < 0 ? newBox.x + newBox.width : newBox.x;
      const y = newBox.height < 0 ? newBox.y + newBox.height : newBox.y;
      const width = Math.abs(newBox.width);
      const height = Math.abs(newBox.height);
      
      onBoxAdd({
        classId: selectedClassId,
        className: selectedClassName,
        x,
        y,
        width,
        height,
      });
    }
    
    setIsDrawing(false);
    setNewBox(null);
  };

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A569BD'
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-900">
      <Stage
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              width={scaledWidth}
              height={scaledHeight}
            />
          )}
          
          {/* Existing boxes */}
          {boxes.map((box, idx) => {
            const color = colors[box.classId % colors.length];
            return (
              <React.Fragment key={idx}>
                <Rect
                  x={box.x}
                  y={box.y}
                  width={box.width}
                  height={box.height}
                  stroke={color}
                  strokeWidth={2}
                  fill={`${color}20`}
                />
                <Text
                  x={box.x}
                  y={box.y - 20}
                  text={box.className}
                  fontSize={14}
                  fill={color}
                  fontStyle="bold"
                />
              </React.Fragment>
            );
          })}
          
          {/* New box being drawn */}
          {newBox && (
            <Rect
              x={newBox.width < 0 ? newBox.x + newBox.width : newBox.x}
              y={newBox.height < 0 ? newBox.y + newBox.height : newBox.y}
              width={Math.abs(newBox.width)}
              height={Math.abs(newBox.height)}
              stroke="#00FF00"
              strokeWidth={2}
              fill="#00FF0020"
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}

export default function LabelingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const datasetId = parseInt(searchParams.get('dataset') || '0');
  const initialImageId = parseInt(searchParams.get('image') || '0');

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [images, setImages] = useState<DatasetImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImage, setCurrentImage] = useState<DatasetImage | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [boxes, setBoxes] = useState<BBox[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && datasetId) {
      loadDataset();
      loadImages();
    }
  }, [user, datasetId]);

  useEffect(() => {
    if (images.length > 0) {
      const initialIndex = initialImageId 
        ? images.findIndex(img => img.id === initialImageId)
        : 0;
      setCurrentImageIndex(initialIndex >= 0 ? initialIndex : 0);
    }
  }, [images, initialImageId]);

  useEffect(() => {
    if (images.length > 0 && currentImageIndex >= 0) {
      const image = images[currentImageIndex];
      setCurrentImage(image);
      loadAnnotations(image.id);
    }
  }, [currentImageIndex, images]);

  const loadDataset = async () => {
    try {
      const data = await datasetsApi.get(datasetId);
      setDataset(data);
      if (data.class_names && data.class_names.length > 0) {
        setSelectedClassId(0);
      }
    } catch (error) {
      console.error('Failed to load dataset:', error);
    }
  };

  const loadImages = async () => {
    try {
      const data = await datasetsApi.listImages(datasetId);
      setImages(data);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnotations = async (imageId: number) => {
    if (!currentImage) return;
    
    try {
      const data = await datasetsApi.getAnnotations(datasetId, imageId);
      setAnnotations(data);
      
      // Convert annotations to boxes for display
      if (currentImage.width && currentImage.height) {
        const canvasWidth = 800;
        const canvasHeight = 600;
        const scale = Math.min(canvasWidth / currentImage.width, canvasHeight / currentImage.height);
        const scaledWidth = currentImage.width * scale;
        const scaledHeight = currentImage.height * scale;
        
        const convertedBoxes = data.map(ann => ({
          id: ann.id,
          classId: ann.class_id,
          className: ann.class_name,
          x: (ann.x_center - ann.width / 2) * scaledWidth,
          y: (ann.y_center - ann.height / 2) * scaledHeight,
          width: ann.width * scaledWidth,
          height: ann.height * scaledHeight,
        }));
        setBoxes(convertedBoxes);
      }
    } catch (error) {
      console.error('Failed to load annotations:', error);
    }
  };

  const handleBoxAdd = (box: BBox) => {
    setBoxes([...boxes, box]);
  };

  const handleBoxDelete = (index: number) => {
    const newBoxes = boxes.filter((_, i) => i !== index);
    setBoxes(newBoxes);
  };

  const handleSave = async () => {
    if (!currentImage || !currentImage.width || !currentImage.height) return;
    
    setSaving(true);
    try {
      // Delete existing annotations
      for (const ann of annotations) {
        await datasetsApi.deleteAnnotation(datasetId, currentImage.id, ann.id);
      }
      
      // Convert boxes back to YOLO format and save
      const canvasWidth = 800;
      const canvasHeight = 600;
      const scale = Math.min(canvasWidth / currentImage.width, canvasHeight / currentImage.height);
      const scaledWidth = currentImage.width * scale;
      const scaledHeight = currentImage.height * scale;
      
      for (const box of boxes) {
        const x_center = (box.x + box.width / 2) / scaledWidth;
        const y_center = (box.y + box.height / 2) / scaledHeight;
        const width = box.width / scaledWidth;
        const height = box.height / scaledHeight;
        
        await datasetsApi.createAnnotation(datasetId, currentImage.id, {
          class_id: box.classId,
          class_name: box.className,
          x_center,
          y_center,
          width,
          height,
        });
      }
      
      alert('Annotations saved successfully!');
      loadAnnotations(currentImage.id);
    } catch (error) {
      console.error('Failed to save annotations:', error);
      alert('Failed to save annotations');
    } finally {
      setSaving(false);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  if (authLoading || loading || !dataset || !currentImage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedClassName = dataset.class_names?.[selectedClassId] || 'Unknown';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Image Labeling</h1>
          <p className="mt-2 text-gray-600">
            Dataset: {dataset.name} | Image {currentImageIndex + 1} of {images.length}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Canvas */}
          <div className="lg:col-span-3">
            <Card>
              <ImageCanvas
                imageUrl={`${API_BASE_URL}${currentImage.file_path}`}
                boxes={boxes}
                onBoxAdd={handleBoxAdd}
                onBoxDelete={handleBoxDelete}
                selectedClassId={selectedClassId}
                selectedClassName={selectedClassName}
              />
              
              <div className="mt-4 flex items-center justify-between">
                <Button
                  onClick={handlePrevImage}
                  disabled={currentImageIndex === 0}
                  className="flex items-center space-x-2"
                >
                  <ChevronLeft size={20} />
                  <span>Previous</span>
                </Button>
                
                <div className="text-sm text-gray-600">
                  {currentImage.filename}
                </div>
                
                <Button
                  onClick={handleNextImage}
                  disabled={currentImageIndex === images.length - 1}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight size={20} />
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Class Selection */}
            <Card title="Select Class">
              <div className="space-y-2">
                {dataset.class_names?.map((className, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedClassId(idx)}
                    className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
                      selectedClassId === idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {className}
                  </button>
                ))}
              </div>
            </Card>

            {/* Annotations List */}
            <Card title="Annotations">
              {boxes.length === 0 ? (
                <p className="text-sm text-gray-600">No annotations yet</p>
              ) : (
                <div className="space-y-2">
                  {boxes.map((box, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-900">{box.className}</span>
                      <button
                        onClick={() => handleBoxDelete(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Actions */}
            <Card>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Save size={20} />
                <span>{saving ? 'Saving...' : 'Save Annotations'}</span>
              </Button>
              
              <div className="mt-4 text-xs text-gray-600">
                <p className="font-semibold mb-1">Instructions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Select a class</li>
                  <li>Click and drag to draw boxes</li>
                  <li>Click save when done</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
