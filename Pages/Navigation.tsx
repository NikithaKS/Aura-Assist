import React, { useState, useEffect } from 'react';
import { ArrowLeft, Navigation as NavIcon, MapPin, Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { useSpeech } from '../components/VoiceController';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Navigation() {
  const [destination, setDestination] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [directions, setDirections] = useState(null);
  const { speak } = useSpeech();

  const { data: savedLocations } = useQuery({
    queryKey: ['saved-locations'],
    queryFn: () => base44.entities.SavedLocation.list(),
    initialData: []
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          speak('Location acquired');
        },
        (error) => {
          console.error('Location error:', error);
          toast.error('Could not get your location');
          speak('Could not access your location. Please enable location services.');
        }
      );
    } else {
      toast.error('Location not supported');
      speak('Your device does not support location services.');
    }
  };

  const startNavigation = async () => {
    if (!destination.trim()) {
      toast.error('Please enter a destination');
      speak('Please enter where you want to go');
      return;
    }

    if (!currentLocation) {
      toast.error('Location not available');
      speak('I need your current location first');
      getCurrentLocation();
      return;
    }

    setIsNavigating(true);
    speak('Getting directions. Please wait.');

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a navigation assistant for a blind person. 
        
        Current location: ${currentLocation.lat}, ${currentLocation.lng}
        Destination: ${destination}
        
        Provide:
        1. Walking directions from current location to destination
        2. Estimated walking time and distance
        3. Important landmarks along the way
        4. Safety tips and things to be aware of
        5. Step-by-step directions with clear left/right turns
        
        Be clear, detailed, and encouraging. Speak as if you're guiding them personally.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            distance: { type: "string" },
            duration: { type: "string" },
            directions: { type: "string" },
            landmarks: {
              type: "array",
              items: { type: "string" }
            },
            safety_tips: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setDirections(result);
      speak(`Found directions to ${destination}. The journey is approximately ${result.distance} and will take about ${result.duration}. ${result.directions}`, true);
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Failed to get directions');
      speak('Sorry, I could not get directions. Please try again.');
    } finally {
      setIsNavigating(false);
    }
  };

  const openInMaps = () => {
    if (currentLocation && destination) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${encodeURIComponent(destination)}&travelmode=walking`;
      window.open(url, '_blank');
      speak('Opening in Google Maps');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-cyan-100 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Go back">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Navigation</h1>
            <p className="text-gray-600">Voice-guided directions</p>
          </div>
        </header>

        <div className="space-y-4">
          {currentLocation && (
            <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-cyan-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-cyan-600" />
                <p className="font-semibold text-gray-900">Current Location</p>
              </div>
              <p className="text-sm text-gray-600">
                {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-cyan-200">
            <label className="block text-lg font-bold text-gray-900 mb-3">Where do you want to go?</label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination address or place"
              className="text-lg h-14 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && startNavigation()}
            />

            {savedLocations.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">Saved Locations</p>
                <div className="space-y-2">
                  {savedLocations.map(location => (
                    <Button
                      key={location.id}
                      onClick={() => setDestination(location.address)}
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      <div className="text-left">
                        <div className="font-semibold">{location.name}</div>
                        <div className="text-xs text-gray-500">{location.address}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={startNavigation}
                disabled={isNavigating || !currentLocation}
                className="flex-1 h-16 text-lg bg-cyan-600 hover:bg-cyan-700"
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                    Getting Directions...
                  </>
                ) : (
                  <>
                    <NavIcon className="h-6 w-6 mr-2" />
                    Get Directions
                  </>
                )}
              </Button>

              {directions && (
                <Button
                  onClick={openInMaps}
                  variant="outline"
                  className="h-16 px-6"
                  aria-label="Open in Google Maps"
                >
                  <MapPin className="h-6 w-6" />
                </Button>
              )}
            </div>
          </div>

          {directions && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-cyan-200">
              <div className="flex items-center gap-2 mb-4">
                <NavIcon className="h-6 w-6 text-cyan-600" />
                <h2 className="text-xl font-bold text-gray-900">Directions</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-cyan-50 rounded-xl">
                    <p className="text-sm text-cyan-700 mb-1">Distance</p>
                    <p className="text-lg font-bold text-cyan-900">{directions.distance}</p>
                  </div>
                  <div className="p-3 bg-cyan-50 rounded-xl">
                    <p className="text-sm text-cyan-700 mb-1">Duration</p>
                    <p className="text-lg font-bold text-cyan-900">{directions.duration}</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                    {directions.directions}
                  </p>
                </div>

                {directions.landmarks?.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Landmarks Along the Way</p>
                    <ul className="space-y-1">
                      {directions.landmarks.map((landmark, index) => (
                        <li key={index} className="text-gray-700 flex gap-2">
                          <span className="text-cyan-600">•</span>
                          <span>{landmark}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {directions.safety_tips?.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                    <p className="font-semibold text-amber-900 mb-2">Safety Tips</p>
                    <ul className="space-y-1">
                      {directions.safety_tips.map((tip, index) => (
                        <li key={index} className="text-amber-800 text-sm flex gap-2">
                          <span>•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={() => speak(directions.directions, true)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  Repeat Directions
                </Button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-cyan-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Navigation Tips</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-cyan-600">•</span>
                <span>Always use a white cane or guide dog when navigating</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-600">•</span>
                <span>Listen for traffic sounds and pedestrian signals</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-600">•</span>
                <span>Ask for help if you're unsure about your location</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-600">•</span>
                <span>Share your location with emergency contacts before long walks</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}