'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { checkinApi } from '@/lib/api';
import { Person } from '@/types';
import { UserPlus, Users, Edit, Trash2, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function PersonsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadPersons();
    }
  }, [user]);

  const loadPersons = async () => {
    setLoading(true);
    try {
      const data = await checkinApi.listPersons(true);
      setPersons(data);
    } catch (error) {
      console.error('Failed to load persons:', error);
      alert('Failed to load persons');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    multiple: false,
  });

  const openCreateModal = () => {
    setEditingPerson(null);
    setName('');
    setEmployeeId('');
    setDepartment('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowModal(true);
  };

  const openEditModal = (person: Person) => {
    setEditingPerson(person);
    setName(person.name);
    setEmployeeId(person.employee_id || '');
    setDepartment(person.department || '');
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Name is required');
      return;
    }

    if (!editingPerson && !photoFile) {
      alert('Photo is required for new person');
      return;
    }

    setSubmitting(true);
    try {
      if (editingPerson) {
        // Update existing person
        await checkinApi.updatePerson(editingPerson.id, {
          name: name.trim(),
          employee_id: employeeId.trim() || undefined,
          department: department.trim() || undefined,
        });
        alert('Person updated successfully');
      } else {
        // Create new person
        await checkinApi.createPerson(
          name.trim(),
          photoFile!,
          employeeId.trim() || undefined,
          department.trim() || undefined
        );
        alert('Person registered successfully');
      }
      
      setShowModal(false);
      loadPersons();
    } catch (error: any) {
      console.error('Failed to save person:', error);
      alert(error.response?.data?.detail || 'Failed to save person');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (person: Person) => {
    if (!confirm(`Are you sure you want to delete ${person.name}?`)) {
      return;
    }

    try {
      await checkinApi.deletePerson(person.id);
      alert('Person deleted successfully');
      loadPersons();
    } catch (error: any) {
      console.error('Failed to delete person:', error);
      alert(error.response?.data?.detail || 'Failed to delete person');
    }
  };

  const handleToggleActive = async (person: Person) => {
    try {
      await checkinApi.updatePerson(person.id, {
        is_active: !person.is_active
      });
      loadPersons();
    } catch (error: any) {
      console.error('Failed to update person:', error);
      alert(error.response?.data?.detail || 'Failed to update person');
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="mr-3" size={32} />
              Manage Persons
            </h1>
            <p className="mt-2 text-gray-600">
              Register and manage persons for face recognition
            </p>
          </div>
          <Button onClick={openCreateModal} className="flex items-center space-x-2">
            <UserPlus size={20} />
            <span>Register New Person</span>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading persons...</p>
          </div>
        ) : persons.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Persons Registered</h3>
            <p className="text-gray-600 mb-6">
              Start by registering persons with their face photos for check-in
            </p>
            <Button onClick={openCreateModal}>
              <UserPlus size={20} className="mr-2" />
              Register First Person
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {persons.map((person) => (
              <Card key={person.id} className="overflow-hidden">
                <div className="aspect-square bg-gray-200 relative">
                  {person.photo_path ? (
                    <img
                      src={`http://localhost:8000${person.photo_path.replace('./uploads', '/uploads')}`}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users size={64} className="text-gray-400" />
                    </div>
                  )}
                  {!person.is_active && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                      Inactive
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{person.name}</h3>
                  {person.employee_id && (
                    <p className="text-sm text-gray-600">ID: {person.employee_id}</p>
                  )}
                  {person.department && (
                    <p className="text-sm text-gray-600">{person.department}</p>
                  )}
                  <div className="mt-4 flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditModal(person)}
                      className="flex-1"
                    >
                      <Edit size={16} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(person)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleActive(person)}
                    className="w-full mt-2"
                  >
                    {person.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPerson ? 'Edit Person' : 'Register New Person'}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter person's name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID
              </label>
              <Input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter employee ID (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <Input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Enter department (optional)"
              />
            </div>

            {!editingPerson && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo *
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {photoPreview ? (
                    <div className="space-y-4">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-gray-600">{photoFile?.name}</p>
                      <Button variant="secondary" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}>
                        Remove Photo
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                      {isDragActive ? (
                        <p className="text-gray-600">Drop the photo here...</p>
                      ) : (
                        <>
                          <p className="text-gray-600 mb-2">
                            Drag & drop a photo here, or click to select
                          </p>
                          <p className="text-sm text-gray-500">
                            Supports: JPG, JPEG, PNG
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Please use a clear frontal face photo
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingPerson ? 'Update' : 'Register'}
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
