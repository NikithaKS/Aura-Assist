import React, { useState } from 'react';
import { ArrowLeft, Camera, Loader2, Users, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import { base44 } from '@/api/base44Client';
import { useSpeech } from '../components/VoiceController';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

export default function PeopleRecognition() {
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState('recognize'); // 'recognize' or 'add'
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonRelation, setNewPersonRelation] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const { speak } = useSpeech();
  const queryClient = useQueryClient();

  const { data: people } = useQuery({
    queryKey: ['people'],
    queryFn: () => base44.entities.Person.list(),
    initialData: []
  });

  const addPersonMutation = useMutation({
    mutationFn: (data) => base44.entities.Person.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast.success('Person added successfully');
      speak('Person added to memory');
      setNewPersonName('');
      setNewPersonRelation('');
      setCapturedImage(null);
    }
  });

  const handleCapture = async (file) => {
    setCapturedImage(file);
    setShowCamera(false);

    if (mode === 'recognize') {
      recognizePerson(file);
    }
  };

  const recognizePerson = async (file) => {
    setIsAnalyzing(true);
    speak('Analyzing face. Please wait.');

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Get descriptions of all saved people
      const peopleDescriptions = people.map(p => 
        `${p.name} (${p.relationship}): ${p.voice_description || 'No description available'}`
      ).join('\n');

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a blind person recognize someone. Analyze this photo and:
        
        1. Describe the person's appearance (age, gender, hair, clothing, facial features)
        2. Compare with these saved people in their memory:
        ${peopleDescriptions || 'No saved people yet'}
        
        3. If you find a match, say who it is and confidence level
        4. If no match, describe the person for future reference
        
        Respond in a natural, conversational way.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            person_detected: { type: "boolean" },
            match_found: { type: "boolean" },
            matched_person: { type: "string" },
            confidence: { type: "string" },
            description: { type: "string" },
            suggestion: { type: "string" }
          }
        }
      });

      setRecognitionResult(analysis);

      if (analysis.match_found) {
        speak(`I recognize this person. It's ${analysis.matched_person}. ${analysis.description}`, true);
      } else if (analysis.person_detected) {
        speak(`I see a person but don't recognize them. ${analysis.description}. ${analysis.suggestion}`, true);
      } else {
        speak('No person detected in the image. Please try again with a clearer photo.', true);
      }
    } catch (error) {
      console.error('Recognition error:', error);
      toast.error('Failed to recognize person');
      speak('Sorry, I could not analyze the photo. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddPerson = async () => {
    if (!newPersonName.trim() || !capturedImage) {
      toast.error('Please provide a name and photo');
      return;
    }

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: capturedImage });

      // Get AI description
      const description = await base44.integrations.Core.InvokeLLM({
        prompt: `Describe this person's appearance in detail for future recognition. Include: age range, gender, hair (color, style, length), facial features (eyes, nose, face shape), distinctive features, clothing style. Be concise but descriptive.`,
        file_urls: [file_url]
      });

      await addPersonMutation.mutateAsync({
        name: newPersonName,
        relationship: newPersonRelation,
        photo_url: file_url,
        voice_description: description
      });

      setMode('recognize');
    } catch (error) {
      console.error('Add person error:', error);
      toast.error('Failed to add person');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Go back">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">People Recognition</h1>
            <p className="text-gray-600">Remember and identify people</p>
          </div>
        </header>

        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setMode('recognize')}
            variant={mode === 'recognize' ? 'default' : 'outline'}
            className={`flex-1 h-14 text-lg ${mode === 'recognize' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            <Users className="h-5 w-5 mr-2" />
            Recognize
          </Button>
          <Button
            onClick={() => setMode('add')}
            variant={mode === 'add' ? 'default' : 'outline'}
            className={`flex-1 h-14 text-lg ${mode === 'add' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Add Person
          </Button>
        </div>

        {mode === 'recognize' ? (
          <div className="space-y-4">
            <Button
              onClick={() => setShowCamera(true)}
              disabled={isAnalyzing}
              className="w-full h-20 text-xl font-semibold bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-8 w-8 mr-3 animate-spin" />
                  Recognizing Person...
                </>
              ) : (
                <>
                  <Camera className="h-8 w-8 mr-3" />
                  Capture & Recognize
                </>
              )}
            </Button>

            {recognitionResult && (
              <div className={`rounded-2xl p-6 shadow-lg border-2 ${
                recognitionResult.match_found 
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-blue-200'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    {recognitionResult.match_found ? 'Person Recognized!' : 'Unknown Person'}
                  </h2>
                </div>

                {recognitionResult.match_found && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Identified as</p>
                    <p className="text-3xl font-bold text-green-700">{recognitionResult.matched_person}</p>
                    <p className="text-sm text-gray-600 mt-1">Confidence: {recognitionResult.confidence}</p>
                  </div>
                )}

                <p className="text-gray-700 text-lg leading-relaxed">{recognitionResult.description}</p>

                {recognitionResult.suggestion && (
                  <p className="text-blue-600 mt-3">{recognitionResult.suggestion}</p>
                )}

                <Button
                  onClick={() => speak(recognitionResult.description, true)}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
                >
                  Repeat Result
                </Button>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Saved People ({people.length})</h3>
              {people.length > 0 ? (
                <div className="space-y-3">
                  {people.map(person => (
                    <Card key={person.id} className="p-4">
                      <div className="flex items-center gap-4">
                        {person.photo_url && (
                          <img 
                            src={person.photo_url} 
                            alt={person.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{person.name}</p>
                          <p className="text-sm text-gray-600">{person.relationship}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No saved people yet. Switch to "Add Person" mode to start building your memory.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Person</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                  <Input
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    placeholder="Enter person's name"
                    className="text-lg h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship</label>
                  <Input
                    value={newPersonRelation}
                    onChange={(e) => setNewPersonRelation(e.target.value)}
                    placeholder="e.g., Family, Friend, Colleague"
                    className="text-lg h-12"
                  />
                </div>

                <Button
                  onClick={() => setShowCamera(true)}
                  className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700"
                >
                  <Camera className="h-6 w-6 mr-2" />
                  {capturedImage ? 'Retake Photo' : 'Capture Photo'}
                </Button>

                {capturedImage && (
                  <div className="text-center p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <p className="text-green-700 font-semibold">Photo captured ✓</p>
                  </div>
                )}

                <Button
                  onClick={handleAddPerson}
                  disabled={!newPersonName || !capturedImage || addPersonMutation.isPending}
                  className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
                >
                  {addPersonMutation.isPending ? (
                    <>
                      <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-6 w-6 mr-2" />
                      Save Person
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
          continuous={mode === 'recognize'}
        />
      )}
    </div>
  );
}