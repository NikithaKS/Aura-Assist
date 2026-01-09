import React, { useState } from 'react';
import { AlertTriangle, Phone, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSpeech } from './VoiceController';
import { toast } from 'sonner';

export default function EmergencyButton() {
  const [showDialog, setShowDialog] = useState(false);
  const [location, setLocation] = useState(null);
  const { speak } = useSpeech();

  const { data: contacts } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn: () => base44.entities.EmergencyContact.list(),
    initialData: []
  });

  const getLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  };

  const handleEmergency = () => {
    speak('Emergency mode activated. Getting your location.', true);
    getLocation();
    setShowDialog(true);
  };

  const callContact = (contact) => {
    speak(`Calling ${contact.name}`, true);
    window.location.href = `tel:${contact.phone}`;
  };

  const shareLocation = () => {
    if (location) {
      const message = `Emergency! I need help. My location: https://www.google.com/maps?q=${location.lat},${location.lng}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Emergency Location',
          text: message
        }).catch(err => console.error('Share error:', err));
      } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(message);
        toast.success('Location copied to clipboard');
      }
    }
  };

  const primaryContact = contacts.find(c => c.is_primary) || contacts[0];

  return (
    <>
      <Button
        onClick={handleEmergency}
        className="fixed bottom-6 left-6 h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 shadow-2xl z-50 animate-pulse"
        aria-label="Emergency SOS"
      >
        <AlertTriangle className="h-8 w-8" />
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Emergency Assistance
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {location && (
              <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Your Location</span>
                </div>
                <p className="text-sm text-blue-700">
                  Latitude: {location.lat.toFixed(6)}<br />
                  Longitude: {location.lng.toFixed(6)}
                </p>
                <Button
                  onClick={shareLocation}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
                >
                  Share Location
                </Button>
              </div>
            )}

            {contacts.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 mb-3">Emergency Contacts</h3>
                {contacts.map(contact => (
                  <Button
                    key={contact.id}
                    onClick={() => callContact(contact)}
                    className="w-full h-auto py-4 bg-green-600 hover:bg-green-700 justify-start"
                  >
                    <Phone className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">{contact.name}</div>
                      <div className="text-sm opacity-90">{contact.phone}</div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                <p className="text-amber-900 text-sm">
                  No emergency contacts set up. Please add contacts in Settings.
                </p>
              </div>
            )}

            <Button
              onClick={() => {
                window.location.href = 'tel:911';
              }}
              className="w-full h-16 text-lg font-bold bg-red-600 hover:bg-red-700"
            >
              <Phone className="h-6 w-6 mr-2" />
              Call 911
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}