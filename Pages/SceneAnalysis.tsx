import React, { useState } from 'react';
import { ArrowLeft, Camera, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import { base44 } from '@/api/base44Client';
import { useSpeech } from '../components/VoiceController';
import { toast } from 'sonner';

export default function SceneAnalysis() {
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const analysisInProgress = React.useRef(false);
  const { speak } = useSpeech();

  const analyzeScene = async (file) => {
    if (analysisInProgress.current) return;
    
    analysisInProgress.current = true;
    setIsAnalyzing(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a blind person in REAL-TIME. Describe what you see in 1-2 SHORT sentences:
        - Main scene and objects
        - Any hazards or people
        Be VERY BRIEF. This is continuous narration.`,
        file_urls: [file_url]
      });

      setResult(analysis);
      speak(analysis, true);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      analysisInProgress.current = false;
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Go back">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scene Analysis</h1>
            <p className="text-gray-600">AI-powered scene understanding</p>
          </div>
        </header>

        <div className="space-y-4">
          <Button
            onClick={() => setShowCamera(true)}
            disabled={isAnalyzing}
            className="w-full h-20 text-xl font-semibold bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-8 w-8 mr-3 animate-spin" />
                Analyzing Scene...
              </>
            ) : (
              <>
                <Camera className="h-8 w-8 mr-3" />
                Capture & Analyze Scene
              </>
            )}
          </Button>

          {imageUrl && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-indigo-200">
              <img src={imageUrl} alt="Captured scene" className="w-full h-64 object-cover" />
            </div>
          )}

          {result && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-indigo-200">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-6 w-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">Scene Description</h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                {result}
              </p>
              <Button
                onClick={() => speak(result, true)}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Repeat Description
              </Button>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-indigo-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">How It Works</h3>
            <ol className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="font-bold text-indigo-600">1.</span>
                <span>Tap the capture button to open your camera</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-600">2.</span>
                <span>Point your camera at the scene</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-600">3.</span>
                <span>Tap the white circle to capture</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-600">4.</span>
                <span>Wait for AI analysis and voice description</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={analyzeScene}
          onClose={() => setShowCamera(false)}
          realTime={true}
          realtimeInterval={4000}
        />
      )}
    </div>
  );
}