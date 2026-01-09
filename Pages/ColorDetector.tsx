import React, { useState } from 'react';
import { ArrowLeft, Camera, Loader2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import { base44 } from '@/api/base44Client';
import { useSpeech } from '../components/VoiceController';
import { toast } from 'sonner';

export default function ColorDetector() {
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const { speak } = useSpeech();

  const detectColor = async (file) => {
    setIsAnalyzing(true);
    setShowCamera(false);
    speak('Detecting colors. Please wait.');

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a blind person identify colors. Analyze this image and:
        
        1. Identify the dominant/main colors in the image
        2. Describe what object or item has each color
        3. Mention any patterns (stripes, dots, solid)
        4. Be specific (e.g., "navy blue" not just "blue", "crimson red" not just "red")
        5. Organize by prominence (most visible first)
        
        Speak naturally, as if describing to someone in person.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            dominant_color: { type: "string" },
            colors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  color: { type: "string" },
                  object: { type: "string" },
                  shade: { type: "string" }
                }
              }
            },
            pattern: { type: "string" },
            description: { type: "string" }
          }
        }
      });

      setResult(analysis);
      speak(analysis.description, true);
    } catch (error) {
      console.error('Color detection error:', error);
      toast.error('Failed to detect colors');
      speak('Sorry, I could not detect the colors. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Go back">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Color Detector</h1>
            <p className="text-gray-600">Identify colors of objects</p>
          </div>
        </header>

        <div className="space-y-4">
          <Button
            onClick={() => setShowCamera(true)}
            disabled={isAnalyzing}
            className="w-full h-20 text-xl font-semibold bg-pink-600 hover:bg-pink-700 rounded-2xl shadow-xl"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-8 w-8 mr-3 animate-spin" />
                Detecting Colors...
              </>
            ) : (
              <>
                <Camera className="h-8 w-8 mr-3" />
                Capture & Detect Colors
              </>
            )}
          </Button>

          {imageUrl && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-pink-200">
              <img src={imageUrl} alt="Captured item" className="w-full h-64 object-cover" />
            </div>
          )}

          {result && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-200">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="h-6 w-6 text-pink-600" />
                <h2 className="text-xl font-bold text-gray-900">Color Analysis</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Dominant Color</p>
                  <p className="text-3xl font-bold text-gray-900">{result.dominant_color}</p>
                </div>

                {result.pattern && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pattern</p>
                    <p className="text-lg font-semibold text-gray-800">{result.pattern}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-2">Detected Colors</p>
                  <div className="space-y-2">
                    {result.colors?.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-xl border-2 border-gray-200">
                        <p className="font-bold text-gray-900">{item.color} {item.shade && `(${item.shade})`}</p>
                        <p className="text-gray-600 text-sm">{item.object}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-gray-200">
                  <p className="text-gray-700 text-lg leading-relaxed">{result.description}</p>
                </div>

                <Button
                  onClick={() => speak(result.description, true)}
                  className="w-full bg-pink-600 hover:bg-pink-700"
                >
                  Repeat Description
                </Button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Best Use Cases</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-pink-600">•</span>
                <span>Matching clothing items</span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-600">•</span>
                <span>Identifying paint or fabric colors</span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-600">•</span>
                <span>Checking fruit ripeness by color</span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-600">•</span>
                <span>Coordinating accessories and outfits</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={detectColor}
          onClose={() => setShowCamera(false)}
          continuous={true}
        />
      )}
    </div>
  );
}
