import React, { useState } from 'react';
import { ArrowLeft, Camera, Loader2, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import { base44 } from '@/api/base44Client';
import { useSpeech } from '../components/VoiceController';
import { toast } from 'sonner';

export default function ObjectDetector() {
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const analysisInProgress = React.useRef(false);
  const { speak } = useSpeech();

  const detectObjects = async (file) => {
    if (analysisInProgress.current) return;
    
    analysisInProgress.current = true;
    setIsAnalyzing(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a blind person navigate in REAL-TIME. In 1-2 sentences describe:
        - Main objects and positions (left/right/center/near/far)
        - Any hazards
        Be VERY BRIEF. Continuous narration.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            objects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  location: { type: "string" },
                  distance: { type: "string" }
                }
              }
            },
            hazards: {
              type: "array",
              items: { type: "string" }
            },
            description: { type: "string" }
          }
        }
      });

      setResult(analysis);
      speak(analysis.description, true);
    } catch (error) {
      console.error('Object detection error:', error);
    } finally {
      analysisInProgress.current = false;
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Go back">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Object Detector</h1>
            <p className="text-gray-600">Identify objects around you</p>
          </div>
        </header>

        <div className="space-y-4">
          <Button
            onClick={() => setShowCamera(true)}
            disabled={isAnalyzing}
            className="w-full h-20 text-xl font-semibold bg-purple-600 hover:bg-purple-700 rounded-2xl shadow-xl"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-8 w-8 mr-3 animate-spin" />
                Detecting Objects...
              </>
            ) : (
              <>
                <Camera className="h-8 w-8 mr-3" />
                Scan Environment
              </>
            )}
          </Button>

          {imageUrl && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-purple-200">
              <img src={imageUrl} alt="Environment scan" className="w-full h-64 object-cover" />
            </div>
          )}

          {result && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <Scan className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Detected Objects</h2>
              </div>

              <div className="space-y-4">
                {result.objects?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">Objects Found: {result.objects.length}</p>
                    <div className="space-y-2">
                      {result.objects.map((obj, index) => (
                        <div key={index} className="p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-bold text-purple-900 text-lg">{obj.name}</p>
                            {obj.distance && (
                              <span className="text-sm px-2 py-1 bg-purple-200 text-purple-800 rounded-full">
                                {obj.distance}
                              </span>
                            )}
                          </div>
                          <p className="text-purple-700 text-sm">{obj.location}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.hazards?.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
                    <p className="font-bold text-red-900 mb-2">⚠️ Potential Hazards</p>
                    <ul className="space-y-1">
                      {result.hazards.map((hazard, index) => (
                        <li key={index} className="text-red-800 flex gap-2">
                          <span>•</span>
                          <span>{hazard}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t-2 border-gray-200">
                  <p className="text-gray-700 text-lg leading-relaxed">{result.description}</p>
                </div>

                <Button
                  onClick={() => speak(result.description, true)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Repeat Description
                </Button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Usage Tips</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>Scan before entering new spaces</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>Point camera at eye level for best results</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>Use in well-lit areas for better detection</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-600">•</span>
                <span>Rescan after moving to a new location</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={detectObjects}
          onClose={() => setShowCamera(false)}
          realTime={true}
          realtimeInterval={4000}
        />
      )}
    </div>
  );
}