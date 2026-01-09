import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Phone, Users, MapPin, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSpeech } from '../components/VoiceController';

export default function Settings() {
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const queryClient = useQueryClient();
  const { speak } = useSpeech();

  const { data: contacts } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn: () => base44.entities.EmergencyContact.list(),
    initialData: []
  });

  const { data: locations } = useQuery({
    queryKey: ['saved-locations'],
    queryFn: () => base44.entities.SavedLocation.list(),
    initialData: []
  });

  const addContactMutation = useMutation({
    mutationFn: (data) => base44.entities.EmergencyContact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] });
      toast.success('Contact added');
      speak('Emergency contact added');
      setNewContactName('');
      setNewContactPhone('');
      setNewContactRelation('');
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id) => base44.entities.EmergencyContact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] });
      toast.success('Contact removed');
      speak('Contact removed');
    }
  });

  const addLocationMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedLocation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-locations'] });
      toast.success('Location saved');
      speak('Location saved');
      setNewLocationName('');
      setNewLocationAddress('');
    }
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedLocation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-locations'] });
      toast.success('Location removed');
      speak('Location removed');
    }
  });

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      toast.error('Please fill in name and phone');
      return;
    }

    addContactMutation.mutate({
      name: newContactName,
      phone: newContactPhone,
      relationship: newContactRelation,
      is_primary: contacts.length === 0
    });
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim() || !newLocationAddress.trim()) {
      toast.error('Please fill in name and address');
      return;
    }

    // Get coordinates for the address
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Get the GPS coordinates (latitude and longitude) for this address: ${newLocationAddress}. Return ONLY the coordinates in this exact JSON format, nothing else.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" }
          }
        }
      });

      addLocationMutation.mutate({
        name: newLocationName,
        address: newLocationAddress,
        latitude: result.latitude,
        longitude: result.longitude
      });
    } catch (error) {
      // Save without coordinates if geocoding fails
      addLocationMutation.mutate({
        name: newLocationName,
        address: newLocationAddress
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Go back">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage contacts and preferences</p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Emergency Contacts */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Emergency Contacts</h2>
            </div>

            <div className="space-y-3 mb-4">
              <Input
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Contact name"
                className="h-12 text-lg"
              />
              <Input
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                placeholder="Phone number"
                type="tel"
                className="h-12 text-lg"
              />
              <Input
                value={newContactRelation}
                onChange={(e) => setNewContactRelation(e.target.value)}
                placeholder="Relationship (e.g., Family, Friend)"
                className="h-12 text-lg"
              />
              <Button
                onClick={handleAddContact}
                disabled={addContactMutation.isPending}
                className="w-full h-12 bg-red-600 hover:bg-red-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Contact
              </Button>
            </div>

            {contacts.length > 0 ? (
              <div className="space-y-2">
                {contacts.map(contact => (
                  <Card key={contact.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">{contact.name}</p>
                        <p className="text-sm text-gray-600">{contact.phone}</p>
                        <p className="text-xs text-gray-500">{contact.relationship}</p>
                      </div>
                      <Button
                        onClick={() => deleteContactMutation.mutate(contact.id)}
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No emergency contacts added yet</p>
            )}
          </div>

          {/* Saved Locations */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Saved Locations</h2>
            </div>

            <div className="space-y-3 mb-4">
              <Input
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Location name (e.g., Home, Work)"
                className="h-12 text-lg"
              />
              <Input
                value={newLocationAddress}
                onChange={(e) => setNewLocationAddress(e.target.value)}
                placeholder="Full address"
                className="h-12 text-lg"
              />
              <Button
                onClick={handleAddLocation}
                disabled={addLocationMutation.isPending}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Location
              </Button>
            </div>

            {locations.length > 0 ? (
              <div className="space-y-2">
                {locations.map(location => (
                  <Card key={location.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">{location.name}</p>
                        <p className="text-sm text-gray-600">{location.address}</p>
                      </div>
                      <Button
                        onClick={() => deleteLocationMutation.mutate(location.id)}
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No saved locations yet</p>
            )}
          </div>

          {/* App Info */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">About This App</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Blind Assistance is designed to help visually impaired individuals navigate their world with confidence using AI-powered features.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Version: 1.0.0</p>
              <p>Built with accessibility-first design</p>
              <p>Powered by advanced AI technology</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}