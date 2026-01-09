import React, { useState } from 'react';
import { ArrowLeft, Camera, Loader2, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import { base44 } from '@/api/base44Client';
import { useSpeech } from '../components/VoiceController';
import { toast } from 'sonner';

export default function CurrencyDetector() {
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const { speak } = useSpeech();

  const detectCurrency = async (file) => {
    setIsAnalyzing(true);
    setShowCamera(false);
    speak('Analyzing currency. Please wait.');

    try {
      // Upload image
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);

      // Analyze with AI
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a blind person identify currency. Analyze this image and:
        1. Identify any currency notes or coins visible
        2. State the denomination and currency type (USD, EUR, etc.)
        3. Count the total amount if multiple notes/coins
        4. Warn if the image shows something that is NOT real currency (toy money, printed images, etc.)
        5. Describe the condition (new, worn, torn)
        
        Be clear and concise. If no currency is visible, say so.
        Format your response as a natural sentence, for example: "This is a twenty dollar bill in good condition" or "I see three bills: one fifty, one twenty, and one ten dollar bill, totaling eighty dollars."`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            currency_detected: { type: "boolean" },
            denomination: { type: "string" },
            currency_type: { type: "string" },
            count: { type: "number" },
            total_amount: { type: "number" },
            condition: { type: "string" },
            is_genuine: { type: "boolean" },
            description: { type: "string" },
            warning: { type: "string" }
          }
        }
      });

      setResult(analysis);
      
      // Voice feedback
      if (analysis.currency_detected) {
        const warning = analysis.is_genuine === false ? ` Warning: ${analysis.warning}` : '';
        speak(`${analysis.description}${warning}`, true);
      } else {
        speak('No currency detected in the image. Please try again with better lighting or a clearer view.', true);
      }
    } catch (error) {
      console.error('Detection error:', error);
      toast.error('Failed to detect currency');
      speak('Sorry, I could not detect the currency. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Go back">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Currency Detector</h1>
            <p className="text-gray-600">Identify money denominations</p>
          </div>
        </header>

        <div className="space-y-4">
          <Button
            onClick={() => setShowCamera(true)}
            disabled={isAnalyzing}
            className="w-full h-20 text-xl font-semibold bg-green-600 hover:bg-green-700 rounded-2xl shadow-xl"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-8 w-8 mr-3 animate-spin" />
                Detecting Currency...
              </>
            ) : (
              <>
                <Camera className="h-8 w-8 mr-3" />
                Scan Currency
              </>
            )}
          </Button>

          {imageUrl && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-green-200">
              <img src={imageUrl} alt="Scanned currency" className="w-full h-64 object-cover" />
            </div>
          )}

          {result && (
            <div className={`rounded-2xl p-6 shadow-lg border-2 ${
              result.currency_detected 
                ? result.is_genuine !== false ? 'bg-white border-green-200' : 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              {result.currency_detected ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <h2 className="text-xl font-bold text-gray-900">Detection Result</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Denomination</p>
                      <p className="text-2xl font-bold text-gray-900">{result.denomination}</p>
                    </div>
                    
                    {result.count > 1 && (
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {result.currency_type} {result.total_amount}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-600">Condition</p>
                      <p className="text-lg font-semibold text-gray-800">{result.condition}</p>
                    </div>
                    
                    <p className="text-gray-700 text-lg mt-4">{result.description}</p>
                    
                    {result.is_genuine === false && result.warning && (
                      <div className="mt-4 p-4 bg-red-100 rounded-xl border-2 border-red-300">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <p className="font-bold text-red-900">Warning</p>
                        </div>
                        <p className="text-red-800">{result.warning}</p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => speak(result.description, true)}
                    className="mt-4 w-full bg-green-600 hover:bg-green-700"
                  >
                    Repeat Result
                  </Button>
                </>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                    <h2 className="text-xl font-bold text-gray-900">No Currency Detected</h2>
                  </div>
                  <p className="text-gray-700">
                    Please ensure the currency is clearly visible and well-lit, then try again.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Tips for Best Results</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-green-600">•</span>
                <span>Place the currency on a flat, contrasting surface</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">•</span>
                <span>Ensure good lighting without glare or shadows</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">•</span>
                <span>Keep the camera steady and parallel to the note</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">•</span>
                <span>Capture the entire note in the frame</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={detectCurrency}
          onClose={() => setShowCamera(false)}
          continuous={true}
        />
      )}
    </div>
  );
}